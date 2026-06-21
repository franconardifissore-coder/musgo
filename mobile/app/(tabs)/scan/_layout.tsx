/**
 * Stack del scanner (tab raíz). Contiene la pantalla principal con cámara/galería
 * y la pantalla `confirm` que se abre tras seleccionar un match.
 */

import { Stack } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';

export default function ScanStackLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{}} />
      <Stack.Screen name="confirm" options={{ title: 'Confirmar planta' }} />
      <Stack.Screen name="manual" options={{ title: 'Crear manualmente' }} />
    </Stack>
  );
}
