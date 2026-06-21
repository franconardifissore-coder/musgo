/**
 * Skeleton: placeholder pulsante para estados de loading. Reemplaza
 * ActivityIndicator en grids/listas, donde el flash de spinner es feo.
 */

import { useEffect, useRef } from 'react';
import { Animated, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: theme.colors.borderSubtle,
          opacity,
        },
        style,
      ]}
    />
  );
}
