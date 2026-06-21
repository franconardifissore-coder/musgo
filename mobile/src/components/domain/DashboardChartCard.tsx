/**
 * DashboardChartCard: proyección de los próximos N días en barras compactas.
 *
 * Cada día muestra una barra cuya altura es proporcional a la mayor cantidad
 * de plantas sedientas en la ventana. Si no hay sed, muestra dot apagado.
 *
 * Custom (sin librería de charts) porque solo es 5-7 barras y la lógica
 * es trivial. Si llegáramos a necesitar charts más ricos, evaluar Victory
 * Native o react-native-svg-charts.
 */

import { Card } from '@/components/ui/Card';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { DashboardWaterProjectionDay } from '@/domain';

export interface DashboardChartCardProps {
  projection: DashboardWaterProjectionDay[];
  title?: string;
}

const BAR_MAX_HEIGHT = 80;

export function DashboardChartCard({
  projection,
  title = 'Próximos días',
}: DashboardChartCardProps) {
  const theme = useTheme();
  const maxThirsty = Math.max(1, ...projection.map((d) => d.thirsty));

  return (
    <Card>
      <Box gap="8">
        <Text variant="label" color="textMuted" align="center">
          {title}
        </Text>
        <Box direction="row" justify="space-between" align="flex-end" gap="2" style={{ height: BAR_MAX_HEIGHT + 36 }}>
          {projection.map((day) => {
            const heightPct = day.thirsty === 0 ? 0 : Math.max(0.12, day.thirsty / maxThirsty);
            const barHeight = heightPct * BAR_MAX_HEIGHT;
            const hasThirst = day.thirsty > 0;
            return (
              <Box key={day.dateStr} flex={1} align="center" gap="2" justify="flex-end">
                {hasThirst ? (
                  <Text variant="caption" color="secondary" weight="700">
                    {day.thirsty}
                  </Text>
                ) : (
                  <Text variant="caption" color="textMuted">
                    0
                  </Text>
                )}
                <Box
                  style={{
                    width: '70%',
                    height: barHeight,
                    backgroundColor: hasThirst
                      ? theme.colors.secondary
                      : theme.colors.borderSubtle,
                    borderRadius: theme.radii.sm,
                    minHeight: hasThirst ? 6 : 4,
                  }}
                />
                <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing['1'] }}>
                  {day.label}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Card>
  );
}
