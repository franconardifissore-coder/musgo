import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SectionForm } from '@/components/SectionForm';
import { createSection } from '@/lib/actions/sections';
import { Box } from '@/components/primitives/Box';
import { ScreenHeader } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

export default function NewSectionScreen() {
  const { show: toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  return (
    <Box flex={1} bg="bg">
      <ScreenHeader title="Nuevo espacio" onBack={() => router.back()} />
      <SectionForm
        submitting={submitting}
        submitLabel="Crear espacio"
        onSubmit={async (values) => {
          setSubmitting(true);
          try {
            const section = await createSection(values);
            toast('Espacio creado', { variant: 'success' });
            router.replace(`/(tabs)/sections/${section.id}`);
          } catch (err) {
            setSubmitting(false);
            toast(err instanceof Error ? err.message : 'No pudimos crear', { variant: 'danger' });
          }
        }}
      />
    </Box>
  );
}
