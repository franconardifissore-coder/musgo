/**
 * Sign-in con email/password. Diseño DS-first con AuthPanel.
 */

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { signInWithPassword } from '@/lib/supabase/auth';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { AuthPanel } from '@/components/domain/AuthPanel';
import { Button, FormField, TextField } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/theme/ThemeProvider';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { show: toast } = useToast();
  const { colors } = useTheme();

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setEmailError(!email.trim() ? 'Ingresá tu email' : null);
      toast('Email y contraseña son obligatorios', { variant: 'danger' });
      return;
    }
    setEmailError(null);
    setSubmitting(true);
    try {
      await signInWithPassword(email.trim(), password);
      // El redirect lo hace RootLayout cuando recibe el evento de auth.
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
          <Text variant="body" color="textMuted" align="center">
            Tu jardín, organizado.
          </Text>
        </Box>

        <AuthPanel
          title="Entrar"
          subtitle="Bienvenido de vuelta a tu jardín."
          footer={
            <Box align="center">
              <Link href="/(auth)/sign-up">
                <Text variant="bodyMedium" color="brand">
                  ¿No tenés cuenta? Crear una
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

          <FormField label="Contraseña">
            <TextField
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              editable={!submitting}
            />
          </FormField>

          <Button
            label="Entrar"
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
