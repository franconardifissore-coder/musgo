# Musgo Mobile · Handoff de buildout de UI

Sesión autónoma. Migración del esqueleto inicial al DS-first plan completo de
[`mobile-ui-buildout-plan.md`](./mobile-ui-buildout-plan.md).

## Estado al cierre

- `tsc --noEmit` limpio en todo `mobile/`.
- 25/25 tests de dominio en verde (watering + calendar).
- App compila y debería arrancar con `npm start` sin instalar nada nuevo.

## Lo que se completó (de las 9 fases del plan)

### Fase 1 · Foundation ✅

- `src/theme/tokens.ts`: tokens completos (color, type, space, radius, shadow, motion, layout).
- `src/theme/ThemeProvider.tsx` + `useTheme()`.
- `src/theme/index.ts`: barrel.
- `src/theme/colors.ts`: reescrito como shim deprecado que mapea los nombres legacy (`bg`, `bgElevated`, `textPrimary`, etc.) a tokens light. Las pantallas que aún no se refactorizaron siguen funcionando con la paleta nueva.
- `app/_layout.tsx`: monta `SafeAreaProvider` + `ThemeProvider` + `ToastProvider` + `AuthProvider`.

**Notas sobre tipografía**: la fuente está en system por ahora (sin `expo-font`). Cuando instales `@expo-google-fonts/dm-sans`, cambiá los 5 valores de `fonts` en `tokens.ts` por los nombres registrados de DM Sans. Es swap atómico: el resto del DS ya consume `fonts.*` y `typography.*`.

### Fase 2 · Primitives + Botones ✅

- `src/components/primitives/`: `Text`, `Box`, `Pressable` (con scale + opacity feedback).
- `src/components/ui/Button.tsx`: 4 variantes (primary, secondary, danger, ghost) × 3 tamaños (sm, md, lg).
- `src/components/ui/IconButton.tsx`: 4 variantes × 3 tamaños, touch target 44px.

### Fase 3 · Forms ✅

- `TextField`, `SelectField` (con BottomSheet), `Stepper`, `EmojiPicker`, `FormField`.
- `PlantForm` y `SectionForm` refactorizados para usar los nuevos componentes.

### Fase 4 · Surfaces + Feedback ✅

- `Card` (4 variantes), `BottomSheet`, `Toast` + `useToast()`, `EmptyState`, `Chip` + `ChipRow`, `Skeleton`, `ConfirmDialog`.

**BottomSheet**: implementado con `Modal` + `Animated` propio. Funciona, pero el drag-to-dismiss real llega cuando swappemos a `@gorhom/bottom-sheet`. La API pública ya está pensada para que el swap sea drop-in.

### Fase 5 · Componentes de dominio ✅

- `PlantTile` (1-per-row: foto izq + meta + water btn der).
- `SpaceCard`, `DashboardSummaryCard`, `DashboardChartCard` (barras custom, sin librería).
- `ProfileCard`, `AuthPanel`, `ScanBox`, `IdentifiedPlantCard`.
- `PlantCalendar` refactorizado para usar tokens del theme.

### Fase 6+7 · Navegación + Aplicar a pantallas ✅

Todas las pantallas refactorizadas:

| Pantalla | Estado |
|---|---|
| `(auth)/sign-in` | AuthPanel + TextField + Button + Toast. |
| `(auth)/sign-up` | Idem + validación inline de password (8+). |
| `(tabs)/index` (Dashboard) | DashboardSummaryCard + DashboardChartCard + EmptyState. |
| `(tabs)/plants/index` | PlantTile en lista vertical 1-per-row + ChipRow filtro + EmptyState + **FAB único** que abre `add`. |
| `(tabs)/plants/add` | **Nueva pantalla**. Decide manual vs scan, igual que en web. |
| `(tabs)/plants/new` | PlantForm refactorizado. |
| `(tabs)/plants/scan` | ScanBox + IdentifiedPlantCard. |
| `(tabs)/plants/[id]/index` | Hero card + meta row + water CTA + PlantCalendar + ConfirmDialog. |
| `(tabs)/plants/[id]/edit` | PlantForm refactorizado. |
| `(tabs)/sections/index` | SpaceCard list + FAB + EmptyState. |
| `(tabs)/sections/[id]/index` | PlantTile list + Regar todas + ConfirmDialog. |
| `(tabs)/sections/new`, `[id]/edit` | SectionForm refactorizado. |
| `(tabs)/profile` | ProfileCard + Cerrar sesión + Eliminar cuenta (BottomSheet + email typing). |
| Layouts (`(tabs)/_layout`, `plants/_layout`, `sections/_layout`) | Headers con tokens del theme, sin sombra. |

