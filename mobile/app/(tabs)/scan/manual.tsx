/**
 * Crear planta manualmente (sin scan).
 *
 * Equivalente a la rama "manual" de `plantCreate` en web: hero card con
 * emoji + form (nombre, emoji, especie opcional, frecuencia, espacio).
 */

import { useState } from 'react';
import { useRouter } from 'expo-router';
import { PlantForm } from '@/components/PlantForm';
import { useGarden } from '@/lib/garden-store';
import { createPlant } from '@/lib/actions/plants';
import { Box } from '@/components/primitives/Box';
import { ScreenHeader } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

export default function ManualPlantScreen() {
  const { sections } = useGarden();
  const { show: toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  return (
    <Box flex={1} bg="bg">
      <ScreenHeader title="Crear manualmente" onBack={() => router.back()} />
      <PlantForm
        sections={sections}
        submitting={submitting}
        submitLabel="Guardar"
        onSubmit={async (values) => {
          setSubmitting(true);
          try {
            const plant = await createPlant(values);
            toast('🌱 Planta guardada', { variant: 'success' });
            router.replace(`/(tabs)/plants/${plant.id}`);
          } catch (err) {
            setSubmitting(false);
            toast(err instanceof Error ? err.message : 'No pudimos crear', { variant: 'danger' });
          }
        }}
      />
    </Box>
  );
}
