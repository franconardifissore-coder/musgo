/**
 * Toast: pill flotante con animación de entrada desde abajo.
 *
 * Patrón de uso: provider global + hook.
 *
 *   const { show } = useToast();
 *   show('Planta regada', { variant: 'success' });
 *
 * Variantes:
 * - default: fondo brand, texto sobre-brand
 * - success: fondo brand
 * - danger: fondo danger
 *
 * Auto-dismiss después de `duration` ms (default 2400).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/ThemeProvider';

export type ToastVariant = 'default' | 'success' | 'danger';

interface ToastOptions {
  variant?: ToastVariant;
  duration?: number;
}

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const idRef = useRef(0);

  const show = useCallback((message: string, options?: ToastOptions) => {
    idRef.current += 1;
    setToast({
      id: idRef.current,
      message,
      variant: options?.variant ?? 'default',
      duration: options?.duration ?? 2400,
    });
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <ToastView
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          duration={toast.duration}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // No provider montado → noop. Esto pasa solo si Toast se usa fuera de
    // la app shell (ej. tests). Mejor degradar a noop que crashear.
    return {
      show: (message) => {
        if (__DEV__) console.warn('[Toast] useToast() used outside ToastProvider:', message);
      },
    };
  }
  return ctx;
}

interface ToastViewProps {
  message: string;
  variant: ToastVariant;
  duration: number;
  onDismiss: () => void;
}

function ToastView({ message, variant, duration, onDismiss }: ToastViewProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.motion.duration.fast,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 60,
          duration: theme.motion.duration.base,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: theme.motion.duration.base,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss, opacity, translateY, theme.motion.duration.fast, theme.motion.duration.base]);

  // Pill estilo moss-soft (snooze): fondo claro, texto oscuro, borde sutil
  const bgByVariant: Record<ToastVariant, string> = {
    default: '#eaf4ee', // moss-50
    success: '#eaf4ee', // moss-50
    danger:  '#f4dcd7', // brick-soft
  };
  const textColorByVariant: Record<ToastVariant, string> = {
    default: '#115b3c', // moss-700
    success: '#115b3c',
    danger:  '#7a2a22', // brick-800
  };
  const borderColorByVariant: Record<ToastVariant, string> = {
    default: '#cfe7d8', // moss-100
    success: '#cfe7d8',
    danger:  '#e8b8b0', // brick-200
  };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          bottom: insets.bottom + theme.spacing['10'],
          backgroundColor: bgByVariant[variant],
          borderRadius: theme.radii.pill,
          borderWidth: 1,
          borderColor: borderColorByVariant[variant],
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Text
        variant="bodyMedium"
        align="center"
        style={{ color: textColorByVariant[variant] }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // centrado horizontalmente con margen de 32px por lado
    left: 32,
    right: 32,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
