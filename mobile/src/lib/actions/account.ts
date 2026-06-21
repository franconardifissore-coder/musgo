/**
 * Account-level actions: por ahora solo borrar cuenta.
 */

import Constants from 'expo-constants';
import { clearGarden } from '@/lib/garden-store';
import { getSupabase } from '@/lib/supabase/client';

function getSupabaseFunctionsUrl(): string {
  const extra = Constants.expoConfig?.extra as
    | { supabaseUrl?: string | null }
    | undefined;
  const url = extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Supabase URL no configurado.');
  return `${url}/functions/v1`;
}

/**
 * Llama a la edge function delete-account y, si tiene éxito, limpia el
 * state local y cierra la sesión. El AuthProvider va a detectar el
 * logout y redirigir a (auth)/sign-in automáticamente.
 */
export async function deleteAccount(): Promise<void> {
  const client = getSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error('Sin sesión activa.');

  const response = await fetch(`${getSupabaseFunctionsUrl()}/delete-account`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok && response.status !== 204) {
    let message = `Error ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  // Limpiar local state + sign out (revoca el JWT en cliente).
  clearGarden();
  await client.auth.signOut();
}
