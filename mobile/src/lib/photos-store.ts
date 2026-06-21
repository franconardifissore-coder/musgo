/**
 * Store local de fotos por planta.
 *
 * Patrón: bucket por plantId. `usePhotos(plantId)` se suscribe al bucket.
 * `loadPhotos`, `addPhoto`, `deletePhoto` mutan el bucket optimistically.
 *
 * Mismo pattern que garden-store (useSyncExternalStore + module-level state).
 */

import { useSyncExternalStore } from 'react';
import {
  deletePlantPhoto,
  fetchPlantPhotos,
  uploadAndSavePhoto,
  type PlantPhoto,
} from './supabase/photos';
import { getSupabase } from './supabase/client';

export interface PhotosBucket {
  photos: PlantPhoto[];
  loading: boolean;
  error: string | null;
}

const EMPTY: PhotosBucket = { photos: [], loading: false, error: null };

let state: Record<string, PhotosBucket> = {};
type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((l) => l());
}

function setBucket(plantId: string, patch: Partial<PhotosBucket>): void {
  const current = state[plantId] ?? EMPTY;
  state = { ...state, [plantId]: { ...current, ...patch } };
  notify();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshotFor(plantId: string): PhotosBucket {
  return state[plantId] ?? EMPTY;
}

/** Hook: suscribirse al bucket de una planta. */
export function usePhotos(plantId: string): PhotosBucket {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshotFor(plantId),
    () => getSnapshotFor(plantId),
  );
}

/** Carga las fotos de la planta. Idempotente: si ya está loading, no re-lanza. */
export async function loadPhotos(plantId: string): Promise<void> {
  const current = state[plantId] ?? EMPTY;
  if (current.loading) return;
  setBucket(plantId, { loading: true, error: null });
  try {
    const photos = await fetchPlantPhotos(plantId);
    setBucket(plantId, { photos, loading: false });
  } catch (err) {
    setBucket(plantId, {
      loading: false,
      error: err instanceof Error ? err.message : 'No pudimos cargar las fotos.',
    });
  }
}

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await getSupabase().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('no_authenticated_user');
  return data.user.id;
}

/** Upload + insert + prepend al bucket. */
export async function addPhoto(params: {
  plantId: string;
  uri: string;
  note: string | null;
}): Promise<PlantPhoto> {
  const userId = await getCurrentUserId();
  const photo = await uploadAndSavePhoto({ ...params, userId });
  const current = state[params.plantId] ?? EMPTY;
  setBucket(params.plantId, { photos: [photo, ...current.photos] });
  return photo;
}

/** Optimistic delete + sync. Si falla, restaura. */
export async function deletePhoto(plantId: string, photoId: string): Promise<void> {
  const current = state[plantId] ?? EMPTY;
  const photo = current.photos.find((p) => p.id === photoId);
  if (!photo) return;
  setBucket(plantId, { photos: current.photos.filter((p) => p.id !== photoId) });
  try {
    await deletePlantPhoto(photoId, photo.url);
  } catch (err) {
    // Revert: re-agregamos la foto.
    setBucket(plantId, { photos: [photo, ...state[plantId]!.photos] });
    throw err;
  }
}

export function getUserIdAsync(): Promise<string> {
  return getCurrentUserId();
}
