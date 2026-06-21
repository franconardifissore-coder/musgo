import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SectionForm } from '@/components/SectionForm';
import { useGarden } from '@/lib/garden-store';
import { upsertSection } from '@/lib/actions/sections';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { ScreenHeader } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

export default function EditSectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sections } = useGarden();
  const { show: toast } = useToast();
  const section = sections.find((s) => s.id === id);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  if (!section) {
    return (
      <Box flex={1} align="center" justify="center" bg="bg">
        <Text variant="body" color="danger">Espacio no encontrado</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="bg">
      <ScreenHeader title="Editar espacio" onBack={() => router.back()} />
      <SectionForm
        initial={{ name: section.name, icon: section.icon }}
        submitting={submitting}
        submitLabel="Guardar cambios"
        onSubmit={async (values) => {
          setSubmitting(true);
          try {
            await upsertSection({
              ...section,
              name: values.name,
              icon: values.icon,
            });
            toast('Cambios guardados', { variant: 'success' });
            router.back();
          } catch (err) {
            setSubmitting(false);
            toast(err instanceof Error ? err.message : 'No pudimos guardar', { variant: 'danger' });
          }
        }}
      />
    </Box>
  );
}
