/**
 * PlantFunFactCard: card "¿Sabías que?" con una curiosidad generada por Haiku.
 *
 * Estados:
 * - loading: 2 líneas de skeleton.
 * - data: párrafo.
 * - sin data ni loading: no rendea nada.
 */

import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export interface PlantFunFactCardProps {
  funFact?: string | null | undefined;
  loading?: boolean | undefined;
}

export function PlantFunFactCard({ funFact, loading = false }: PlantFunFactCardProps) {
  if (!loading && !funFact) return null;

  return (
    <Card variant="flat" p="5">
      <Box gap="3">
        <Text variant="label" color="brand">
          ¿Sabías que?
        </Text>
        {loading ? (
          <Box gap="2">
            <Skeleton height={14} radius={6} />
            <Skeleton width="80%" height={14} radius={6} />
          </Box>
        ) : (
          <Text variant="body">{funFact}</Text>
        )}
      </Box>
    </Card>
  );
}
