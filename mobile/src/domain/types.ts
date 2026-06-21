/**
 * Tipos de dominio de Musgo.
 *
 * Estos tipos están escritos a mano basándose en el schema actual de Supabase
 * (ver /supabase/migrations/). Cuando se ejecute `npm run gen:supabase-types`
 * se generará `src/lib/supabase/types.gen.ts` con los tipos exactos de la DB;
 * en ese momento se puede refactorizar este archivo para derivar de allí.
 *
 * Mientras tanto, los tipos acá siguen la convención que usa el front actual:
 * - `waterLog` en camelCase (la DB lo llama `water_log` y se mapea en el repo)
 * - `section` como string id (en DB es `section_id`)
 */

/** Fecha local en formato YYYY-MM-DD. Es el formato canónico de Musgo. */
export type DateStr = string;

export interface Section {
  id: string;
  name: string;
  icon: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  emoji: string;
  /** id de la sección a la que pertenece, o null si no tiene */
  section: string | null;
  /** frecuencia de riego en días (default 3) */
  freq: number;
  /** array de fechas YYYY-MM-DD en las que se regó */
  waterLog: DateStr[];
  imagePreview: string | null;
  identifiedSpecies: string;
  identificationConfidence: number | null;
  identifiedAt: string | null;
  /**
   * Metadata enriquecida por Haiku (luz / riego / origen / fun fact).
   * Cargada en `fetchUserGarden` vía join con `plant_metadata` para las plantas
   * con `identifiedSpecies`. Para plantas manuales o no identificadas, undefined.
   */
  metadata?: PlantMetadata;
  /** True mientras se hace fetch lazy de la metadata desde el detalle. */
  metadataLoading?: boolean;
  metadataError?: string | null;
}

export interface PlantMetadata {
  scientific_name: string;
  common_name: string | null;
  origin: string | null;
  light: 'directa' | 'indirecta' | null;
  watering_level: 'alto' | 'medio' | 'bajo' | null;
  watering_freq_days: number | null;
  /** Curiosidad generada por Haiku. Opcional para cache rows viejos. */
  fun_fact?: string | null;
}

/**
 * Proyección de riego para el dashboard: cuántas plantas tienen sed
 * cada día, durante los próximos N días.
 */
export interface DashboardWaterProjectionDay {
  dateStr: DateStr;
  label: string;
  watered: number;
  thirsty: number;
  total: number;
}
