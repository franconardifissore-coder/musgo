/**
 * Form de espacio (sección). Reutilizado por new y edit.
 *
 * Refactor DS-first: usa Button, TextField, FormField, EmojiPicker.
 */

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Box } from '@/components/primitives/Box';
import { Button, EmojiPicker, FormField, TextField } from '@/components/ui';

const ICON_OPTIONS = [
  '🪴', '🛋️', '🛏️', '🍳', '🚿', '🌳', '🏡', '🏞️', '☀️', '🪟',
] as const;

export interface SectionFormValues {
  name: string;
  icon: string;
}

interface Props {
  initial?: Partial<SectionFormValues>;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (values: SectionFormValues) => void | Promise<void>;
}

export function SectionForm({ initial, submitting, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '🪴');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('El nombre es obligatorio.');
      return;
    }
    setError(null);
    void onSubmit({ name: trimmed, icon });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Box gap="5">
          <FormField label="Nombre" error={error}>
            <TextField
              placeholder="Living, Cocina, Patio..."
              value={name}
              onChangeText={setName}
              editable={!submitting}
              autoCapitalize="sentences"
              hasError={Boolean(error)}
            />
          </FormField>

          <FormField label="Ícono">
            <EmojiPicker value={icon} options={ICON_OPTIONS} onChange={setIcon} disabled={submitting} />
          </FormField>

          <Box mt="3">
            <Button
              label={submitLabel}
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              fullWidth
              size="lg"
            />
          </Box>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
