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
      outdoor: Boolean(row.outdoor),
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
      light: row.light,
      waterLog: Array.isArray(row.water_log) ? row.water_log : [],
      imagePreview: row.image_preview || "",
      identifiedSpecies: row.identified_species || "",
      identificationConfidence: row.identification_confidence === null ? null : Number(row.identification_confidence),
      identifiedAt: row.identified_at || null,
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

    return {
      sections: (sections || []).map(mapSectionFromDb),
      plants: (plants || []).map(mapPlantFromDb),
    };
  }

  async function upsertSection(section, userId) {
    const client = getClient();
    const payload = {
      id: section.id,
      user_id: userId,
      name: section.name,
      icon: section.icon,
      outdoor: Boolean(section.outdoor),
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
      light: plant.light,
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

  async function deleteSection(sectionId) {
    const client = getClient();
    const { error } = await client.from("sections").delete().eq("id", sectionId);
    if (error) throw error;
  }

  global.supabaseData = {
    fetchUserGarden,
    upsertSection,
    upsertPlant,
    deletePlant,
    deletePlantsBySection,
    deleteSection,
  };
})(window);
