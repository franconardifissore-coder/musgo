/**
 * PlantMetadataCard: rows con luz / riego / origen + ícono.
 *
 * Estados:
 * - loading: 3 rows con skeleton.
 * - data: rows pobladas, omite las que están en null.
 * - vacío (todo null y no loading): no renderea nada.
 *
 * Inspirado en `.identified-plant-metadata` de la web. Usamos emojis en
 * lugar de los SVG (☀️ 💧 📍) — son cross-platform y se sienten naturales
 * en mobile. Cuando se instale `react-native-svg` se puede swappear por
 * los SVG reales en `/resources/sun-icon.svg`, `water-icon.svg`, `location-icon.svg`.
 */

import type { ComponentType } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { SunIcon, WaterIcon, LocationIcon, type IconProps } from '@/components/icons';
import type { PlantMetadata } from '@/domain';

export interface PlantMetadataCardProps {
  metadata?: PlantMetadata | null | undefined;
  loading?: boolean | undefined;
}

function formatLightValue(value: PlantMetadata['light']): string | null {
  if (value === 'directa') return 'Directa';
  if (value === 'indirecta') return 'Indirecta';
  return null;
}

function formatWateringValue(
  level: PlantMetadata['watering_level'],
  freqDays: PlantMetadata['watering_freq_days'],
): string | null {
  const labels: Record<NonNullable<PlantMetadata['watering_level']>, string> = {
    alto: 'Alto',
    medio: 'Medio',
    bajo: 'Bajo',
  };
  const levelLabel = level ? labels[level] : null;
  const freqLabel = Number.isFinite(Number(freqDays))
    ? Number(freqDays) === 1
      ? 'cada día'
      : `cada ${Number(freqDays)} días`
    : null;
  if (levelLabel && freqLabel) return `${levelLabel} · ${freqLabel}`;
  return levelLabel || freqLabel || null;
}

interface Row {
  Icon: ComponentType<IconProps>;
  label: string;
  value: string | null;
}

export function PlantMetadataCard({ metadata, loading = false }: PlantMetadataCardProps) {
  if (!loading && !metadata) return null;

  const rows: Row[] = [
    {
      Icon: SunIcon,
      label: 'Luz',
      value: metadata ? formatLightValue(metadata.light) : null,
    },
    {
      Icon: WaterIcon,
      label: 'Riego',
      value: metadata
        ? formatWateringValue(metadata.watering_level, metadata.watering_freq_days)
        : null,
    },
    {
      Icon: LocationIcon,
      label: 'Origen',
      value: metadata?.origin ?? null,
    },
  ];

  // Si terminó loading y no hay nada útil, no rendereamos.
  if (!loading && rows.every((r) => !r.value)) return null;

  return (
    <Box gap="3">
      {rows.map((row) => (
        <Box key={row.label} direction="row" align="center" gap="3">
          <row.Icon size={20} color="brand" />
          <Text variant="label" color="textMuted" style={{ minWidth: 60 }}>
            {row.label}
          </Text>
          {loading ? (
            <Box flex={1}>
              <Skeleton height={16} radius={6} />
            </Box>
          ) : (
            <Text variant="bodyMedium" style={{ flex: 1 }}>
              {row.value ?? '—'}
            </Text>
          )}
        </Box>
      ))}
    </Box>
  );
}
