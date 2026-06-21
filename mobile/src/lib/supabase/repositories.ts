/**
 * Repositorios de Plants y Sections.
 *
 * Equivalente mobile de lib/supabase-data.js (web). Hace el mapping entre
 * shape de DB (snake_case, water_log, section_id) y shape de dominio
 * (camelCase, waterLog, section).
 *
 * Devuelve los tipos de @/domain. La capa de UI no debería conocer
 * snake_case nunca.
 */

import type { Plant, PlantMetadata, Section } from '@/domain';
import { getSupabase } from './client';

interface PlantRow {
  id: string;
  user_id: string;
  name: string;
  species: string | null;
  emoji: string;
  section_id: string | null;
  freq: number;
  water_log: unknown;
  image_preview: string | null;
  identified_species: string | null;
  identification_confidence: number | string | null;
  identified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SectionRow {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

interface PlantMetadataRow {
  scientific_name: string;
  common_name: string | null;
  origin: string | null;
  light: 'directa' | 'indirecta' | null;
  watering_level: 'alto' | 'medio' | 'bajo' | null;
  watering_freq_days: number | null;
  fun_fact: string | null;
}

function mapPlantFromDb(row: PlantRow): Plant {
  return {
    id: row.id,
    name: row.name,
    species: row.species ?? '',
    emoji: row.emoji,
    section: row.section_id,
    freq: row.freq,
    waterLog: Array.isArray(row.water_log)
      ? (row.water_log as string[])
      : [],
    imagePreview: row.image_preview ?? null,
    identifiedSpecies: row.identified_species ?? '',
    identificationConfidence:
      row.identification_confidence === null
        ? null
        : Number(row.identification_confidence),
    identifiedAt: row.identified_at,
  };
}

function mapSectionFromDb(row: SectionRow): Section {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
  };
}

function mapMetadataFromDb(row: PlantMetadataRow): PlantMetadata {
  return {
    scientific_name: row.scientific_name,
    common_name: row.common_name,
    origin: row.origin,
    light: row.light,
    watering_level: row.watering_level,
    watering_freq_days: row.watering_freq_days,
    fun_fact: row.fun_fact,
  };
}

/**
 * Normaliza un nombre científico al mismo formato que usa la PK de
 * `plant_metadata`: lowercase + collapse de espacios. Sin esto,
 * "Monstera deliciosa" y "monstera  deliciosa" no joinean.
 */
function normalizeScientificName(name: string | null | undefined): string {
  if (typeof name !== 'string') return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function mapPlantToDb(plant: Plant, userId: string): Omit<PlantRow, 'created_at' | 'updated_at'> {
  return {
    id: plant.id,
    user_id: userId,
    name: plant.name,
    species: plant.species || null,
    emoji: plant.emoji,
    section_id: plant.section,
    freq: plant.freq,
    water_log: plant.waterLog,
    image_preview: plant.imagePreview || null,
    identified_species: plant.identifiedSpecies || null,
    identification_confidence: plant.identificationConfidence,
    identified_at: plant.identifiedAt,
  };
}

/** Convierte un PostgrestError (no-Error) a un Error estándar con el mensaje real. */
function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === 'object' && 'message' in err) {
    return new Error((err as { message: string }).message);
  }
  return new Error(JSON.stringify(err));
}

/**
 * Trae todas las plants y sections del usuario logueado, enriqueciendo
 * cada planta identificada con su `metadata` (cache compartido entre
 * usuarios en la tabla `plant_metadata`).
 *
 * Si la query de metadata falla, no falla el load del garden: simplemente
 * las plantas quedan sin metadata y se rehidratan lazy desde el detalle.
 */
export async function fetchUserGarden(): Promise<{
  plants: Plant[];
  sections: Section[];
}> {
  const client = getSupabase();
  const [plantsRes, sectionsRes] = await Promise.all([
    client.from('plants').select('*'),
    client.from('sections').select('*'),
  ]);
  if (plantsRes.error) throw toError(plantsRes.error);
  if (sectionsRes.error) throw toError(sectionsRes.error);

  const plantRows = (plantsRes.data as PlantRow[]) ?? [];
  const sections = ((sectionsRes.data as SectionRow[]) ?? []).map(mapSectionFromDb);
  const plants = plantRows.map(mapPlantFromDb);

  // Enriquecer plantas identificadas con su metadata.
  const scientificNames = Array.from(
    new Set(
      plantRows
        .map((row) => normalizeScientificName(row.identified_species))
        .filter(Boolean),
    ),
  );

  if (scientificNames.length > 0) {
    const { data: metaRows, error: metaError } = await client
      .from('plant_metadata')
      .select('*')
      .in('scientific_name', scientificNames);

    if (metaError) {
      // No-fatal: logueamos y seguimos con plants sin metadata.
      console.warn('[supabase] No se pudo cargar plant_metadata', metaError);
    } else if (Array.isArray(metaRows)) {
      const map = new Map<string, PlantMetadataRow>();
      for (const row of metaRows as PlantMetadataRow[]) {
        map.set(row.scientific_name, row);
      }
      for (const plant of plants) {
        const key = normalizeScientificName(plant.identifiedSpecies);
        const meta = key ? map.get(key) : null;
        if (meta) {
          plant.metadata = mapMetadataFromDb(meta);
        }
      }
    }
  }

  return { plants, sections };
}

/** Upsert de una planta (crea o actualiza). */
export async function upsertPlant(plant: Plant, userId: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('plants')
    .upsert(mapPlantToDb(plant, userId));
  if (error) throw toError(error);
}

/** Elimina una planta por id. */
export async function deletePlant(plantId: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client.from('plants').delete().eq('id', plantId);
  if (error) throw toError(error);
}
