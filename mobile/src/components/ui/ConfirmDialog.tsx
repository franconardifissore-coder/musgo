/**
 * ConfirmDialog: confirmación binaria (sí/no) montada sobre BottomSheet.
 *
 * Reemplaza el Alert.alert nativo cuando querés mantener look consistente
 * y/o usar variantes destructivas (botón rojo).
 *
 * Si necesitás una confirmación de bloqueo total (ej. "borrar cuenta"
 * con typing del email) usá BottomSheet + form propio.
 */

import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <BottomSheet visible={visible} onClose={onCancel} dismissOnBackdrop={!loading}>
      <Box px="5" pb="3" gap="3">
        <Text variant="h1">{title}</Text>
        {body ? (
          <Text variant="body" color="textMuted">
            {body}
          </Text>
        ) : null}
        <Box mt="3" gap="2">
          <Button
            label={confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            onPress={onConfirm}
            loading={loading}
            fullWidth
          />
          <Button
            label={cancelLabel}
            variant="ghost"
            onPress={onCancel}
            disabled={loading}
            fullWidth
          />
        </Box>
      </Box>
    </BottomSheet>
  );
}
