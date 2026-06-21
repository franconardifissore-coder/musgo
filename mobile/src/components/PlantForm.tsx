/**
 * Form reutilizable de planta. Lo usan tanto la pantalla "Nueva planta"
 * como "Editar planta".
 *
 * Campos:
 * - nombre (obligatorio)
 * - emoji (default 🌿, picker de emojis comunes)
 * - especie (opcional, free text)
 * - frecuencia de riego en días (1-60, default 3) — Stepper
 * - sección (SelectField con bottom sheet)
 *
 * Refactor del DS-first: usa Button, TextField, FormField, EmojiPicker,
 * SelectField, Stepper. Sin estilos inline.
 */

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { Plant, Section } from '@/domain';
import { Box } from '@/components/primitives/Box';
import {
  Button,
  EmojiPicker,
  FormField,
  SelectField,
  Stepper,
  TextField,
  type SelectOption,
} from '@/components/ui';

const EMOJI_OPTIONS = [
  '🌿', '🌱', '🌵', '🌴', '🌳', '🪴', '🌷', '🌸', '🌺', '🌻', '🍀',
] as const;

export interface PlantFormValues {
  name: string;
  emoji: string;
  species: string;
  freq: number;
  section: string | null;
}

interface Props {
  initial?: Partial<PlantFormValues> | Plant;
  sections: Section[];
  submitting: boolean;
  submitLabel: string;
  onSubmit: (values: PlantFormValues) => void | Promise<void>;
}

export function PlantForm({
  initial,
  sections,
  submitting,
  submitLabel,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🌿');
  const [species, setSpecies] = useState(initial?.species ?? '');
  const [freq, setFreq] = useState<number>(initial?.freq ?? 3);
  const [section, setSection] = useState<string | null>(initial?.section ?? null);
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('El nombre es obligatorio.');
      return;
    }
    setValidationError(null);
    void onSubmit({
      name: trimmedName,
      emoji,
      species: species.trim(),
      freq,
      section,
    });
  }

  const sectionOptions: SelectOption<string | null>[] = [
    { value: null, label: 'Ninguna' },
    ...sections.map((s) => ({ value: s.id, label: `${s.icon}  ${s.name}` })),
  ];

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
          <FormField label="Nombre" error={validationError && !name.trim() ? validationError : null}>
            <TextField
              placeholder="Mi planta favorita"
              value={name}
              onChangeText={setName}
              editable={!submitting}
              autoCapitalize="sentences"
              returnKeyType="next"
              hasError={Boolean(validationError && !name.trim())}
            />
          </FormField>

          <FormField label="Emoji">
            <EmojiPicker value={emoji} options={EMOJI_OPTIONS} onChange={setEmoji} disabled={submitting} />
          </FormField>

          <FormField label="Especie" optional>
            <TextField
              placeholder="Monstera deliciosa"
              value={species}
              onChangeText={setSpecies}
              editable={!submitting}
              autoCapitalize="words"
            />
          </FormField>

          <FormField label="Frecuencia de riego" helper="Cada cuántos días la regás">
            <Stepper value={freq} min={1} max={60} onChange={setFreq} suffix="días" disabled={submitting} />
          </FormField>

          {sections.length > 0 ? (
            <FormField label="Espacio" optional>
              <SelectField<string | null>
                value={section}
                options={sectionOptions}
                onChange={setSection}
                placeholder="Ninguno"
                sheetTitle="Elegir espacio"
                disabled={submitting}
              />
            </FormField>
          ) : null}

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
