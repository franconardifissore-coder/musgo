/**
 * Store global liviano del "garden" (plants + sections).
 *
 * Por qué no Zustand / React Query (todavía):
 * - useSyncExternalStore es nativo de React 18 y suficiente para nuestro
 *   caso: una sola fuente de datos, cambios poco frecuentes.
 * - Evita una dependencia más en el bundle de v1.
 * - Cuando el dominio crezca (cache por query, retry, paginación) migramos
 *   a React Query, pero no antes de necesitarlo.
 *
 * Patrón:
 * - `loadGarden()` hace fetch y actualiza el state global.
 * - Las actions mutan el state directamente (optimistic) y luego sincronizan
 *   con Supabase. Si falla la sync, revierten.
 * - Los componentes usan `useGarden()` para suscribirse.
 */

import { useSyncExternalStore } from 'react';
import type { Plant, Section } from '@/domain';
import {
  fetchUserGarden,
  upsertPlant as repoUpsertPlant,
  deletePlant as repoDeletePlant,
} from '@/lib/supabase/repositories';

export interface GardenState {
  plants: Plant[];
  sections: Section[];
  loading: boolean;
  /** True una vez que loadGarden() completó al menos una vez. */
  loaded: boolean;
  /** Último error de fetch/mutación (para UI). */
  error: string | null;
}

let state: GardenState = {
  plants: [],
  sections: [],
  loading: false,
  loaded: false,
  error: null,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function setState(patch: Partial<GardenState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): GardenState {
  return state;
}

/** Hook para suscribirse al state desde un componente. */
export function useGarden(): GardenState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Hook conveniente para obtener una sola planta por id. */
export function usePlant(id: string | undefined): Plant | null {
  const { plants } = useGarden();
  if (!id) return null;
  return plants.find((p) => p.id === id) ?? null;
}

/**
 * Carga inicial del garden desde Supabase. Llamarlo desde el AuthProvider
 * cuando hay sesión, o desde un layout que dependa de datos.
 */
export async function loadGarden(): Promise<void> {
  setState({ loading: true, error: null });
  try {
    const { plants, sections } = await fetchUserGarden();
    setState({ plants, sections, loading: false, loaded: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    setState({ loading: false, error: message });
  }
}

/** Limpia el state (usar en logout). */
export function clearGarden(): void {
  setState({
    plants: [],
    sections: [],
    loading: false,
    loaded: false,
    error: null,
  });
}

/**
 * Reemplaza una planta en el state (optimistic update).
 * Si la planta no existía, se agrega.
 */
export function setPlantLocal(plant: Plant): void {
  const existing = state.plants.findIndex((p) => p.id === plant.id);
  if (existing >= 0) {
    const next = state.plants.slice();
    next[existing] = plant;
    setState({ plants: next });
  } else {
    setState({ plants: [...state.plants, plant] });
  }
}

/** Quita una planta del state (optimistic). */
export function removePlantLocal(plantId: string): void {
  setState({ plants: state.plants.filter((p) => p.id !== plantId) });
}

/**
 * Reemplaza una sección en el state (optimistic).
 */
export function setSectionLocal(section: Section): void {
  const existing = state.sections.findIndex((s) => s.id === section.id);
  if (existing >= 0) {
    const next = state.sections.slice();
    next[existing] = section;
    setState({ sections: next });
  } else {
    setState({ sections: [...state.sections, section] });
  }
}

export function removeSectionLocal(sectionId: string): void {
  setState({ sections: state.sections.filter((s) => s.id !== sectionId) });
}

// Re-exporta los repos por conveniencia para las actions.
export { repoUpsertPlant, repoDeletePlant };
