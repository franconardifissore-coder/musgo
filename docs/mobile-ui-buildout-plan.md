# Musgo Mobile · Plan de buildout de UI e interacciones

## Objetivo

Llevar la app Expo desde el estado funcional actual (esqueleto navegable con estilos provisorios) a una UI que cubra toda la superficie de interacción de la web, rediseñada con patrones mobile-first y con un design system propio que se construye antes que las pantallas finales.

Este doc es el plan de trabajo y la fuente de verdad para las próximas fases de UI. No es el plan global de la migración (eso vive en [`expo-store-migration-plan.md`](./expo-store-migration-plan.md)) ni el inventario visual de la web (eso vive en [`design-system.md`](./design-system.md)).

## Decisiones de esta sesión

1. **Dirección visual: mobile-first rediseñado, paleta light de la web.** Mantenemos brand (verde `#345D4C`, superficies blancas, DM Sans, formas redondeadas) pero NO replicamos la web pixel-perfect. La paleta y la tipografía son la guía; tamaños, sombras, radii, paddings y feedback se ajustan a lo que se siente bien en mobile nativo aunque no coincidan con los valores del CSS de la web.
2. **Approach: Design System primero.** Tokens y componentes base reutilizables antes de tocar pantallas finales. Aceptamos la inversión inicial a cambio de que las pantallas finales sean ensamblaje, no diseño desde cero.
3. **Theme dark actual queda descartado.** `src/theme/colors.ts` se reescribe completo en la Fase 1. El dashboard, lista de plantas y demás pantallas existentes son provisorias y se rediseñan al pasar por la fase de aplicación (Fase 7).
4. **Tipografía: DM Sans como default, con plan B listo.** Se carga con `expo-font` + Google Fonts (`@expo-google-fonts/dm-sans`). Si aparece flash de fuente persistente, peso del bundle problemático o cualquier fricción real en device, se reemplaza por una alternativa equivalente sin perder coherencia visual (ver "Riesgos" para lista).
5. **Sin librería de UI externa para primitives.** Nada de NativeBase, Tamagui, gluestack para botones / cards / inputs. Componentes propios sobre RN nativo + Reanimated. Excepciones puntuales donde una librería es claramente mejor que reinventar:
   - **Bottom sheet**: `@gorhom/bottom-sheet` (estándar de facto, gestos correctos, performance buena). Lo adaptamos con nuestros tokens, no construimos uno desde cero.
   - **Date/time picker**: `@react-native-community/datetimepicker` si llegáramos a necesitarlo.
   - **Linear gradient**: `expo-linear-gradient` para los gradientes verdes de la web.

## Gap actual (resumen)

**Mobile hoy tiene**:

- Esqueleto navegable: tabs (dashboard, plants, sections, profile) + auth stack + detalles + scanner.
- 3 componentes reusables: `PlantCalendar`, `PlantForm`, `SectionForm`.
- Theme dark provisorio con 8 tokens de color, sin tipografía, sin espaciado, sin radii, sin sombras.
- Estilos inline por pantalla con `StyleSheet.create`, sin tokens semánticos.
- Sin componentes base (Button, Card, Input, Chip, Modal, Toast, EmptyState).

**Web tiene** (resumen de `design-system.md`):

- Paleta light con 4 grupos semánticos (brand, text, surfaces, feedback) + aliases.
- DM Sans con jerarquía clara (5 niveles de título, labels uppercase).
- Tokens de spacing, radii (sm/md/lg/xl), sombras (xs/sm/md).
- 6 familias de componentes: botones (4 variantes), inputs, chips, cards (8 variantes), modales, calendario.
- Estados de feedback (toast, empty state, error/loading/success).
- Motion: enter de pantalla, fadeIn, modal scale, toast translate, hover lift, focus halo.

El delta es prácticamente todo el sistema visual. Por eso vamos DS-first.

## Inventario de componentes a construir

Cada componente lista su origen web (clase CSS de referencia en `styles.css`) y la prioridad dentro del roadmap.

### Tokens y primitives (Fase 1-2)

