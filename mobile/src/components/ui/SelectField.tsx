/**
 * SelectField: campo que abre un BottomSheet con lista de opciones.
 *
 * Reemplaza el `<select>` HTML. Cada opción es tappable, la activa se
 * resalta. Ideal para listas cortas (secciones, frecuencias predefinidas).
 *
 * Para listas muy largas, considerar un Search dentro del BottomSheet —
 * v1 no lo necesita.
 */

import { useState, type ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { useTheme } from '@/theme/ThemeProvider';
import { BottomSheet } from './BottomSheet';

export interface SelectOption<V extends string | null> {
  value: V;
  label: string;
  leftSlot?: ReactNode;
}

export interface SelectFieldProps<V extends string | null> {
  value: V;
  options: ReadonlyArray<SelectOption<V>>;
  onChange: (value: V) => void;
  placeholder?: string;
  sheetTitle?: string;
  hasError?: boolean;
  disabled?: boolean;
}

export function SelectField<V extends string | null>({
  value,
  options,
  onChange,
  placeholder = 'Elegir...',
  sheetTitle = 'Elegir',
  hasError = false,
  disabled = false,
}: SelectFieldProps<V>) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        style={{
          minHeight: 56,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: hasError ? theme.colors.danger : theme.colors.borderInput,
          backgroundColor: theme.colors.surfaceInput,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: disabled ? 0.6 : 1,
        }}
        accessibilityRole="button"
      >
        <Box direction="row" align="center" gap="2" flex={1}>
          {selected?.leftSlot}
          <Text
            variant="body"
            color={selected ? 'text' : 'textMuted'}
            numberOfLines={1}
          >
            {selected?.label ?? placeholder}
          </Text>
        </Box>
        <Text variant="body" color="textMuted">
          ›
        </Text>
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={sheetTitle}>
        <ScrollView style={{ maxHeight: 360 }}>
          <Box px="3" pb="2">
            {options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <Pressable
                  key={String(opt.value)}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: theme.radii.md,
                    backgroundColor: isActive ? theme.colors.brandSoft : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  {opt.leftSlot}
                  <Text
                    variant="bodyMedium"
                    color={isActive ? 'brand' : 'text'}
                    style={{ flex: 1 }}
                  >
                    {opt.label}
                  </Text>
                  {isActive ? (
                    <Text variant="bodyMedium" color="brand">
                      ✓
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </Box>
        </ScrollView>
      </BottomSheet>
    </>
  );
}
