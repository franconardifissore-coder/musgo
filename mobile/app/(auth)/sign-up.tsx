/**
 * Sign-up con email/password. DS-first con AuthPanel.
 *
 * Si el proyecto Supabase tiene confirmación de email activada, después del
 * signUp NO hay sesión activa — el usuario tiene que verificar el mail.
 */

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { signUpWithPassword } from '@/lib/supabase/auth';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { AuthPanel } from '@/components/domain/AuthPanel';
import { Button, FormField, TextField } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/theme/ThemeProvider';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { show: toast } = useToast();
  const { colors } = useTheme();

  async function handleSubmit() {
    if (!email.trim()) {
      setEmailError('Ingresá tu email');
      return;
    }
    if (password.length < 8) {
      setPasswordError('Mínimo 8 caracteres');
      return;
    }
    setEmailError(null);
    setPasswordError(null);
    setSubmitting(true);
    try {
      const { session } = await signUpWithPassword(email.trim(), password);
      if (!session) {
        toast('Revisá tu email para confirmar la cuenta.', { duration: 4000 });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast(message, { variant: 'danger' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <Box mb="6" align="center">
          <Text variant="display" color="brand">
            Musgo
          </Text>
        </Box>

        <AuthPanel
          title="Crear cuenta"
          subtitle="Empezá tu jardín en menos de un minuto."
          footer={
            <Box align="center">
              <Link href="/(auth)/sign-in">
                <Text variant="bodyMedium" color="brand">
                  ¿Ya tenés cuenta? Entrar
                </Text>
              </Link>
            </Box>
          }
        >
          <FormField label="Email" error={emailError}>
            <TextField
              placeholder="tu@email.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (emailError) setEmailError(null);
              }}
              editable={!submitting}
              hasError={Boolean(emailError)}
            />
          </FormField>

          <FormField label="Contraseña" helper="Mínimo 8 caracteres" error={passwordError}>
            <TextField
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password-new"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (passwordError) setPasswordError(null);
              }}
              editable={!submitting}
              hasError={Boolean(passwordError)}
            />
          </FormField>

          <Button
            label="Crear cuenta"
            onPress={handleSubmit}
            loading={submitting}
            fullWidth
            size="lg"
          />
        </AuthPanel>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
