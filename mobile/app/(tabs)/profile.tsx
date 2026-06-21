/**
 * Perfil del usuario. DS-first.
 *
 * - ProfileCard con email + stats (plantas / espacios)
 * - Cerrar sesión
 * - Eliminar cuenta (Apple requirement). Confirma con BottomSheet + email typing.
 */

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '@/lib/auth-provider';
import { signOut } from '@/lib/supabase/auth';
import { deleteAccount } from '@/lib/actions/account';
import { useGarden } from '@/lib/garden-store';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { ProfileCard } from '@/components/domain/ProfileCard';
import { Button, BottomSheet, TextField, FormField } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/theme/ThemeProvider';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { plants, sections } = useGarden();
  const { show: toast } = useToast();
  const { colors } = useTheme();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  async function handleLogout() {
    try {
      await signOut();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No pudimos cerrar sesión', { variant: 'danger' });
    }
  }

  async function handleConfirmDelete() {
    if (!user?.email) return;
    if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      setConfirmError('Tipeá exactamente tu email');
      return;
    }
    setConfirmError(null);
    setBusy(true);
    try {
      await deleteAccount();
      // El AuthProvider va a detectar el logout y mandarnos a sign-in.
    } catch (err) {
      setBusy(false);
      toast(err instanceof Error ? err.message : 'No pudimos eliminar', { variant: 'danger' });
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
        <ProfileCard
          email={user?.email ?? '—'}
          stats={[
            { label: 'Plantas', value: plants.length },
            { label: 'Espacios', value: sections.length },
          ]}
        />

        <Box gap="2">
          <Button label="Cerrar sesión" variant="secondary" onPress={handleLogout} fullWidth />
        </Box>

        <Box mt="5" gap="3">
          <Text variant="label" color="textMuted">
            Zona peligrosa
          </Text>
          <Button
            label="Eliminar mi cuenta"
            variant="danger"
            onPress={() => setDeleteOpen(true)}
            fullWidth
          />
          <Text variant="caption" color="textMuted">
            Se borran todas tus plantas, espacios y notificaciones de forma permanente.
          </Text>
        </Box>
      </ScrollView>

      <BottomSheet
        visible={deleteOpen}
        onClose={() => {
          if (busy) return;
          setDeleteOpen(false);
          setConfirmEmail('');
          setConfirmError(null);
        }}
        title="Eliminar cuenta"
        dismissOnBackdrop={!busy}
      >
        <Box px="5" gap="4">
          <Text variant="body" color="textMuted">
            Esta acción es irreversible. Para confirmar, tipeá tu email:{' '}
            <Text variant="bodyMedium" color="danger">{user?.email}</Text>
          </Text>
          <FormField label="Confirmar email" error={confirmError}>
            <TextField
              placeholder={user?.email ?? ''}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={confirmEmail}
              onChangeText={(v) => {
                setConfirmEmail(v);
                if (confirmError) setConfirmError(null);
              }}
              editable={!busy}
              hasError={Boolean(confirmError)}
            />
          </FormField>
          <Box gap="2">
            <Button
              label="Eliminar definitivamente"
              variant="danger"
              onPress={handleConfirmDelete}
              loading={busy}
              fullWidth
            />
            <Button
              label="Cancelar"
              variant="ghost"
              onPress={() => {
                setDeleteOpen(false);
                setConfirmEmail('');
                setConfirmError(null);
              }}
              disabled={busy}
              fullWidth
            />
          </Box>
        </Box>
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}
