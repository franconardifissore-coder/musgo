/**
 * Scanner: pipeline de identificación de plantas desde una foto.
 *
 * 1. El usuario elige imagen (cámara o galería) — el caller usa
 *    expo-image-picker para esto y nos pasa la URI local.
 * 2. Comprimimos con expo-image-manipulator a max 1600px JPEG calidad 0.86
 *    (mismo target que la versión web usaba en createAnalysisImageFile).
 * 3. POSTeamos a la edge function /identify-plant como multipart form-data.
 * 4. Devolvemos los matches ordenados por confianza.
 *
 * La compresión hace dos cosas: reduce el tamaño del upload y normaliza
 * orientación (HEIC de iPhone → JPEG, rotación EXIF aplicada).
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { getSupabase } from './supabase/client';
import Constants from 'expo-constants';

export interface PlantMatch {
  scientificName: string;
  /** 0-100 */
  confidence: number;
  commonNames: string[];
  family: string | null;
  genus: string | null;
  referenceImages: Array<{
    url: string;
    organ: string | null;
    author: string | null;
  }>;
  gbifId: number | null;
}

export interface IdentifyResult {
  bestMatch: string | null;
  results: PlantMatch[];
  remainingIdentificationRequests: number | null;
}

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.86;

/** Comprime y normaliza una imagen. Devuelve URI del archivo procesado. */
export async function prepareImageForUpload(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );
  return result.uri;
}

function getSupabaseFunctionsUrl(): string {
  const extra = Constants.expoConfig?.extra as
    | { supabaseUrl?: string | null }
    | undefined;
  const url = extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Supabase URL no configurado.');
  return `${url}/functions/v1`;
}

/**
 * Sube una imagen ya comprimida a la edge function identify-plant y
 * devuelve los matches.
 *
 * Usa fetch nativo de RN con FormData. RN soporta el shape
 * `{ uri, type, name }` para representar archivos en FormData.
 */
export async function identifyPlant(imageUri: string): Promise<IdentifyResult> {
  const { data: sessionData, error: sessionErr } = await getSupabase().auth.getSession();
  if (sessionErr) throw sessionErr;
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('Sin sesión activa.');

  const formData = new FormData();
  // En RN, FormData acepta este shape para archivos locales.
  // El cast a any es necesario porque el tipo standard de FormData no lo expone.
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'plant.jpg',
  } as unknown as Blob);

  const response = await fetch(`${getSupabaseFunctionsUrl()}/identify-plant`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // NO setear Content-Type manualmente: RN agrega el boundary correcto.
    },
    body: formData,
  });

  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Respuesta no-JSON del servidor (${response.status})`);
  }

  if (!response.ok) {
    const errMsg =
      (body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : null) ?? `Error ${response.status}`;
    throw new Error(errMsg);
  }

  return body as IdentifyResult;
}

/**
 * Pipeline completo: comprime + identifica. La pantalla del scanner llama
 * esto y le pasa la URI que devolvió ImagePicker.
 */
export async function scanImage(rawImageUri: string): Promise<IdentifyResult> {
  const prepared = await prepareImageForUpload(rawImageUri);
  return identifyPlant(prepared);
}
