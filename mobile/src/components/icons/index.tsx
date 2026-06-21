/**
 * Iconos SVG portados del web.
 *
 * Patrón: cada icon es un wrapper sobre el SVG (transformado por
 * react-native-svg-transformer) que acepta `size` + `color` (token semántico).
 *
 * Los SVG fueron editados para usar `fill="currentColor"` en vez del color
 * hardcoded, de modo que el `color` prop tinte el icono.
 */

import { type ComponentType } from 'react';
import { type SvgProps } from 'react-native-svg';
import ScannerSvg from '@assets/icons/scanner.svg';
import SunSvg from '@assets/icons/sun-icon.svg';
import WaterSvg from '@assets/icons/water-icon.svg';
import LocationSvg from '@assets/icons/location-icon.svg';
import DeleteSvg from '@assets/icons/delete.svg';
import PlantSvg from '@assets/icons/plant.svg';
import PhotoSvg from '@assets/icons/photo.svg';
import CalendarDropSvg from '@assets/icons/calendar-drop.svg';
import CheckSvg from '@assets/icons/check-icon.svg';
import RiegoEmptySvg from '@assets/icons/riego-empty.svg';
import RiegoFullSvg from '@assets/icons/riego-full.svg';
import RiegoPartialSvg from '@assets/icons/riego-partial.svg';
import RiegoUnknownSvg from '@assets/icons/riego-unknown.svg';
import WaterCanSvg from '@assets/icons/water-can-icon.svg';
import BackArrowSvg from '@assets/icons/back-arrow.svg';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorToken } from '@/theme/tokens';
import type { PlantWaterStatusKind } from '@/domain/water-status';

export interface IconProps {
  size?: number;
  color?: ColorToken;
}

function makeIcon(SvgComponent: ComponentType<SvgProps>, defaultSize = 24) {
  return function Icon({ size = defaultSize, color = 'brand' }: IconProps) {
    const theme = useTheme();
    return <SvgComponent width={size} height={size} color={theme.colors[color]} />;
  };
}

export const ScannerIcon = makeIcon(ScannerSvg, 36);
export const SunIcon = makeIcon(SunSvg, 24);
export const WaterIcon = makeIcon(WaterSvg, 24);
export const LocationIcon = makeIcon(LocationSvg, 24);
export const DeleteIcon = makeIcon(DeleteSvg, 20);
export const PlantIcon = makeIcon(PlantSvg, 24);
export const PhotoIcon = makeIcon(PhotoSvg, 24);
export const CalendarDropIcon = makeIcon(CalendarDropSvg, 24);
export const CheckIcon = makeIcon(CheckSvg, 16);
export const WaterCanIcon = makeIcon(WaterCanSvg, 22);
export const BackArrowIcon = makeIcon(BackArrowSvg, 28);

/**
 * Icon de status de riego. NO se tinta (cada SVG tiene su paleta propia:
 * full=verde, partial=verde+gris, empty=rojo+gris, unknown=gris).
 */
export function WaterStatusIcon({
  status,
  size = 18,
}: {
  status: PlantWaterStatusKind;
  size?: number;
}) {
  const SvgComponent =
    status === 'no_log'
      ? RiegoUnknownSvg
      : status === 'overdue'
        ? RiegoEmptySvg
        : status === 'today' || status === 'tomorrow'
          ? RiegoPartialSvg
          : RiegoFullSvg;
  return <SvgComponent width={size} height={size} />;
}
