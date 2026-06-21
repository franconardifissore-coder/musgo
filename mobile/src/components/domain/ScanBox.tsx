/**
 * ScanBox: contenedor "héroe" para la pantalla del scanner.
 *
 * Estados:
 * - idle: icono central + título + body. Tappable completo si `onPress` está definido.
 * - preview: muestra la imagen tomada/elegida
 * - loading: spinner + mensaje
 * - error: mensaje + retry
 * - result: render del slot `children` (lista de matches)
 *
 * El caller gestiona el diálogo de cámara/galería vía `onPress`.
 */

import type { ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable } from 'react-native';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { Button } from '@/components/ui/Button';
import { ScannerIcon } from '@/components/icons';
import { useTheme } from '@/theme/ThemeProvider';

export interface ScanBoxProps {
  /** URI de la imagen seleccionada (data: o file:). Si está, sustituye el icono. */
  imageUri?: string | null | undefined;
  loading?: boolean | undefined;
  error?: string | null | undefined;
  /** Tap en el box en estado idle. Normalmente abre el sheet de cámara/galería. */
  onPress?: (() => void) | undefined;
  onRetry?: (() => void) | undefined;
  /** Resultado del scan (lista de matches u otro contenido). */
  children?: ReactNode;
}

export function ScanBox({
  imageUri,
  loading = false,
  error,
  onPress,
  onRetry,
  children,
}: ScanBoxProps) {
  const theme = useTheme();
  const isIdle = !imageUri && !loading && !error;

  const boxContent = (
    <Box
      align="center"
      justify="center"
      radius="xl"
      bg="surface"
      style={{
        minHeight: 280,
        padding: 24,
        borderWidth: 1.5,
        borderColor: theme.colors.brand,
        borderStyle: 'dashed',
        gap: 14,
        overflow: 'hidden',
      }}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{
            width: '100%',
            aspectRatio: 1,
            borderRadius: theme.radii.md,
          }}
          resizeMode="cover"
        />
      ) : (
        <>
          <ScannerIcon size={64} color="brand" />
          <Text variant="h1" align="center">
            Escanear planta
          </Text>
          <Text variant="body" color="textMuted" align="center">
            Toca para elegir foto · Reconocimiento con AI
          </Text>
        </>
      )}

      {loading ? (
        <Box align="center" gap="2" mt="3">
          <ActivityIndicator color={theme.colors.brand} />
          <Text variant="bodySmall" color="textMuted">
            Identificando...
          </Text>
        </Box>
      ) : null}

      {error ? (
        <Box align="center" gap="2" mt="3">
          <Text variant="bodySmall" color="danger" align="center">
            {error}
          </Text>
          {onRetry ? (
            <Button label="Reintentar" variant="ghost" size="sm" onPress={onRetry} />
          ) : null}
        </Box>
      ) : null}
    </Box>
  );

  return (
    <Box gap="4">
      {isIdle && onPress ? (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          {boxContent}
        </Pressable>
      ) : (
        boxContent
      )}

      {children}
    </Box>
  );
}
