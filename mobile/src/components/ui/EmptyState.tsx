/**
 * EmptyState: bloque centrado con icono/emoji, título, body y CTA opcional.
 * Patrón: igual al `.empty-state` de la web pero más espaciado y minimalista.
 */

import type { ReactNode } from 'react';
import { Text as RNText } from 'react-native';
import { Box, type BoxProps } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { Button } from './Button';

export interface EmptyStateProps extends Omit<BoxProps, 'children'> {
  /** Icono o emoji a la cabeza (ej. '🌱'). Si pasás un ReactNode se renderiza tal cual. */
  icon?: ReactNode | undefined;
  title: string;
  body?: string | undefined;
  ctaLabel?: string | undefined;
  onCtaPress?: (() => void) | undefined;
}

export function EmptyState({
  icon,
  title,
  body,
  ctaLabel,
  onCtaPress,
  ...rest
}: EmptyStateProps) {
  return (
    <Box align="center" justify="center" gap="3" py="8" px="5" {...rest}>
      {icon ? (
        typeof icon === 'string' ? (
          <RNText style={{ fontSize: 48, lineHeight: 60 }}>{icon}</RNText>
        ) : (
          icon
        )
      ) : null}
      <Text variant="h1" align="center">
        {title}
      </Text>
      {body ? (
        <Text variant="body" color="textMuted" align="center">
          {body}
        </Text>
      ) : null}
      {ctaLabel && onCtaPress ? (
        <Box mt="3">
          <Button label={ctaLabel} onPress={onCtaPress} />
        </Box>
      ) : null}
    </Box>
  );
}
