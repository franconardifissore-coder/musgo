/**
 * Tabs: segmented control horizontal full-width. 2-5 tabs como máximo
 * para que el label entre cómodo.
 *
 * Pattern: controlled. El caller mantiene `activeKey` y se notifica vía
 * `onChange`. Estilo inspirado en `.plant-detail-tabs` de la web (underline
 * para el activo, sin borde para los demás).
 *
 * Usa `Pressable` de RN directamente (no el wrapper custom) para que
 * `flex: 1` funcione correctamente sin el `Animated.View` intermedio.
 *
 *   <Tabs
 *     items={[
 *       { key: 'riegos', label: 'Riegos' },
 *       { key: 'detalles', label: 'Detalles' },
 *       { key: 'evolucion', label: 'Evolución' },
 *     ]}
 *     activeKey={tab}
 *     onChange={setTab}
 *   />
 */

import { Pressable } from 'react-native';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/ThemeProvider';

export interface TabItem<K extends string> {
  key: K;
  label: string;
}

export interface TabsProps<K extends string> {
  items: ReadonlyArray<TabItem<K>>;
  activeKey: K;
  onChange: (key: K) => void;
}

export function Tabs<K extends string>({ items, activeKey, onChange }: TabsProps<K>) {
  const theme = useTheme();
  return (
    <Box
      direction="row"
      bg="bg"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSubtle,
      }}
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={{
              flex: 1,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              borderBottomWidth: 2,
              borderBottomColor: isActive ? theme.colors.brand : 'transparent',
              marginBottom: -1, // overlap del border bottom del contenedor
            }}
          >
            <Text
              variant="bodyMedium"
              color={isActive ? 'brand' : 'text'}
              weight={isActive ? '700' : '500'}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </Box>
  );
}
