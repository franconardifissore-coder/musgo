/**
 * Pressable: wrapper sobre el Pressable de RN con feedback consistente.
 *
 * - opacity 0.7 + leve scale 0.985 en press
 * - haptic opcional (cuando el caller lo pide explícitamente)
 *
 * El haptic queda como prop opcional sin importar `expo-haptics` por defecto:
 * si el caller lo necesita, pasa `onPressFeedback` y lo invocamos. Esto evita
 * obligar a la dep en cada Pressable.
 */

import { useMemo } from 'react';
import {
  Pressable as RNPressable,
  Animated,
  type PressableProps as RNPressableProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';

export interface PressableProps extends Omit<RNPressableProps, 'style'> {
  /** Si false, no aplicamos feedback visual al presionar. Útil para áreas tap-only. */
  withFeedback?: boolean;
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  /** Callback custom para feedback (ej. haptic). Se llama on press in. */
  onPressFeedback?: () => void;
}

export function Pressable({
  withFeedback = true,
  style,
  onPressIn,
  onPressFeedback,
  children,
  ...rest
}: PressableProps) {
  const scale = useMemo(() => new Animated.Value(1), []);

  function handlePressIn(e: Parameters<NonNullable<RNPressableProps['onPressIn']>>[0]) {
    if (withFeedback) {
      Animated.timing(scale, {
        toValue: 0.985,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
    if (onPressFeedback) onPressFeedback();
    if (onPressIn) onPressIn(e);
  }

  function handlePressOut(e: Parameters<NonNullable<RNPressableProps['onPressOut']>>[0]) {
    if (withFeedback) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 4,
      }).start();
    }
    if (rest.onPressOut) rest.onPressOut(e);
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <RNPressable
        {...rest}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={(state) => {
          const resolved = typeof style === 'function' ? style(state) : style;
          return [
            resolved,
            withFeedback && state.pressed ? { opacity: 0.75 } : null,
          ];
        }}
      >
        {children as React.ReactNode}
      </RNPressable>
    </Animated.View>
  );
}