- `theme/tokens.ts`: color (brand, text, surface, feedback), typography (family + 5 niveles + label), spacing (1-7), radius (sm/md/lg/xl + pill), shadow (xs/sm/md), motion (durations + easings).
- `theme/ThemeProvider.tsx`: contexto + hook `useTheme()`. Habilita futuro dark mode sin reescribir consumidores.
- `theme/fonts.ts`: carga `expo-font` de DM Sans (400, 500, 600, 700, 800).
- `components/primitives/Text.tsx`: variantes `display`, `title`, `subtitle`, `body`, `label`, `caption`. Mapea a tokens de tipografía.
- `components/primitives/Box.tsx`: View tipado con props de spacing/radius/bg que mapean a tokens (atomic styling sin librería).
- `components/primitives/Pressable.tsx`: wrapper sobre `Pressable` con feedback consistente (opacity + scale 0.98 + haptic opcional).

### Botones (Fase 2)

> Los tamaños, sombras y radii son guía inicial. Se ajustan a feel nativo durante la implementación; no se replican los valores exactos del CSS web (que son más agresivos de lo que conviene en mobile).

- `Button` con variantes `primary`, `secondary`, `danger`, `ghost`. Inspiración: `.btn-primary`, `.btn-secondary`, `.btn-danger`. Tamaño base ~52-56px de alto, padding cómodo, radius `pill` o `lg`. Sombra sutil en primary, sin sombra agresiva.
- `IconButton` con variantes `default` y `delete`. Inspiración: `.btn-icon`. Tamaño mínimo `44x44` para cumplir touch target HIG/Material. Touch slop 8.
- `WaterButton` (en card de planta) — variante especializada. Inspiración: `.plant-tile-water-button`.

### Inputs y forms (Fase 3)

- `TextField` con label uppercase, helper text, estado de error, focus halo. Origen: `.form-group input`, `.editor-input`.
- `SelectField` mobile: en RN no hay `<select>`, así que abre un bottom sheet con lista. Origen: `.editor-select`.
- `EmojiPicker` (ya hay lógica en `PlantForm`; extraer a componente reutilizable con bottom sheet).
- `FormField` wrapper: label + input + error + helper.
- `Stepper` (para `freq` en días, hoy es input crudo).

### Surfaces y feedback (Fase 4)

- `Card` con variantes `default`, `elevated`, `flat`. Inspiración: cards genéricas de la web. Sombras y radii ajustados a feel nativo.
- `BottomSheet`: reemplaza `Modal` web. **Implementación: `@gorhom/bottom-sheet`** envuelto con nuestros tokens. Gestos, snap points y backdrop salen de la librería; el styling viene de nuestro theme.
- `Toast`: pill flotante con `react-native-reanimated`. Inspiración: `.toast`. Estilo nativo (radio, padding, sombra) — no replica los valores exactos del CSS.
- `EmptyState`: icono + título + body + CTA opcional. Inspiración: `.view-empty`, `.empty-state`.
- `Chip` y `FilterChip` (con scroll horizontal en contenedor `ChipRow`). Inspiración: `.filter-chip`. Tamaño y forma ajustados a feel nativo.
- `Skeleton` (loading placeholder): equivalente a spinner pero menos abrupto.
- `ConfirmDialog` (sobre BottomSheet): reemplaza confirm web de borrado.

### Navegación (Fase 6)

- `Topbar` custom (header de pantallas): logo a la izquierda, acción a la derecha. Origen: `.mobile-topbar`. Usar `Stack.Screen options.header` de expo-router.
- Tab bar: ya viene de expo-router. Customizar con tokens (icon + label + active state).
- Sin drawer lateral (decisión mobile-first: el perfil ya es tab; el filtro de plantas por espacio ya es chip row).

### Componentes de dominio (Fase 5)

- `PlantTile`: card en grid con visual superior, emoji/imagen, nombre, "regada el X", water button. Origen: `.plant-tile`.
- `SpaceCard`: card vertical con título grande, icono, contador, 2 acciones al pie. Origen: `.space-card`.
- `DashboardSummaryCard` y `DashboardChartCard`: cards de dashboard con stats y gráfico de barras. Origen: `.dashboard-summary-card`, `.dashboard-chart-card`. El chart se puede hacer custom (5 barras, no necesita librería).
- `ProfileCard`: header con gradient radial verde + avatar + body con stats. Origen: `.profile-card`.
- `AuthPanel`: card de auth con CTA Google, divisor, toggle, formulario. Origen: `.auth-panel`.
- `ScanBox`: contenedor grande con borde verde, gradiente, icono/preview. Origen: `.scan-box`.
- `PlantCalendar` (ya existe — refactor para usar tokens del DS).
- `IdentifiedPlantCard`: card de resultado del scanner. Origen: `.identified-plant-card`.

