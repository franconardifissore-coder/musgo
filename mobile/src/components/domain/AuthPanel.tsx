/**
 * AuthPanel: contenedor de los forms de sign-in/sign-up. Card con padding
 * generoso y header con título + subtítulo.
 *
 * No incluye Google Sign-In (lo agregamos cuando esté el flujo nativo
 * resuelto — ver expo-store-migration-plan.md, Fase 4).
 */

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';

export interface AuthPanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthPanel({ title, subtitle, children, footer }: AuthPanelProps) {
  return (
    <Card variant="elevated" p="6" radius="xl">
      <Box gap="6">
        <Box gap="2">
          <Text variant="title">{title}</Text>
          {subtitle ? (
            <Text variant="body" color="textMuted">
              {subtitle}
            </Text>
          ) : null}
        </Box>
        <Box gap="4">{children}</Box>
        {footer ? <Box>{footer}</Box> : null}
      </Box>
    </Card>
  );
}
