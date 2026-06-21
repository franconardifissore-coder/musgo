/**
 * Stack de plantas. Lista y detalle.
 *
 * El detalle absorbe la edición (in-place dentro de tab Detalles), por lo
 * que no hay pantalla `[id]/edit.tsx` separada (replicado del patrón web).
 *
 * El flujo de creación vive en la tab `scan` (tab raíz).
 */
import { Stack } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';

export default function PlantsStackLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Plantas' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Tu planta' }} />
    </Stack>
  );
}