## Traducciones mobile-first (qué cambia respecto a la web)

Decisiones explícitas para que no haya ambigüedad cuando se diseñe cada pantalla. **Principio general**: en botones, chips, toasts, sombras, radii y paddings, priorizamos lo que se siente bien en mobile nativo sobre la fidelidad numérica a la web. La paleta, tipografía y semántica visual sí se respetan.

| Pattern web | Decisión mobile |
|---|---|
| Drawer lateral con menú | Tabs nativas (ya implementado). El menú se descarta. |
| Modales centrados con `scale` | **Bottom sheets** con drag-to-dismiss y backdrop, usando `@gorhom/bottom-sheet`. Excepción: `ConfirmDialog` corto puede ser modal centrado tipo Alert. |
| Hover lift / focus halo | Press feedback (opacity 0.7 + scale 0.98) + haptic opcional en botones primarios. |
| Topbar fijo arriba con menú | Header del Stack de expo-router con título contextual + 1 acción a la derecha. |
| Chip row horizontal con scroll | `ScrollView horizontal` con snap opcional. Filter chip sigue siendo el primer patrón de filtrado. Tamaño y sombra ajustados a feel nativo, no a los valores del CSS web. |
| Botón primario en web `min-height: 64px` + sombra fuerte | Altura y sombra recalibradas a algo más sutil y nativo (ej. 52-56px, sombra suave). No replicamos los `64px` ni la sombra agresiva del CSS. |
| Pantalla única "agregar planta" en web que decide entre manual y scan | **Se respeta**: pantalla `(tabs)/plants/add` que muestra dos opciones (manual / escanear) y enruta a `new` o `scan`. El FAB de la lista de plantas lleva acá, no directamente a `new`. |
| FAB doble (primario + scanner) en el esqueleto actual | **Se reemplaza por un FAB único** (`+`) que abre la pantalla "agregar planta". |
| `select` HTML | Bottom sheet con lista de opciones tappables. |
| Emoji picker custom | Bottom sheet con grid de emojis. |
| Plant tile en grid de 2-4 columnas (desktop) | **Se respeta el patrón de la web mobile**: una sola card por fila, foto a la izquierda, nombre + meta + acción (regar) a la derecha. Sin grid de 2 columnas. |
| Calendario con días de 44x44 hover | Mismos 44x44 (touch-friendly), sin hover. Tap directo. |
| Toast bottom con `translateY` | Mismo patrón con Reanimated + respeto a safe area inset bottom. Estilo (radio, sombra, padding) ajustado a feel nativo. |
| Animaciones de entrada de pantalla | Las que da expo-router por defecto (slide en iOS, fade en Android). No customizamos en v1. |

## Roadmap por fases

Cada fase termina con un PR mergeable y un demo screen interno (`/dev` route) que muestra los componentes nuevos.

### Fase 1 · Foundation (tokens + theme + tipografía)

**Entregables**:

- `src/theme/tokens.ts` con todos los tokens (color, type, space, radius, shadow, motion).
- `src/theme/ThemeProvider.tsx` + `useTheme()`.
- DM Sans cargada via `@expo-google-fonts/dm-sans` + `expo-font` + splash hold con `SplashScreen.preventAutoHideAsync()` hasta que cargue. Si en el primer device test hay flash persistente, swap inmediato a Inter (plan B documentado en Riesgos).
- Dependencias nuevas confirmadas: `@expo-google-fonts/dm-sans`, `expo-linear-gradient`, `@gorhom/bottom-sheet`.
- `src/theme/colors.ts` actual reescrito o eliminado en favor de tokens semánticos.

**Done cuando**:

- Una pantalla `/dev/theme` lista paleta, escala tipográfica y radii rendereados.
- `useTheme()` funciona en cualquier componente.
- App abre sin flash de fuente en device real (iOS + Android).

### Fase 2 · Primitives + Botones

**Entregables**:

