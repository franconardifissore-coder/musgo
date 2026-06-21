/**
 * Registro de Expo push token.
 *
 * Flujo:
 * 1. Pedir permiso de notificaciones (si no fue dado ya).
 * 2. Obtener Expo push token con Notifications.getExpoPushTokenAsync.
 * 3. Upsert en expo_push_subscriptions con (user_id, expo_token) único.
 * 4. Soft-disable las suscripciones VAPID web del usuario para evitar
 *    notificaciones duplicadas durante la ventana de coexistencia.
 *
 * Cuándo llamar: una vez por sesión, después de loguear y de cargar el
 * garden inicial. Si el usuario rechazó el permiso una vez, no insistimos
 * en la misma sesión.
 */

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSupabase } from '@/lib/supabase/client';

export type RegisterResult =
  | { status: 'registered'; token: string }
  | { status: 'denied' }
  | { status: 'unsupported'; reason: string }
  | { status: 'error'; error: string };

/**
 * Pide permisos y registra el token Expo en backend.
 * Idempotente: si el token ya está registrado, no duplica.
 */
export async function registerForPushNotifications(): Promise<RegisterResult> {
  // En simulador iOS no hay push. En Android emulator tampoco (sin Google Play
  // Services). En esos casos no es un error, es esperado.
  if (!Constants.isDevice && Platform.OS !== 'android') {
    return { status: 'unsupported', reason: 'Push solo funciona en dispositivo físico.' };
  }

  // Configuración de canal Android (requerido para mostrar notifs en Android 8+).
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  // Pedir permiso si no lo tenemos.
  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.status === 'granted';
  if (!granted && existing.canAskAgain !== false) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.status === 'granted';
  }
  if (!granted) {
    return { status: 'denied' };
  }

  // Obtener token. Para producción se puede pasar projectId desde
  // Constants.expoConfig?.extra?.eas?.projectId (definido por EAS).
  try {
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)
        ?.eas?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse.data;
    if (!token) {
      return { status: 'error', error: 'Expo no devolvió token.' };
    }

    await persistTokenAndDisableWebPush(token);

    return { status: 'registered', token };
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

async function persistTokenAndDisableWebPush(token: string): Promise<void> {
  const client = getSupabase();
  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr) throw userErr;
  const user = userData.user;
  if (!user) throw new Error('Sin usuario autenticado para registrar push token.');

  // Upsert por (user_id, expo_token).
  const { error: upsertErr } = await client
    .from('expo_push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        expo_token: token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        device_name:
          (Constants.deviceName as string | undefined) ??
          `${Platform.OS}-device`,
      },
      { onConflict: 'user_id,expo_token' },
    );
  if (upsertErr) throw upsertErr;

  // Soft-disable suscripciones VAPID web del usuario.
  // Si la columna disabled_at no existe (migration no aplicada) este update
  // va a fallar — está bien que falle ruidosamente para detectar el problema.
  const { error: disableErr } = await client
    .from('push_subscriptions')
    .update({ disabled_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('disabled_at', null);
  if (disableErr) {
    // No queremos abortar el flujo solo por esto. Logueamos y seguimos.
    console.warn('No se pudo desactivar suscripciones VAPID:', disableErr.message);
  }
}