## Lo que NO se hizo (fases 8 y 9 del plan)

### Fase 8 · Motion (parcial)

Lo que sí está: Animated en BottomSheet, Toast, Skeleton, Pressable. Lo que falta:

- Reanimated en transitions clave (el proyecto ya lo tiene en package.json, pero no se usó porque Animated alcanzaba).
- Haptic feedback en regar / crear (necesita `expo-haptics`, que no está instalado).
- Animación de check al regar dentro del water button.

### Fase 9 · Edge UX

- Sin `ErrorBoundary`. Si una pantalla crashea, el usuario ve la pantalla blanca de RN.
- Sin banner offline.
- Sin tests en device real (es la próxima cosa después de instalar deps).

## Deps que faltan instalar (decisiones del plan)

Hoy todo funciona con lo que ya está en `package.json`. Cuando quieras adoptar:

1. **DM Sans** (o Inter como plan B):
   ```bash
   npm install @expo-google-fonts/dm-sans expo-font expo-splash-screen
   ```
   Después: cargar las fuentes en `app/_layout.tsx`, hacer `SplashScreen.preventAutoHideAsync()` hasta `fontsLoaded`, y cambiar los strings en `tokens.ts::fonts`.

2. **BottomSheet maduro**:
   ```bash
   npm install @gorhom/bottom-sheet
   ```
   Después: reemplazar la implementación interna de `src/components/ui/BottomSheet.tsx` por un wrapper del `BottomSheetModal` de gorhom. Toda la API pública (`visible`, `onClose`, `title`, etc.) se mantiene.

3. **Gradients verdes** (para profile card "héroe" o landing del scan):
   ```bash
   npm install expo-linear-gradient
   ```

4. **Haptics** (Fase 8 motion):
   ```bash
   npm install expo-haptics
   ```

## Cosas que conviene mirar al despertarte

1. **Arrancá la app**: `cd mobile && npm start`. Probá los flujos críticos en device/simulador:
   - sign-up → sign-in → ver dashboard
   - crear planta manual desde FAB → `add` → `new`
   - regar planta (lista + detalle) → verificar toast verde
   - editar y eliminar planta (ConfirmDialog)
   - crear espacio → regar todas → eliminar (las plantas no se borran)
   - scanner: tomar foto → ver matches → crear

2. **La paleta es light**. Si el contraste de algo no convence, todos los tokens viven en un solo archivo: `mobile/src/theme/tokens.ts`. Cambialo ahí y se propaga.

3. **No quedaron `colors.bg` hardcoded fuera de `tokens.ts`**. El shim `colors.ts` es la única excepción y solo lo importan los archivos antiguos que ya no existen (lo dejé deprecated por si algún script externo lo necesita).

4. **El BottomSheet propio es básico**. Drag-to-dismiss real necesita gorhom. Si después de probarlo no te gusta, instalá la librería (paso 2 de arriba) y reemplazá `src/components/ui/BottomSheet.tsx`.

## Diffs grandes / archivos para revisar primero

Si querés un walkthrough rápido del cambio visual, mirá en este orden:

1. `mobile/src/theme/tokens.ts` (el corazón del DS)
2. `mobile/src/components/ui/Button.tsx` y `Card.tsx` (cómo se consume el theme)
3. `mobile/app/(tabs)/plants/index.tsx` (lista de plantas, antes vs ahora)
4. `mobile/app/(tabs)/plants/add.tsx` (la pantalla nueva)
5. `mobile/app/(tabs)/index.tsx` (dashboard nuevo con DashboardChartCard)

## Métricas de la sesión

- 30+ archivos nuevos en `mobile/src/`.
- 13 archivos de pantalla refactorizados.
- 1 pantalla nueva (`plants/add`).
- 0 errores de typecheck.
- 25/25 tests en verde.
- 0 dependencias nuevas agregadas a `package.json` (todo el DS se construyó con lo que ya estaba instalado).
