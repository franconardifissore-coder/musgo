/**
 * Calendario mensual de una planta. Tap en una celda toggleable → toggle riego.
 *
 * Estados visuales:
 * - watered: fondo brand
 * - projected (futuro proyectado): borde brand dashed, sin fondo
 * - today: borde más grueso brand
 * - !canToggle (futuro): opacity reducida, no responde al tap
 *
 * Refactor DS-first: usa tokens del theme, primitives Box/Text/Pressable,
 * IconButton para navegación de mes.
 */

import { Alert, View } from 'react-native';
import {
  MONTH_NAMES,
  getCalendarMonthData,
  nextMonth as nextMonthFn,
  prevMonth as prevMonthFn,
  type CalendarCell,
  type Plant,
} from '@/domain';
import { toggleWaterDate } from '@/lib/actions/plants';
import { Box } from '@/components/primitives/Box';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { IconButton } from '@/components/ui/IconButton';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/theme/ThemeProvider';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface Props {
  plant: Plant;
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
}

const CELL = 40;
const GAP = 4;

export function PlantCalendar({ plant, year, month, onMonthChange }: Props) {
  const theme = useTheme();
  const { cells } = getCalendarMonthData(plant, year, month);

  async function handleCellPress(cell: CalendarCell) {
    if (cell.empty || !cell.canToggle) return;
    try {
      await toggleWaterDate(plant, cell.dateStr);
    } catch (err) {
      Alert.alert(
        'No pudimos sincronizar',
        err instanceof Error ? err.message : 'Error desconocido',
      );
    }
  }

  return (
    <Card variant="flat" p="4" radius="lg">
      <Box direction="row" align="center" justify="space-between" mb="3">
        <IconButton
          accessibilityLabel="Mes anterior"
          variant="ghost"
          size="sm"
          onPress={() => {
            const { year: y, month: m } = prevMonthFn(year, month);
            onMonthChange(y, m);
          }}
        >
          <Text variant="h2" color="text">‹</Text>
        </IconButton>
        <Text variant="h2">
          {MONTH_NAMES[month]} {year}
        </Text>
        <IconButton
          accessibilityLabel="Mes siguiente"
          variant="ghost"
          size="sm"
          onPress={() => {
            const { year: y, month: m } = nextMonthFn(year, month);
            onMonthChange(y, m);
          }}
        >
          <Text variant="h2" color="text">›</Text>
        </IconButton>
      </Box>

      <View style={{ flexDirection: 'row', gap: GAP, marginBottom: 8 }}>
        {WEEKDAYS.map((w) => (
          <View key={w} style={{ width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="caption" color="textMuted" align="center">{w}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
        {cells.map((cell, idx) => {
          if (cell.empty) {
            return <View key={`e${idx}`} style={{ width: CELL, height: CELL }} />;
          }
          const isProjected = cell.isProjected && !cell.isWatered;
          return (
            <Pressable
              key={cell.dateStr}
              onPress={() => handleCellPress(cell)}
              disabled={!cell.canToggle}
              withFeedback={cell.canToggle}
              style={{
                width: CELL,
                height: CELL,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: theme.radii.sm,
                borderWidth: cell.isToday ? 2 : 1,
                borderColor: cell.isWatered
                  ? theme.colors.brand
                  : cell.isToday
                    ? theme.colors.brand
                    : isProjected
                      ? theme.colors.brandMuted
                      : 'transparent',
                borderStyle: isProjected ? 'dashed' : 'solid',
                backgroundColor: cell.isWatered ? theme.colors.brand : 'transparent',
                opacity: cell.canToggle ? 1 : 0.4,
              }}
            >
              <Text
                variant="bodySmall"
                color={cell.isWatered ? 'textOnBrand' : 'text'}
                weight={cell.isWatered ? '700' : '400'}
              >
                {cell.day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
