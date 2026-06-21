/**
 * FormField: wrapper de label + input + helper/error. Garantiza spacing y
 * tipografía consistentes en todos los formularios.
 */

import type { ReactNode } from 'react';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';

export interface FormFieldProps {
  label: string;
  helper?: string;
  error?: string | null;
  children: ReactNode;
  /** Hace el label opcional visualmente (ej. "(opcional)"). */
  optional?: boolean;
}

export function FormField({
  label,
  helper,
  error,
  children,
  optional = false,
}: FormFieldProps) {
  return (
    <Box gap="2">
      <Box direction="row" align="center" gap="2">
        <Text variant="label" color="textMuted">
          {label}
        </Text>
        {optional ? (
          <Text variant="caption" color="textMuted">
            opcional
          </Text>
        ) : null}
      </Box>
      {children}
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" color="textMuted">
          {helper}
        </Text>
      ) : null}
    </Box>
  );
}
