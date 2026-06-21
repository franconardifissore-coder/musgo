/**
 * Store global del flujo de scan.
 *
 * Por qué un store y no useState local: el flujo tiene 2 pantallas
 * (`scan/index` → `scan/confirm`). Cuando el usuario vuelve atrás desde
 * `confirm`, queremos preservar la imagen, los resultados y la selección
 * sin re-uploadear. Pasar todo por URL params no escala (el array de
 * matches es pesado y la URI de la imagen es local).
 *
 * Pattern: useSyncExternalStore, idéntico a garden-store.
 */

import { useSyncExternalStore } from 'react';
import type { IdentifyResult, PlantMatch } from './scanner';

export type ScanPhase = 'idle' | 'scanning' | 'results' | 'creating';

export interface ScanState {
  /** URI local (file://...) de la imagen tomada por el usuario, sin comprimir. */
  rawImageUri: string | null;
  /** URI comprimida que se envió al server. Útil para mostrar preview consistente. */
  processedImageUri: string | null;
  phase: ScanPhase;
  result: IdentifyResult | null;
  /** El match que el usuario eligió. Lo usamos en la pantalla `confirm`. */
  selectedMatch: PlantMatch | null;
  error: string | null;
}

const initialState: ScanState = {
  rawImageUri: null,
  processedImageUri: null,
  phase: 'idle',
  result: null,
  selectedMatch: null,
  error: null,
};

let state: ScanState = initialState;
type Listener = () => void;
const listeners = new Set<Listener>();

function setState(patch: Partial<ScanState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ScanState {
  return state;
}

export function useScan(): ScanState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function resetScan(): void {
  state = initialState;
  listeners.forEach((l) => l());
}

export function setScanPhase(phase: ScanPhase): void {
  setState({ phase });
}

export function setScanImage(rawUri: string): void {
  setState({ rawImageUri: rawUri, phase: 'scanning', error: null });
}

export function setScanProcessedImage(uri: string): void {
  setState({ processedImageUri: uri });
}

export function setScanResult(result: IdentifyResult): void {
  setState({ result, phase: 'results' });
}

export function setScanError(message: string): void {
  setState({ error: message, phase: 'idle' });
}

export function selectScanMatch(match: PlantMatch | null): void {
  setState({ selectedMatch: match });
}
