/**
 * Root layout. Stack de providers en orden:
 *   GestureHandlerRootView (requerido por reanimated + gorhom)
 *     → SafeAreaProvider
 *       → ThemeProvider
 *         → BottomSheetModalProvider (gorhom)
 *           → ToastProvider
 *             → AuthProvider
 *               → RootNav (router)
 *
 * Carga TikTok Sans con expo-font + retrasa el splash hasta que cargue
 * (o falle, en cuyo caso usamos system font como fallback).
 *
 * Mientras la sesión inicial está cargando, muestra un splash neutral
 * (evita el flash de auth-screen → tabs cuando ya hay sesión).
 */

import { Stack, useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '@/lib/auth-provider';
import { ThemeProvider, useTheme } from '@/theme';
import { ToastProvider } from '@/components/ui/Toast';

// Mantener el splash visible hasta que las fonts carguen.
SplashScreen.preventAutoHideAsync().catch(() => {
  // No-op: si esto falla, el splash igual desaparece solo.
});

function RootNav() {
  const { session, loading } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'TikTokSans-Regular':   require('../assets/fonts/TikTok_Sans/static/TikTokSans-Regular.ttf'),
    'TikTokSans-Medium':    require('../assets/fonts/TikTok_Sans/static/TikTokSans-Medium.ttf'),
    'TikTokSans-SemiBold':  require('../assets/fonts/TikTok_Sans/static/TikTokSans-SemiBold.ttf'),
    'TikTokSans-Bold':      require('../assets/fonts/TikTok_Sans/static/TikTokSans-Bold.ttf'),
    'TikTokSans-ExtraBold': require('../assets/fonts/TikTok_Sans/static/TikTokSans-ExtraBold.ttf'),
  });

  const onLayoutReady = useCallback(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Mientras no carguen las fuentes (y no haya error), bloqueamos el render
  // para no flashear con system font y después cambiar.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutReady}>
      <SafeAreaProvider>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <ToastProvider>
              <AuthProvider>
                <RootNav />
              </AuthProvider>
            </ToastProvider>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
