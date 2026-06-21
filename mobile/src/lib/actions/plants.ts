/**
 * Acciones de plantas con optimistic updates.
 *
 * Patrón:
 * 1. Mutar el state local primero (optimistic).
 * 2. Sincronizar con Supabase.
 * 3. Si falla, revertir el state local y re-throw para que la UI muestre toast.
 *
 * Esto da feedback instantáneo al usuario (riego marcado al toque) y mantiene
 * la app sensible aunque la red esté lenta.
 */

import type { Plant, DateStr } from '@/domain';
import { toggleWaterLogDate, today } from '@/domain';
import { getSupabase } from '@/lib/supabase/client';
import {
  removePlantLocal,
  repoDeletePlant,
  repoUpsertPlant,
  setPlantLocal,
} from '@/lib/garden-store';
import { hapticSuccess, hapticTap } from '@/lib/haptics';

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await getSupabase().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('no_authenticated_user');
  return data.user.id;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Genera un UUID v4 para una planta nueva (compatible con la columna UUID de Supabase). */
function generatePlantId(): string {
  return generateUUID();
}

/**
 * Crea o actualiza una planta. Optimistic update + sync.
 * Si `plant.id` ya existe en el state, es update; si no, es create.
 */
export async function upsertPlant(plant: Plant): Promise<void> {
  const userId = await getCurrentUserId();
  const previous = plant;
  setPlantLocal(plant);
  try {
    await repoUpsertPlant(plant, userId);
  } catch (err) {
    // Revert: si era nuevo, lo quitamos; si era update, no tenemos el anterior
    // acá. Para el caso de update, lo más simple es re-fetch en el caller.
    // Para create, removePlantLocal es suficiente.
    removePlantLocal(previous.id);
    throw err;
  }
}

/**
 * Crea una planta desde un form, generando el id.
 *
 * Cuando viene del flujo de scan/confirm, se pasan también `identifiedSpecies`
 * y `identificationConfidence` para que el join con `plant_metadata` funcione
 * en el próximo `fetchUserGarden`.
 */
export async function createPlant(input: {
  name: string;
  species?: string;
  emoji?: string;
  section?: string | null;
  freq?: number;
  identifiedSpecies?: string;
  identificationConfidence?: number | null;
}): Promise<Plant> {
  const identifiedSpecies = input.identifiedSpecies ?? '';
  const plant: Plant = {
    id: generatePlantId(),
    name: input.name,
    species: input.species ?? '',
    emoji: input.emoji ?? '🌿',
    section: input.section ?? null,
    freq: input.freq ?? 3,
    waterLog: [],
    imagePreview: null,
    identifiedSpecies,
    identificationConfidence: input.identificationConfidence ?? null,
    identifiedAt: identifiedSpecies ? new Date().toISOString() : null,
  };
  await upsertPlant(plant);
  return plant;
}

/** Borra una planta. Optimistic. */
export async function deletePlant(plant: Plant): Promise<void> {
  removePlantLocal(plant.id);
  try {
    await repoDeletePlant(plant.id);
  } catch (err) {
    // Revert
    setPlantLocal(plant);
    throw err;
  }
}

/**
 * Toggle de riego en una fecha específica. Agrega o quita la fecha del
 * waterLog y sincroniza.
 *
 * Devuelve la acción que tomó ('added' | 'removed') para que el caller
 * pueda mostrar un toast adecuado.
 */
export async function toggleWaterDate(
  plant: Plant,
  dateStr: DateStr,
): Promise<'added' | 'removed'> {
  const { waterLog, action } = toggleWaterLogDate(plant.waterLog, dateStr);
  const next: Plant = { ...plant, waterLog };
  const previous = plant;

  setPlantLocal(next);
  // Haptic inmediato del tap, independiente del sync.
  hapticTap();
  try {
    const userId = await getCurrentUserId();
    await repoUpsertPlant(next, userId);
    if (action === 'added') hapticSuccess();
    return action;
  } catch (err) {
    setPlantLocal(previous);
    throw err;
  }
}

/** Atajo: marcar riego hoy. */
export async function waterToday(plant: Plant): Promise<'added' | 'removed'> {
  return toggleWaterDate(plant, today());
}