- `Text`, `Box`, `Pressable` con props de tokens.
- `Button` (4 variantes) + `IconButton`.

**Done cuando**:

- `/dev/buttons` muestra las 4 variantes en estados normal / pressed / disabled / loading.
- TypeScript: variantes tipadas, sin `any`.

### Fase 3 · Forms

**Entregables**:

- `TextField`, `SelectField` (con bottom sheet), `EmojiPicker` (bottom sheet), `FormField`, `Stepper`.

**Done cuando**:

- `/dev/forms` muestra todos los inputs en sus estados.
- Refactor de `PlantForm` y `SectionForm` para usar los nuevos componentes (sin cambiar funcionalidad).

### Fase 4 · Surfaces + Feedback

**Entregables**:

- `Card`, `BottomSheet`, `Toast`, `EmptyState`, `Chip`, `ChipRow`, `Skeleton`, `ConfirmDialog`.

**Done cuando**:

- `/dev/surfaces` muestra cada componente.
- `BottomSheet` soporta drag-to-dismiss y backdrop tap.
- `Toast` se invoca por hook `useToast()` (provider global).

### Fase 5 · Componentes de dominio

**Entregables**:

- `PlantTile`, `SpaceCard`, `DashboardSummaryCard`, `DashboardChartCard`, `ProfileCard`, `AuthPanel`, `ScanBox`, `IdentifiedPlantCard`.
- Refactor de `PlantCalendar` para usar tokens.

**Done cuando**:

- `/dev/domain` muestra cada componente con datos mock.
- Componentes consumen props mínimas y no tienen lógica de data fetching adentro.

### Fase 6 · Navegación

**Entregables**:

- Header custom para Stack screens con título + acción derecha.
- Tab bar customizada con tokens (iconos, active state).
- Transitions consistentes entre plataformas.

**Done cuando**:

- Todas las pantallas existentes usan el header custom sin perder back gesture nativo.

### Fase 7 · Aplicar a pantallas (rediseño completo)

Por orden de uso y dependencia:

1. **Auth** (`(auth)/sign-in`, `sign-up`) → AuthPanel + TextField + Button.
2. **Dashboard** (`(tabs)/index`) → DashboardSummaryCard + DashboardChartCard + saludo.
3. **Plants list** (`(tabs)/plants/index`) → ChipRow (filtro por sección) + lista vertical de `PlantTile` (1 por fila: foto izq, nombre + meta + water button der) + **FAB único** (`+`) que abre la pantalla de agregar + EmptyState.
4. **Agregar planta** (`(tabs)/plants/add` — **nueva pantalla**) → respeta el patrón de la web: una pantalla intermedia con dos opciones grandes ("Agregar manualmente" / "Escanear con cámara") que enrutan a `new` o `scan`. Aísla la decisión y deja el flujo de scanner separado del de form, como en web.
5. **Plant detail** (`(tabs)/plants/[id]/index`) → Card de info + PlantCalendar + acciones (regar, editar, borrar) + ConfirmDialog.
6. **Plant edit/new** (`[id]/edit`, `new`) → PlantForm refactorizado.
7. **Sections list** (`(tabs)/sections/index`) → SpaceCard list + FAB.
8. **Section detail** (`sections/[id]/index`) → header + lista de plantas + "Regar todas".
9. **Section edit/new** → SectionForm refactorizado.
10. **Profile** (`(tabs)/profile`) → ProfileCard + stats + sign out + delete account (con ConfirmDialog).
11. **Scanner** (`(tabs)/plants/scan`) → ScanBox + cámara + estado loading/error/result + IdentifiedPlantCard.

**Nota sobre el esqueleto actual**: el FAB doble (`+` y `📷`) que existe hoy en `(tabs)/plants/index.tsx` se reemplaza por un FAB único que abre `plants/add`. La ruta `plants/scan` deja de ser destino directo del FAB.

**Done cuando**:

- Cada pantalla pasa por checklist: usa tokens (cero hex hardcoded), usa primitives, tiene loading/empty/error states, navegación back coherente.

### Fase 8 · Motion y microinteracciones

**Entregables**:

- Reanimated en transitions clave: BottomSheet, Toast, PlantTile press, water button toggle (check animado).
- Haptic feedback en acciones de éxito (regar planta, crear planta).
- Skeleton loaders en lugar de ActivityIndicator en pantallas con grids.

