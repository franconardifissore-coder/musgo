/**
 * ScreenHeader: header propio para pantallas internas (no-navbar).
 *
 * Reemplaza el header nativo del Stack/Tabs para tener control total y
 * consistencia entre navegadores: flecha "atrás" + título de la pantalla
 * actual, alineados a la izquierda. Sin pill, sin círculo, sin el nombre de
 * la pantalla destino.
 *
 * Uso: poner `headerShown: false` en la screen y renderizar este componente
 * como primer hijo del contenedor de la pantalla.
 */

import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { BackArrowIcon } from '@/components/icons';
import { useTheme } from '@/theme/ThemeProvider';

export interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
}

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: theme.colors.bg }}>
      <View
        style={{
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          gap: 6,
        }}
      >
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={theme.layout.hitSlop}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <BackArrowIcon size={28} color="text" />
        </Pressable>
        <Text variant="h2" color="text" numberOfLines={1} style={{ flex: 1 }}>
          {title}
        </Text>
      </View>
    </View>
  );
}
