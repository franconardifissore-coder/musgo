/**
 * Helpers de auth sobre Supabase. Cubre solo email/password para v1.
 * Google Sign-In se implementa en una fase posterior.
 */

import type { Session, User } from '@supabase/supabase-js';
import { getSupabase } from './client';

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<Session> {
  const client = getSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error('supabase_signin_no_session');
  return data.session;
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ session: Session | null; user: User | null }> {
  const client = getSupabase();
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return { session: data.session, user: data.user };
}

export async function signOut(): Promise<void> {
  const client = getSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession(): Promise<Session | null> {
  const client = getSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Suscribe a cambios de auth. Devuelve función para desuscribirse.
 * Usar en el root layout para mantener el estado del provider sincronizado.
 */
export function onAuthStateChange(
  callback: (session: Session | null) => void,
): () => void {
  const client = getSupabase();
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}
