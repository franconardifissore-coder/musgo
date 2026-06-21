/**
 * Repositorio de fotos de plantas (timeline "Evolución").
 *
 * Port de `lib/supabase-data.js` (web) — funciones: fetchPlantPhotos,
 * uploadPlantPhoto, savePlantPhoto, deletePhotoEntry + uploadPlantImage
 * (para foto principal).
 *
 * Storage:
 * - bucket: `plant-images`
 * - foto principal: `{userId}/{plantId}.jpg`
 * - fotos timeline: `{userId}/photos/{plantId}/{timestampMs}.jpg`
 *
 * En mobile, en lugar de un File se trabaja con la URI local que devuelve
 * ImagePicker. Para uploadar, leemos la URI con expo-image-manipulator (que
 * además normaliza HEIC→JPEG y orientación EXIF) y la convertimos a bytes
 * reales (ArrayBuffer).
 *
 * NOTA: NO usar `fetch(uri).blob()`. En React Native ese Blob no transporta
 * los bytes correctamente hacia supabase-js storage y termina subiendo un
 * objeto vacío (0 bytes). Funciona en web porque el navegador sí produce un
 * Blob real. Por eso la foto se persistía desde la web pero no desde la app.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { getSupabase } from './client';

const STORAGE_BUCKET = 'plant-images';

export interface PlantPhoto {
  id: string;
  plantId: string;
  url: string;
  note: string;
  takenAt: string;
}

interface PhotoRow {
  id: string;
  plant_id: string;
  user_id: string;
  url: string;
  note: string | null;
  taken_at: string;
}

function mapPhotoFromDb(row: PhotoRow): PlantPhoto {
  return {
    id: row.id,
    plantId: row.plant_id,
    url: row.url,
    note: row.note ?? '',
    takenAt: row.taken_at,
  };
}

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === 'object' && 'message' in err) {
    return new Error((err as { message: string }).message);
  }
  return new Error(JSON.stringify(err));
}

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decodifica base64 a bytes sin depender de atob (no fiable en RN/Hermes). */
function base64ToUint8Array(base64: string): Uint8Array {
  const lookup = new Uint8Array(256);
  for (let i = 0; i < BASE64_CHARS.length; i++) {
    lookup[BASE64_CHARS.charCodeAt(i)] = i;
  }
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array((clean.length * 3) / 4 - padding);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = lookup[clean.charCodeAt(i)] ?? 0;
    const e2 = lookup[clean.charCodeAt(i + 1)] ?? 0;
    const e3 = lookup[clean.charCodeAt(i + 2)] ?? 0;
    const e4 = lookup[clean.charCodeAt(i + 3)] ?? 0;
    if (p < bytes.length) bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < bytes.length) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < bytes.length) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}

/**
 * Lee una URI local (file://...) y devuelve los bytes JPEG reales para subir
 * a Storage. Usa expo-image-manipulator (ya dependencia del proyecto) que:
 * - lee el archivo de forma fiable en RN,
 * - re-encodea a JPEG (normaliza HEIC de iPhone), y
 * - nos da base64 que decodificamos a un Uint8Array.
 *
 * supabase-js storage.upload() acepta Uint8Array y sube los bytes correctos.
 */
async function uriToJpegBytes(uri: string): Promise<Uint8Array> {
  const result = await ImageManipulator.manipulateAsync(uri, [], {
    base64: true,
    compress: 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  if (!result.base64) throw new Error('No pudimos leer el archivo');
  return base64ToUint8Array(result.base64);
}

/** Fetch all photos for a plant, newest first. */
export async function fetchPlantPhotos(plantId: string): Promise<PlantPhoto[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('plant_photos')
    .select('*')
    .eq('plant_id', plantId)
    .order('taken_at', { ascending: false });
  if (error) throw toError(error);
  return ((data as PhotoRow[]) ?? []).map(mapPhotoFromDb);
}

/**
 * Upload de una foto del timeline. Sube a Storage e inserta la row en
 * `plant_photos`. Devuelve la foto persistida (incluye id y url públicas).
 */
export async function uploadAndSavePhoto(params: {
  plantId: string;
  userId: string;
  uri: string;
  note: string | null;
}): Promise<PlantPhoto> {
  const { plantId, userId, uri, note } = params;
  const client = getSupabase();
  const timestamp = Date.now();
  const path = `${userId}/photos/${plantId}/${timestamp}.jpg`;
  const bytes = await uriToJpegBytes(uri);

  const { error: uploadErr } = await client.storage
    .from(STORAGE_BUCKET)
    .upload(path, bytes, {
      upsert: false,
      contentType: 'image/jpeg',
    });
  if (uploadErr) throw toError(uploadErr);

  const { data: urlData } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  const url = urlData.publicUrl;

  const { data: row, error: insertErr } = await client
    .from('plant_photos')
    .insert({
      plant_id: plantId,
      user_id: userId,
      url,
      note: note?.trim() || null,
      taken_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (insertErr) throw toError(insertErr);
  return mapPhotoFromDb(row as PhotoRow);
}

/** Borra la row + el archivo de Storage (best-effort). */
export async function deletePlantPhoto(photoId: string, photoUrl?: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client.from('plant_photos').delete().eq('id', photoId);
  if (error) throw toError(error);

  // Best-effort cleanup del archivo.
  if (photoUrl) {
    const marker = `/object/public/${STORAGE_BUCKET}/`;
    const idx = photoUrl.indexOf(marker);
    if (idx !== -1) {
      const path = photoUrl.slice(idx + marker.length);
      await client.storage
        .from(STORAGE_BUCKET)
        .remove([path])
        .catch(() => {
          // Silent: la row se borró igual.
        });
    }
  }
}

/**
 * Upload de la foto principal (avatar) de la planta. Sobrescribe el archivo
 * y devuelve la URL pública con cache-buster.
 */
export async function uploadPlantMainImage(params: {
  plantId: string;
  userId: string;
  uri: string;
}): Promise<string> {
  const { plantId, userId, uri } = params;
  const client = getSupabase();
  const path = `${userId}/${plantId}.jpg`;
  const bytes = await uriToJpegBytes(uri);

  const { error } = await client.storage
    .from(STORAGE_BUCKET)
    .upload(path, bytes, {
      upsert: true,
      contentType: 'image/jpeg',
    });
  if (error) throw toError(error);

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
