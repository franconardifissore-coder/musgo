/**
 * Cliente de plant-metadata. Llama la edge function que cachea en
 * `plant_metadata` y, ante miss, genera con Claude Haiku.
 *
 * Port de `lib/plant-metadata.js` (web) a TS estricto.
 */

import Constants from 'expo-constants';
import type { PlantMetadata } from '@/domain';

export type { PlantMetadata };

export interface PlantMetadataResponse {
  source: 'cache' | 'haiku';
  metadata: PlantMetadata | null;
  warning?: string;
}

export interface PlantMetadataError extends Error {
  code: string;
  status?: number;
  payload?: unknown;
}

function getSupabaseUrl(): string {
  const extra = Constants.expoConfig?.extra as { supabaseUrl?: string | null } | undefined;
  const url = extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Supabase URL no configurado.');
  return url;
}

function makeError(code: string, message?: string, extras?: Partial<PlantMetadataError>): PlantMetadataError {
  const err = new Error(message ?? code) as PlantMetadataError;
  err.code = code;
  if (extras?.status !== undefined) err.status = extras.status;
  if (extras?.payload !== undefined) err.payload = extras.payload;
  return err;
}

/**
 * Trae metadata de una planta dado su nombre científico.
 * - Cache hit: devuelve rápido (source='cache').
 * - Cache miss: genera con Haiku (source='haiku'). Puede tardar 2-5s.
 */
export async function fetchPlantMetadata(
  scientificName: string,
  opts: { force?: boolean } = {},
): Promise<PlantMetadataResponse> {
  if (typeof scientificName !== 'string' || !scientificName.trim()) {
    throw makeError('invalid_scientific_name', 'Nombre científico inválido');
  }

  const url = `${getSupabaseUrl()}/functions/v1/plant-metadata`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scientificName: scientificName.trim(),
        force: Boolean(opts.force),
      }),
    });
  } catch (cause) {
    const err = makeError('plant_metadata_network_error', 'Sin conexión');
    err.cause = cause;
    throw err;
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch (cause) {
    if (response.ok) {
      const err = makeError('invalid_plant_metadata_response', 'Respuesta inválida', {
        status: response.status,
      });
      err.cause = cause;
      throw err;
    }
  }

  if (!response.ok) {
    const errorField =
      data && typeof data === 'object' && 'error' in data
        ? (data as { error?: unknown }).error
        : null;
    const code =
      typeof errorField === 'string'
        ? errorField.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
        : `plant_metadata_request_failed_${response.status}`;
    const message = typeof errorField === 'string' ? errorField : code;
    throw makeError(code, message, { status: response.status, payload: data });
  }

  const obj = (data ?? {}) as {
    source?: string;
    metadata?: PlantMetadata | null;
    warning?: string;
  };
  return {
    source: obj.source === 'cache' ? 'cache' : 'haiku',
    metadata: obj.metadata ?? null,
    ...(typeof obj.warning === 'string' ? { warning: obj.warning } : {}),
  };
}

/**
 * Frecuencias disponibles en los selects de la app. Si Haiku recomienda
 * un valor que no está, snappeamos al más cercano.
 */
export const FREQ_OPTIONS = [1, 2, 3, 5, 7, 14, 30] as const;
export type FreqOption = typeof FREQ_OPTIONS[number];

export function snapToFreqOption(days: number | null | undefined): FreqOption | null {
  if (days == null || !Number.isFinite(Number(days))) return null;
  const n = Number(days);
  if (n <= 0) return null;
  let best: FreqOption = FREQ_OPTIONS[0];
  let bestDiff = Math.abs(FREQ_OPTIONS[0] - n);
  for (let i = 1; i < FREQ_OPTIONS.length; i++) {
    const opt = FREQ_OPTIONS[i];
    if (opt === undefined) continue;
    const d = Math.abs(opt - n);
    if (d < bestDiff) {
      best = opt;
      bestDiff = d;
    }
  }
  return best;
}
