/**
 * Acciones de secciones (espacios).
 *
 * Las secciones agrupan plantas. Funcionalidad principal:
 * - CRUD básico.
 * - "Regar toda la sección": marca riego hoy en todas las plantas que
 *   pertenecen a esa sección, en una sola pasada. Útil para usuarios
 *   que riegan por habitación/zona.
 */

import type { Plant, Section } from '@/domain';
import { today } from '@/domain';
import { getSupabase } from '@/lib/supabase/client';
import {
  removeSectionLocal,
  repoUpsertPlant,
  setPlantLocal,
  setSectionLocal,
} from '@/lib/garden-store';

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

function generateSectionId(): string {
  return generateUUID();
}

interface SectionRowInsert {
  id: string;
  user_id: string;
  name: string;
  icon: string;
}

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === 'object' && 'message' in err) {
    return new Error((err as { message: string }).message);
  }
  return new Error(JSON.stringify(err));
}

async function repoUpsertSection(section: Section, userId: string): Promise<void> {
  const row: SectionRowInsert = {
    id: section.id,
    user_id: userId,
    name: section.name,
    icon: section.icon,
  };
  const { error } = await getSupabase().from('sections').upsert(row);
  if (error) throw toError(error);
}

async function repoDeleteSection(sectionId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('sections')
    .delete()
    .eq('id', sectionId);
  if (error) throw error;
}

/** Upsert de sección (crea o actualiza) con optimistic update. */
export async function upsertSection(section: Section): Promise<void> {
  const userId = await getCurrentUserId();
  setSectionLocal(section);
  try {
    await repoUpsertSection(section, userId);
  } catch (err) {
    removeSectionLocal(section.id);
    throw err;
  }
}

export async function createSection(input: {
  name: string;
  icon?: string;
}): Promise<Section> {
  const section: Section = {
    id: generateSectionId(),
    name: input.name,
    icon: input.icon ?? '🪴',
  };
  await upsertSection(section);
  return section;
}

/**
 * Borra una sección. Por el ON DELETE CASCADE del schema, las plantas
 * de esa sección tienen su `section_id` puesto en null en DB.
 * Acá replicamos ese efecto en el state local para que la UI quede
 * consistente sin necesidad de re-fetch.
 *
 * Wait — releyendo migration: ON DELETE CASCADE en plants borra la
 * planta entera. Eso es destructivo y probablemente no deseado en mobile
 * (el usuario probablemente quiere quitar la sección pero conservar
 * las plantas). Para evitar borrar plantas por accidente, ANTES de
 * borrar la sección le quitamos el section_id a las plantas afectadas.
 */
export async function deleteSection(
  section: Section,
  plantsInSection: Plant[],
): Promise<void> {
  const userId = await getCurrentUserId();

  // 1. Detach plantas de la sección (set section=null en cada una).
  const previousPlants = plantsInSection.map((p) => ({ ...p }));
  for (const plant of plantsInSection) {
    const detached: Plant = { ...plant, section: null };
    setPlantLocal(detached);
  }

  // 2. Quitar sección del state local.
  removeSectionLocal(section.id);

  try {
    // Persistir el detach primero, para que el delete cascade no se lleve plantas.
    for (const plant of plantsInSection) {
      const detached: Plant = { ...plant, section: null };
      await repoUpsertPlant(detached, userId);
    }
    await repoDeleteSection(section.id);
  } catch (err) {
    // Revert: restaurar la sección y las plantas como estaban.
    setSectionLocal(section);
    for (const original of previousPlants) {
      setPlantLocal(original);
    }
    throw err;
  }
}

/**
 * Marca riego hoy en todas las plantas de una sección que no lo tengan ya.
 * Optimistic: actualiza state local primero, sincroniza después.
 * Si alguno falla, recargá el garden con loadGarden() — no intentamos
 * un revert granular acá.
 */
export async function waterSectionToday(
  sectionId: string,
  plantsInSection: Plant[],
): Promise<{ updated: number; skipped: number }> {
  const userId = await getCurrentUserId();
  const todayStr = today();

  const toUpdate = plantsInSection.filter(
    (p) => !p.waterLog.includes(todayStr),
  );

  // Optimistic en local.
  for (const plant of toUpdate) {
    const next: Plant = {
      ...plant,
      waterLog: [...plant.waterLog, todayStr].sort(),
    };
    setPlantLocal(next);
  }

  // Sync secuencial: simple, predecible. Para v1 está bien.
  // (Si después hay 50+ plantas por sección, paralelizamos con Promise.all.)
  for (const plant of toUpdate) {
    const next: Plant = {
      ...plant,
      waterLog: [...plant.waterLog, todayStr].sort(),
    };
    await repoUpsertPlant(next, userId);
  }

  return { updated: toUpdate.length, skipped: plantsInSection.length - toUpdate.length };
}