**Done cuando**:

- No queda ninguna pantalla con flicker al entrar (skeleton o fade-in).
- Toggle de riego se siente "vivo" (animación de check + haptic).

### Fase 9 · Edge UX y pulido

**Entregables**:

- Estados offline (banner cuando no hay red, retry).
- Estados de error consistentes (`ErrorBoundary` + screen de fallback).
- Soporte de Dynamic Type (escala tipográfica respeta accessibility settings).
- Safe area y keyboard handling probado en iPhone con notch + sin notch + Android.

**Done cuando**:

- Smoke test manual de los flujos críticos en al menos 1 iPhone y 1 Android pasa.

## Criterios de "listo" (para toda la UI)

- Cero `color: '#...'` hardcoded fuera de `tokens.ts`.
- Cero `fontFamily: 'DM Sans'` repetido — siempre vía `Text` variant.
- Cada pantalla tiene los 4 estados explícitos: loading, empty, error, success.
- Componentes de dominio reciben datos por props, no leen del store directo (excepto contenedores explícitos como pantallas).
- `tsc --noEmit` limpio.
- Tests de dominio siguen en verde (no se rompe lógica de negocio al refactor visual).

## Riesgos

- **Carga de DM Sans en mobile.** Si la fuente da problemas (flash persistente que no se resuelve con `SplashScreen.preventAutoHideAsync()`, peso del bundle, o renderizado raro en algún device), se reemplaza por una equivalente sin reabrir el resto del DS. Plan B en orden de preferencia:
  1. **Inter** (`@expo-google-fonts/inter`): geométrica, neutral, usada por Linear/Notion/Stripe. Métrica muy parecida a DM Sans, transición casi invisible.
  2. **Plus Jakarta Sans** (`@expo-google-fonts/plus-jakarta-sans`): un toque más amable y redondeada que Inter, encaja mejor con el tono "musgo/jardín".
  3. **System font** (`San Francisco` en iOS, `Roboto` en Android): cero costo, máxima performance, pierde personalidad de brand. Última opción.
- **BottomSheet → resuelto.** Se usa `@gorhom/bottom-sheet` desde el día 1. No hay decisión pendiente. Lo único a evaluar es si nuestros snap points y backdrop necesitan extender la API de la librería.
- **Performance del FlatList de plantas con PlantTile complejo.** Si lagea con 30+ plantas, hay que medir antes de optimizar. Reanimated en cada tile y `expo-image` son los primeros sospechosos.
- **Refactor de `PlantForm` y `SectionForm`.** Ya tienen lógica; el refactor de Fase 3 debe ser cosmético, no tocar handlers. Riesgo de bugs por reescritura.
- **Divergencia visual durante la transición.** Mientras se ejecutan las fases, conviven pantallas viejas (dark, sin tokens) y nuevas. Mitigación: orden estricto de Fase 7 + branch único por fase, no merges parciales.

## Anti-scope (qué NO entra en este buildout)

- Dark mode real. Los tokens dejan la puerta abierta vía `ThemeProvider`, pero solo se entrega light en v1.
- Animaciones de "wow" tipo Lottie o splash animado custom. Se mantiene el splash estático.
- Componentes que la web tiene pero no se usan en flujo principal (`.plant-card` legacy, `.section-tabs`, `.identify-results` listable, etc. — ver sección final de `design-system.md`).
- Theming runtime configurable por usuario (font size custom, color picker). Solo Dynamic Type a nivel sistema.
- Storybook / Ladle. El `/dev/*` route alcanza para el volumen actual.
- Tests de UI con `@testing-library/react-native`. Vale la pena después de Fase 5 cuando los componentes ya son estables, no antes.

## Próxima acción concreta

Arrancar la **Fase 1** en una rama nueva:

1. Diseñar `tokens.ts` completo (puedo armarlo en la próxima sesión con todos los valores derivados de `styles.css`).
2. Implementar `ThemeProvider` + `useTheme()`.
3. Cargar DM Sans con `expo-font`.
4. Crear pantalla `/dev/theme` con paleta + escala tipográfica.
5. Reescribir `src/theme/colors.ts` o marcarlo como deprecated.

Si querés, en la siguiente sesión arrancamos directo con eso.
