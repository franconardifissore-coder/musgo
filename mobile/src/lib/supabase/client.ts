/**
 * Cliente Supabase para React Native con persistencia de sesión.
 *
 * Estrategia de storage:
 * - SecureStore para los tokens de auth (cifrado por el OS: Keychain en iOS,
 *   EncryptedSharedPreferences en Android).
 * - Fallback a AsyncStorage si el token excede el límite de SecureStore
 *   (~2 KB en iOS). Los JWT de Supabase suelen entrar pero curamos el caso.
 *
 * URL y anon key se leen de Constants.expoConfig.extra, que a su vez se
 * pueblan en app.config.ts desde process.env.EXPO_PUBLIC_*.
 */

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const SECURE_STORE_MAX_BYTES = 2048;

const hybridStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const fromSecure = await SecureStore.getItemAsync(key);
      if (fromSecure !== null) return fromSecure;
    } catch {
      // Si SecureStore falla (ej. valor demasiado grande, no encontrado),
      // caemos a AsyncStorage.
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    const byteLength = new Blob([value]).size;
    if (byteLength <= SECURE_STORE_MAX_BYTES) {
      try {
        await SecureStore.setItemAsync(key, value);
        // Limpieza por las dudas: si antes había una versión grande en
        // AsyncStorage, la borramos para evitar leerla en el próximo getItem.
        await AsyncStorage.removeItem(key);
        return;
      } catch {
        // Fallback abajo.
      }
    }
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
    await AsyncStorage.removeItem(key);
  },
};

function readConfig(): { url: string; anonKey: string } {
  const extra = Constants.expoConfig?.extra as
    | { supabaseUrl?: string | null; supabaseAnonKey?: string | null }
    | undefined;
  const url = extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = extra?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Supabase no está configurado. Definí EXPO_PUBLIC_SUPABASE_URL y ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY en .env y reiniciá el bundler.',
    );
  }
  return { url, anonKey };
}

let client: SupabaseClient | null = null;

/** Devuelve el cliente Supabase (singleton, lazy). */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  const { url, anonKey } = readConfig();
  client = createClient(url, anonKey, {
    auth: {
      storage: hybridStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // RN no usa URL hash flow
    },
  });
  return client;
}
