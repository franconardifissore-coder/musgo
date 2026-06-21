/**
 * BottomSheet: wrapper sobre `@gorhom/bottom-sheet`.
 *
 * Mantiene la API pública del wrapper anterior (visible / onClose / title /
 * dismissOnBackdrop / children) para que los callers no cambien. Internamente
 * usa BottomSheetModal de gorhom, que da:
 *   - drag-to-dismiss real con gestos
 *   - backdrop con tap
 *   - snap points dinámicos (`CONTENT_HEIGHT`)
 *   - performance buena con scrolls largos (necesario para la galería)
 *
 * Requiere `BottomSheetModalProvider` montado al root (lo está en _layout).
 */

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/ThemeProvider';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Título opcional en el header. */
  title?: string;
  /** Habilita dismiss tocando el backdrop. Default true. */
  dismissOnBackdrop?: boolean;
  /** Padding inferior extra (sobre el safe-area). Reservado, gorhom maneja safe-area solo. */
  contentPaddingBottom?: number;
  children: ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  dismissOnBackdrop = true,
  children,
}: BottomSheetProps) {
  const theme = useTheme();
  const ref = useRef<BottomSheetModal>(null);
  // Track whether present() was ever called. Calling dismiss() on a modal that
  // was never presented can corrupt gorhom's internal state machine in v5,
  // preventing subsequent present() calls from working.
  const wasPresented = useRef(false);

  useEffect(() => {
    if (visible) {
      ref.current?.present();
      wasPresented.current = true;
    } else if (wasPresented.current) {
      ref.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useMemo(
    () =>
      function Backdrop(props: BottomSheetBackdropProps) {
        return (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.45}
            pressBehavior={dismissOnBackdrop ? 'close' : 'none'}
          />
        );
      },
    [dismissOnBackdrop],
  );

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enablePanDownToClose={dismissOnBackdrop}
      onDismiss={() => {
        // Si gorhom cierra por gesto/backdrop, sincronizamos el state del caller.
        if (visible) onClose();
      }}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.radii.xl,
        borderTopRightRadius: theme.radii.xl,
      }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
    >
      <BottomSheetView style={{ paddingBottom: 24 }}>
        {title ? (
          <Box px="5" pt="2" pb="3">
            <Text variant="h2">{title}</Text>
          </Box>
        ) : null}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
