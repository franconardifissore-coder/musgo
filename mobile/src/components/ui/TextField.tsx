/**
 * TextField: input de texto con focus halo verde, padding cómodo y soporte
 * para estados de error.
 *
 * Inspirado en `.editor-input` de la web. Recalibrado a feel nativo:
 * - alto ~50px (vs. 54-56 del web)
 * - radius md (vs. 18 del web)
 * - placeholder en muted (RN no soporta los selectors :focus / :hover web)
 *
 * Tip: si necesitás multilinea, pasá `multiline` y `numberOfLines`.
 */

import { useState } from 'react';
import {
  TextInput,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  hasError?: boolean;
  size?: 'md' | 'lg';
}

export function TextField({
  hasError = false,
  size = 'md',
  onFocus,
  onBlur,
  multiline,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = hasError
    ? theme.colors.danger
    : focused
      ? theme.colors.brand
      : theme.colors.borderInput;

  const minHeight = multiline ? 100 : size === 'lg' ? 60 : 56;

  const style: TextStyle = {
    minHeight,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor,
    backgroundColor: theme.colors.surfaceInput,
    color: theme.colors.text,
    ...theme.typography.body,
  };

  return (
    <TextInput
      {...rest}
      multiline={multiline ?? false}
      placeholderTextColor={theme.colors.textMuted}
      onFocus={(e) => {
        setFocused(true);
        if (onFocus) onFocus(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        if (onBlur) onBlur(e);
      }}
      style={style}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  );
}
