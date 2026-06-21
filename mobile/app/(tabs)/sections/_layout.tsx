import { Stack } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';

export default function SectionsStackLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Espacios' }} />
      <Stack.Screen name="new" options={{ title: 'Nuevo espacio', presentation: 'modal' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Espacio' }} />
      <Stack.Screen
        name="[id]/edit"
        options={{ title: 'Editar espacio', presentation: 'modal' }}
      />
    </Stack>
  );
}
