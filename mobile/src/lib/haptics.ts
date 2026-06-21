/**
 * Wrapper sobre expo-haptics con tipos de eventos semánticos en lugar de
 * los enums de la librería. Esto hace que las llamadas sean legibles
 * (`hapticSuccess()` en vez de `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`).
 *
 * Todas las funciones son fire-and-forget: si el device no soporta haptic
 * (web preview, simulador a veces), no rompen.
 */

import * as Haptics from 'expo-haptics';

export function hapticSuccess(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticWarning(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

export function hapticError(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

export function hapticTap(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticTapMedium(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
