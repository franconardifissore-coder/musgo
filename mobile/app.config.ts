import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamic config: extiende app.json e inyecta variables de entorno
 * desde process.env para que la app pueda leer Supabase URL y anon key
 * desde Constants.expoConfig.extra.
 *
 * El archivo .env (NO commiteado) debe definir:
 *   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
 *
 * Las EXPO_PUBLIC_* son leídas automáticamente por Expo en runtime,
 * pero las exponemos también acá en `extra` para acceso explícito.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  updates: {
    url: 'https://u.expo.dev/e0b53be8-1ec7-412d-9637-20322f52541c',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  extra: {
    ...(config.extra ?? {}),
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? null,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? null,
  },
});
