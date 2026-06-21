/**
 * DashboardSummaryCard: card "héroe" del dashboard con el número grande de
 * plantas con sed hoy. Mismo estilo de card que DashboardChartCard.
 */

import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface DashboardSummaryCardProps {
  thirstyCount: number;
  totalPlants: number;
  /** Si está, muestra botón "Ver todo" que dispara este callback. */
  onPressSeeAll?: () => void;
}

export function DashboardSummaryCard({
  thirstyCount,
  onPressSeeAll,
}: DashboardSummaryCardProps) {
  const allHappy = thirstyCount === 0;

  return (
    <Card variant="elevated">
      <Box align="center" gap="2" p="1">
        <Text variant="label" color="textMuted">
          Hoy
        </Text>
        <Text variant="display" align="center" color={allHappy ? 'brand' : 'text'}>
          {allHappy ? '🌿' : thirstyCount}
        </Text>
        <Text variant="body" color="textMuted" align="center">
          {allHappy
            ? 'Nadie tiene sed hoy'
            : `planta${thirstyCount === 1 ? '' : 's'} ${thirstyCount === 1 ? 'tiene' : 'tienen'} sed`}
        </Text>
        {!allHappy && onPressSeeAll ? (
          <Box mt="2">
            <Button label="Ver todo" variant="primary" size="sm" onPress={onPressSeeAll} />
          </Box>
        ) : null}
      </Box>
    </Card>
  );
}
