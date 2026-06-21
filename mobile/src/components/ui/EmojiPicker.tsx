/**
 * EmojiPicker: grid de emojis preestablecidos. Tap selecciona y dispara
 * onChange. Diseñado para presets cortos (10-20 opciones). Si llegamos a
 * necesitar búsqueda o categorías, abrir bottom sheet con SearchInput.
 *
 * Para casos simples (PlantForm, SectionForm), la grid inline alcanza.
 */

import { Text as RNText } from 'react-native';
import { Box } from '@/components/primitives/Box';
import { Pressable } from '@/components/primitives/Pressable';
import { useTheme } from '@/theme/ThemeProvider';

export interface EmojiPickerProps {
  value: string;
  options: readonly string[];
  onChange: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiPicker({ value, options, onChange, disabled = false }: EmojiPickerProps) {
  const theme = useTheme();
  return (
    <Box direction="row" wrap="wrap" gap="2">
      {options.map((e) => {
        const active = e === value;
        return (
          <Pressable
            key={e}
            onPress={() => onChange(e)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              width: 48,
              height: 48,
              borderRadius: theme.radii.md,
              backgroundColor: active ? theme.colors.brandSoft : theme.colors.surfaceSunken,
              borderWidth: active ? 2 : 1,
              borderColor: active ? theme.colors.brand : theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <RNText style={{ fontSize: 26, lineHeight: 34 }}>{e}</RNText>
          </Pressable>
        );
      })}
    </Box>
  );
}
