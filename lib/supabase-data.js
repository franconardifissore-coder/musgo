(function attachSupabaseDataApi(global) {
  function getClient() {
    const authApi = global.supabaseAuth;
    if (!authApi || !authApi.isConfigured || !authApi.isConfigured()) {
      throw new Error("supabase_auth_not_configured");
    }
    const client = authApi.getClient && authApi.getClient();
    if (!client) {
      throw new Error("supabase_client_unavailable");
    }
    return client;
  }

  function mapSectionFromDb(row) {
    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
    };
  }

  function mapPlantFromDb(row) {
    return {
      id: row.id,
      name: row.name,
      species: row.species || "",
      emoji: row.emoji,
      section: row.section_id,
      freq: row.freq,
      waterLog: Array.isArray(row.water_log) ? row.water_log : [],
      imagePreview: row.image_preview || "",
      identifiedSpecies: row.identified_species || "",
      identificationConfidence: row.identification_confidence === null ? null : Number(row.identification_confidence),
      identifiedAt: row.identified_at || null,
    };
  }

  // Normaliza un nombre científico al mismo formato que usa la PK de
  // plant_metadata: lowercase + collapse de espacios. Sin esto, "Monstera
  // deliciosa" y "monstera  deliciosa" no joinean.
  function normalizeScientificName(name) {
    if (typeof name !== "string") return "";
    return name.trim().toLowerCase().replace(/\s+/g, " ");
  }

  // Mapea una fila de plant_metadata al shape `metadata` que el front
  // espera (igual al que devuelve la edge function plant-metadata).
  function mapMetadataFromDb(row) {
    return {
      scientific_name: row.scientific_name,
      common_name: row.common_name || null,
      origin: row.origin || null,
      light: row.light || null,
      watering_level: row.watering_level || null,
      watering_freq_days: row.watering_freq_days ?? null,
    };
  }

  async function fetchUserGarden() {
    const client = getClient();

    const [{ data: sections, error: sectionsError }, { data: plants, error: plantsError }] = await Promise.all([
      client.from("sections").select("*").order("created_at", { ascending: true }),
      client.from("plants").select("*").order("created_at", { ascending: true }),
    ]);

    if (sectionsError) throw sectionsError;
    if (plantsError) throw plantsError;

    const plantRows = plants || [];

    // Para enriquecer cada plant con su metadata (luz / riego / origen /
    // common_name), traemos las filas relevantes de plant_metadata en
    // una sola query. Es un cache compartido: cualquier usuario que ya
    // haya identificado la misma especie generó la fila.
    const scientificNames = Array.from(new Set(
      plantRows
        .map((row) => normalizeScientificName(row.identified_species))
        .filter(Boolean)
    ));

    const metadataMap = new Map();
    if (scientificNames.length > 0) {
      const { data: metadataRows, error: metadataError } = await client
        .from("plant_metadata")
        .select("*")
        .in("scientific_name", scientificNames);

      // Tratamos un error acá como no-fatal: el resto del jardín sigue
      // siendo válido y la metadata se puede recuperar lazy desde el
      // detalle. Solo lo logueamos.
      if (metadataError) {
        console.warn("[supabase] Failed to load plant_metadata cache", metadataError);
      } else if (Array.isArray(metadataRows)) {
        for (const row of metadataRows) {
          metadataMap.set(row.scientific_name, row);
        }
      }
    }

    return {
      sections: (sections || []).map(mapSectionFromDb),
      plants: plantRows.map((row) => {
        const plant = mapPlantFromDb(row);
        const key = normalizeScientificName(row.identified_species);
        const metaRow = key ? metadataMap.get(key) : null;
        if (metaRow) {
          plant.metadata = mapMetadataFromDb(metaRow);
        }
        return plant;
      }),
    };
  }

  async function upsertSection(section, userId) {
    const client = getClient();
    const payload = {
      id: section.id,
      user_id: userId,
      name: section.name,
      icon: section.icon,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from("sections").upsert(payload);
    if (error) throw error;
  }

  async function upsertPlant(plant, userId) {
    const client = getClient();
    const payload = {
      id: plant.id,
      user_id: userId,
      name: plant.name,
      species: plant.species || null,
      emoji: plant.emoji,
      section_id: plant.section || null,
      freq: plant.freq,
      water_log: Array.isArray(plant.waterLog) ? plant.waterLog : [],
      image_preview: plant.imagePreview || null,
      identified_species: plant.identifiedSpecies || null,
      identification_confidence: plant.identificationConfidence ?? null,
      identified_at: plant.identifiedAt || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from("plants").upsert(payload);
    if (error) throw error;
  }

  async function deletePlant(plantId) {
    const client = getClient();
    const { error } = await client.from("plants").delete().eq("id", plantId);
    if (error) throw error;
  }

  async function deletePlantsBySection(sectionId) {
    const client = getClient();
    const { error } = await client.from("plants").delete().eq("section_id", sectionId);
    if (error) throw error;
  }

  async function clearPlantSection(sectionId) {
    const client = getClient();
    const { error } = await client.from("plants").update({
      section_id: null,
      updated_at: new Date().toISOString(),
    }).eq("section_id", sectionId);
    if (error) throw error;
  }

  async function deleteSection(sectionId) {
    const client = getClient();
    const { error } = await client.from("sections").delete().eq("id", sectionId);
    if (error) throw error;
  }

  // ===== STORAGE =====

  const STORAGE_BUCKET = "plant-images";

  // Uploads a plant image File to Storage under {userId}/{plantId}.jpg
  // Returns the public URL string.
  async function uploadPlantImage(plantId, userId, file) {
    const client = getClient();
    const path = `${userId}/${plantId}.jpg`;

    const { error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        upsert: true,
        contentType: "image/jpeg",
      });

    if (error) throw error;

    const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    // Append cache-buster so the new URL is treated as fresh by browsers.
    // This is stored in the DB, so it persists across sessions.
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  // Deletes a plant image from Storage given its public URL.
  // Safe to call even if the URL is not a Storage URL — it will just do nothing.
  async function deletePlantImage(imageUrl) {
    if (!imageUrl || typeof imageUrl !== "string") return;

    const marker = `/object/public/${STORAGE_BUCKET}/`;
    const idx = imageUrl.indexOf(marker);
    if (idx === -1) return; // not a Storage URL, skip

    const path = imageUrl.slice(idx + marker.length);
    const client = getClient();
    const { error } = await client.storage.from(STORAGE_BUCKET).remove([path]);
    if (error) throw error;
  }

  // Migrates all plants whose image_preview is a base64 data URL to Storage.
  // Calls onProgress({ migrated, failed, total, plantId }) after each plant.
  // Returns { migrated, failed }.
  async function migrateBase64ImagesToStorage(onProgress) {
    const client = getClient();

    const { data: plants, error } = await client
      .from("plants")
      .select("id, user_id, image_preview")
      .not("image_preview", "is", null)
      .like("image_preview", "data:%");

    if (error) throw error;
    if (!plants || plants.length === 0) return { migrated: 0, failed: 0 };

    let migrated = 0;
    let failed = 0;
    const total = plants.length;

    for (const plant of plants) {
      try {
        // Convert base64 data URL to a Blob/File
        const fetchRes = await fetch(plant.image_preview);
        const blob = await fetchRes.blob();
        const file = new File([blob], `${plant.id}.jpg`, { type: "image/jpeg" });

        // Upload to Storage
        const url = await uploadPlantImage(plant.id, plant.user_id, file);

        // Update the DB record
        const { error: updateError } = await client
          .from("plants")
          .update({ image_preview: url, updated_at: new Date().toISOString() })
          .eq("id", plant.id);

        if (updateError) throw updateError;

        migrated++;
      } catch (err) {
        console.error(`[migrate] Failed for plant ${plant.id}:`, err);
        failed++;
      }

      if (typeof onProgress === "function") {
        onProgress({ migrated, failed, total, plantId: plant.id });
      }
    }

    return { migrated, failed };
  }

  // ===== PLANT PHOTOS =====

  function mapPhotoFromDb(row) {
    return {
      id: row.id,
      plantId: row.plant_id,
      url: row.url,
      note: row.note || "",
      takenAt: row.taken_at,
    };
  }

  // Fetches all photos for a given plant, newest first.
  async function fetchPlantPhotos(plantId) {
    const client = getClient();
    const { data, error } = await client
      .from("plant_photos")
      .select("*")
      .eq("plant_id", plantId)
      .order("taken_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapPhotoFromDb);
  }

  // Uploads a photo File to Storage under {userId}/photos/{plantId}/{timestampMs}.jpg
  // Returns the public URL string.
  async function uploadPlantPhoto(plantId, userId, file) {
    const client = getClient();
    const timestamp = Date.now();
    const path = `${userId}/photos/${plantId}/${timestamp}.jpg`;

    const { error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        upsert: false,
        contentType: "image/jpeg",
      });

    if (error) throw error;

    const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  // Inserts a plant_photos row. Returns the new photo object.
  async function savePlantPhoto(plantId, userId, url, note) {
    const client = getClient();
    const payload = {
      plant_id: plantId,
      user_id: userId,
      url,
      note: note || null,
      taken_at: new Date().toISOString(),
    };
    const { data, error } = await client
      .from("plant_photos")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return mapPhotoFromDb(data);
  }

  // Deletes a photo row and its Storage file.
  async function deletePhotoEntry(photoId, photoUrl) {
    const client = getClient();

    // Remove from DB first
    const { error: dbError } = await client
      .from("plant_photos")
      .delete()
      .eq("id", photoId);
    if (dbError) throw dbError;

    // Remove from Storage (best-effort)
    if (photoUrl && typeof photoUrl === "string") {
      const marker = `/object/public/${STORAGE_BUCKET}/`;
      const idx = photoUrl.indexOf(marker);
      if (idx !== -1) {
        const path = photoUrl.slice(idx + marker.length);
        await client.storage.from(STORAGE_BUCKET).remove([path]).catch(() => {});
      }
    }
  }

  global.supabaseData = {
    fetchUserGarden,
    upsertSection,
    upsertPlant,
    deletePlant,
    deletePlantsBySection,
    clearPlantSection,
    deleteSection,
    uploadPlantImage,
    deletePlantImage,
    migrateBase64ImagesToStorage,
    fetchPlantPhotos,
    uploadPlantPhoto,
    savePlantPhoto,
    deletePhotoEntry,
  };
})(window);
