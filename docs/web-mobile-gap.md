# Musgo · Gap web vs mobile

Audit del código web (`/index.html`, `/lib/`, `/styles.css`) contra el estado actual del mobile (`/mobile/app/`, `/mobile/src/`) al cierre del buildout DS-first.

**Cómo se usa este doc**:

1. Vos lo revisás y agregás lo que veas como usuario (mi audit es exhaustivo pero "ciego" a qué duele más).
2. Validás las severidades. Lo que yo marqué P0/P1/P2 es una propuesta.
3. Cuando esté validado, lo convertimos en roadmap por sprints/fases.

**Severidad**:

- **P0**: rompe el journey core. Sin esto, la app no es usable para algo que web ya resuelve.
- **P1**: parity de feature. Capacidades que web tiene y mobile no, sin las cuales la app se siente "menos" que la web.
- **P2**: polish / copies / UX detail. No bloquea uso pero baja la calidad percibida.

**Tipos**:

- `missing` — funcionalidad entera que no existe en mobile.
- `flow` — la funcionalidad existe pero el camino es distinto.
- `copy` — mismo flow, palabras distintas.
- `visual` — comportamiento idéntico pero composición visual distinta.
- `behavior` — UX/lógica distinta (ej. cálculo, defaults, validación).

---

## Sprint Match cards mejoradas (sesión actual)

✅ **`IdentifiedPlantCard` refactorizado** con el patrón web `.scan-match-card`:
  - Foto de referencia PlantNet en aspect ratio 4:5 ocupando todo el ancho de la card.
  - Fallback a emoji 🌿 si la imagen falla al cargar (estado `imgError`) o si no hay URL.
  - Chip "✓ Match con X% de confianza" centrado con `CheckIcon` brand-soft + texto en brand bold.
  - Jerarquía de nombres: nombre científico arriba en `h2`, nombre común abajo en italic muted.
  - Card entera tappable (sin botón "Usar este" interno). API: `onUse` → `onPress`.
✅ **`scan/index.tsx` actualizado**: pasa `referenceImageUrl` desde `match.referenceImages[0]?.url`. Copy del header alineado a web: "Coincidencias encontradas" (en lugar de "X coincidencias").

### Gaps que cerró este sprint

- (P1) Match cards mejor — ✅
  - foto de referencia grande ✅
  - badge confidence con check icon ✅
  - jerarquía científico/común ✅
  - card tappable sin botón ✅
- (P2) Copy "Coincidencias encontradas" — ✅

### Gaps que siguen pendientes (mayores)

- **Stacked bars + leyenda** en `DashboardChartCard` (hoy solo thirsty).
- **Auth con toggle** entre signin/signup (hoy 2 pantallas).
- **Google Sign-In nativo**.
- **Avatar Google** en profile.
- **Push toggle** en profile.
- **Links legales** (Privacy + Terms) en auth + profile.
- **Migración base64 → Storage** (one-time job).
- Copies sueltos en spaces / empty states / scan.

## Sprint PlantTile + Sedientas aplicado (sesión anterior)

✅ **`getPlantWaterStatus`** portado a `src/domain/water-status.ts` con 8 tests unitarios. Devuelve `{ kind, text, daysSinceLastWater, daysUntilNext }`. Estados: `no_log` / `overdue` / `today` / `tomorrow` / `upcoming`.
✅ **4 iconos SVG de status** (`riego-empty`, `riego-partial`, `riego-full`, `riego-unknown`) portados a `mobile/assets/icons/`. Multi-color preservado (rojo para atraso, gris para unknown, verde para OK).
✅ **`WaterStatusIcon` component** que mapea `PlantWaterStatusKind` → SVG correcto.
✅ **`PlantTile` refactorizado**: ahora muestra **foto real** cuando `plant.imagePreview` existe, sino emoji fallback. Status calculado dinámico ("Regar hoy / mañana / en N días / N días de atraso / Sin riegos registrados") con icono + color según severidad (danger para overdue, brand para today/tomorrow).
✅ **Pantalla `(tabs)/thirsty`** con la lista de plantas que necesitan riego hoy. Empty state "Nada para regar hoy". Tab oculta del tab bar (`href: null`) accesible solo desde el dashboard.
✅ **Botón "Ver todo"** en `DashboardSummaryCard` cuando hay plantas con sed → navega a `/thirsty`.
✅ **Copy del dashboard** alineado a web: "Tu vista diaria" + subtítulo.

### Gaps que cerraron este sprint

- (P1) Status calculado de planta en PlantTile (con iconos por estado) — ✅
- (P1) Foto real en PlantTile cuando existe imagePreview — ✅
- (P1) Pantalla "Plantas con sed" + botón "Ver todo" en summary — ✅
- (P2) Copy del dashboard "Tu vista diaria" — ✅

### Gaps que siguen pendientes (mayores)

- **Stacked bars + leyenda** en `DashboardChartCard` (hoy solo thirsty).
- **Auth con toggle** entre signin/signup (hoy 2 pantallas).
- **Google Sign-In nativo**.
- **Avatar Google** en profile.
- **Push toggle** en profile.
- **Links legales** (Privacy + Terms) en auth + profile.
- **Match cards mejor** (foto de referencia más grande, badge confidence con icon check).
- **Migración base64 → Storage** (one-time job).
- Copies sueltos en spaces / empty states / scan.

## Sprints D + E + setup + polish aplicados (sesión anterior)

### Setup (todas las deps adoptadas)

✅ **DM Sans cargada** vía `@expo-google-fonts/dm-sans` + `expo-font` + `expo-splash-screen`. Splash hold hasta `fontsLoaded`. `tokens.ts::fonts` ahora apunta a `DMSans_400Regular`, `DMSans_500Medium`, `DMSans_700Bold`.
✅ **`@gorhom/bottom-sheet` swappeado**. Mantenida la API pública del wrapper anterior (`visible / onClose / title / dismissOnBackdrop / children`). Drag-to-dismiss real, backdrop con tap, dynamic sizing. `BottomSheetModalProvider` montado al root + `GestureHandlerRootView`.
✅ **SVG icons reales** via `react-native-svg-transformer`. Iconos `ScannerIcon`, `SunIcon`, `WaterIcon`, `LocationIcon`, `DeleteIcon`, `PlantIcon`, `PhotoIcon`, `CalendarDropIcon`, `CheckIcon` portados desde `/resources/*.svg`. Todos editados para usar `fill="currentColor"` + props `size`/`color`.
✅ **`expo-linear-gradient`** disponible. Helpers `GradientBrandSoft` y `GradientBrandCta` para los gradients verdes de la web.
✅ **`expo-haptics`** wrapper en `src/lib/haptics.ts` con `hapticTap`, `hapticSuccess`, etc.

### Sprint D · Plant detail con tabs

✅ Componente `Tabs<K>` genérico tipado (segmented control con underline en activo).
✅ Plant detail rediseñado con 3 tabs **Riegos / Detalles / Evolución** (replica fielmente la arquitectura web).
✅ **Edit in-place**: state local con draft, "Guardar" único en footer fijo que persiste vía `upsertPlant`. Botón se deshabilita si no hay cambios (`!isDirty`).
✅ **Frecuencia como dropdown curado** `[1,2,3,5,7,14,30]` en tab Riegos (también en `scan/confirm`).
✅ **Pantalla `[id]/edit.tsx` eliminada** (ya no hace falta).
✅ Footer fijo con Eliminar + Guardar (en lugar de scroll bottom).

### Sprint E · Galería de fotos (Evolución) + foto principal editable

✅ Repositorio `src/lib/supabase/photos.ts`: fetch/upload/delete sobre tabla `plant_photos` y storage bucket `plant-images` (paths `{userId}/photos/{plantId}/{ts}.jpg` para timeline, `{userId}/{plantId}.jpg` para principal).
✅ Store local `src/lib/photos-store.ts` con buckets por `plantId` + optimistic updates.
✅ `EvolucionTab`: estados loading / error / empty / grid. Auto-load al entrar.
✅ `PhotoGrid`: tiles 3-columnas con fecha overlay.
✅ `PhotoUploadSheet`: bottom sheet con cámara/galería + nota + preview + guardar.
✅ `PhotoLightbox`: modal full-screen con backdrop oscuro + nota + delete.
✅ `MainPhotoEditor` (tab Detalles): avatar tappable → bottom sheet de cámara/galería → upload optimista a Storage + persist a DB.

### Polish

✅ Haptics en regar (tap + success cuando sincroniza).
✅ Gradients en `DashboardSummaryCard` y `ProfileCard` (suaves, brand-soft).

### Gaps que cerraron estos sprints

- (P1) Galería de fotos por planta — ✅
- (P1) Foto principal editable + overlay — ✅
- (P1) Tabs Riegos / Detalles / Evolución — ✅
- (P1) Edit in-place + botón "Guardar" único — ✅
- (P1) Frecuencia dropdown curado en detail también — ✅
- (P1) `Tabs` reusable — ✅
- (P1) DM Sans cargada (gap de tipografía) — ✅
- (P1) SVG icons reales — ✅
- (P2) Gradients en hero cards — ✅
- (P2) Haptic feedback básico — ✅
- (P2) BottomSheet con drag-to-dismiss real — ✅

### Gaps que siguen pendientes (mayores)

- **Status calculado de planta** en PlantTile ("Regar mañana", "X días de atraso", etc.) + iconos `riego-*.svg` por estado. → Sprint B del roadmap original.
- **Foto real en PlantTile** cuando `imagePreview` existe (hoy solo emoji).
- **Pantalla "Plantas con sed"** (`/dashboard/thirsty`) + botón "Ver todo" en summary.
- **Stacked bars + leyenda** en `DashboardChartCard` (hoy solo thirsty).
- **Auth con toggle** entre signin/signup (hoy 2 pantallas).
- **Google Sign-In nativo**.
- **Avatar Google** en profile.
- **Push toggle** en profile.
- **Links legales** (Privacy + Terms) en auth + profile.
- **Match cards mejor** (foto de referencia más grande, badge confidence con icon check).
- **Migración base64 → Storage** (one-time job).
- Copies sueltos.

## Sprint C aplicado (metadata Haiku)

✅ `src/lib/plant-metadata.ts` portado del web (fetch + tipos + `snapToFreqOption`).
✅ Tipo `PlantMetadata` en `domain/types.ts` con `fun_fact` opcional.
✅ `Plant.metadata?` agregado al tipo de dominio + flags `metadataLoading` / `metadataError`.
✅ `fetchUserGarden` enriquece plants identificadas con join a `plant_metadata` (idéntico al patrón web).
✅ `createPlant` ahora acepta `identifiedSpecies` + `identificationConfidence` para que las plantas creadas desde scan persistan y luego joinneen con el cache.
✅ `PlantMetadataCard` (rows luz/riego/origen con emojis ☀️💧📍, skeleton en loading).
✅ `PlantFunFactCard` ("¿Sabías que?" con skeleton en loading).
✅ Wire en `scan/confirm`: auto-fetch de metadata + auto-fill de frecuencia con `snapToFreqOption` si user no tocó el campo + render de cards.
✅ Wire en plant detail: solo renderea metadata cards si la planta es identificada, con lazy fetch si no llegó del garden.

**Gaps que cerró este sprint** (entre paréntesis la severidad original):

- (P1) Plant metadata enrichment con Haiku — ✅
- (P1) Metadata cards (Luz / Riego / Origen) — ✅
- (P1) "¿Sabías que?" — ✅
- (P1) Frecuencia como dropdown curado — ✅ (en scan/confirm; falta migrarlo al detail/edit)
- (P2) Auto-fill de frecuencia desde Haiku con snap — ✅
- (P2) Re-fetch lazy si la planta no trae metadata — ✅

**No incluido en este sprint** (queda para el siguiente):

- Imagen de referencia de PlantNet en el detail tab Detalles (sí está en scan/confirm).
- Migrar el dropdown de frecuencia al detail/edit (sigue Stepper).
- Foto principal editable (Sprint E).
- Galería de fotos (Sprint E).
- Tabs en plant detail (Sprint D).

## Cambios aplicados (post-feedback Franco · sesión actual)

✅ **Scan ahora es tab raíz**, no modal anidado en plants. Las tabs son: Inicio / Plantas / Scan / Espacios / Perfil.
✅ **Eliminada pantalla `(tabs)/plants/add`** (no existía en web; fue malentendido).
✅ **Eliminado FAB de plants list**. El acceso a "agregar planta" es la tab Scan + CTA del empty state.
✅ **Pantalla nueva `(tabs)/scan/confirm`**: post-selección de match, antes de crear la planta. Muestra foto del usuario + thumbnail de referencia PlantNet + badge de confidence + nombres + form (nombre / freq / espacio). No tiene calendar (no tiene sentido pre-creación).
✅ **`(tabs)/scan/manual`** dedicada para crear sin scan (link "Crear manualmente" desde scan tab).
✅ **ScannerIcon component** (aproximación con primitives RN del SVG web). El SVG real está en `mobile/assets/icons/scanner.svg` listo para usar cuando se instale `react-native-svg`.
✅ **Frecuencia como dropdown curado** `[1,2,3,5,7,14,30]` con labels naturales en scan/confirm. PlantForm sigue usando Stepper hasta que migremos el detail también.
✅ **Copies de plants list alineados**: "Tu Jardín" + "Bienvenid@ a tu colección", chip "Todos", empty state "Sin plantas todavía / Empieza a subir tus plantas...".
✅ **Scan store** (`src/lib/scan-store.ts`) para preservar estado entre la tab y la pantalla `confirm`.

**Gaps que siguen pendientes**: galería de fotos, plant metadata Haiku, plant detail rediseñado con tabs, foto principal editable, status calculado en PlantTile, foto real en PlantTile, Google Sign-In, push toggle, plantas con sed, avatar Google, edit in-place (eliminar pantalla edit aparte), copies en bloque, splash text. Ver el resto del doc — severidades sin cambios para esos ítems.

## Resumen ejecutivo

El estado actual de mobile cubre la **estructura básica** (auth + CRUD de plants y sections + scanner) pero faltan **2 features enteras** que pesan muchísimo:

1. **Galería de fotos por planta ("Evolución")** — tab completa con upload, lightbox, delete. Tabla `plant_photos` en DB. (`P1`)
2. **Plant metadata enrichment con Haiku** — cuando identificás una planta, se hace fetch a edge function `plant-metadata` que devuelve luz / riego sugerido / origen / fun fact. Se rendea como card. (`P1`)

Y hay un **rediseño grande del plant detail** que en web son 3 tabs (Riegos / Detalles / Evolución) y en mobile es una sola pantalla scrolleada. Si querés parity de calidad, hay que rehacerlo.

Aparte hay docenas de copies y detalles. Lo más estructural está en P0/P1; P2 es trabajo de polish que se puede atacar en bloque al final.

**Corrección crítica**: malinterpreté el plan inicial y creé una pantalla `(tabs)/plants/add` intermedia. En web no existe — el FAB de plants list va directo a la pantalla **scan** (que se llama "Agrega una planta" y tiene cámara + botón "Crear manualmente" debajo). Está marcado abajo como `[GLOBAL] flow`.

---

## [GLOBAL]

### `flow` — Pantalla "agregar planta" intermedia que no debería existir (P0)

- **Web**: el FAB / "Agregar planta" en plants list va directo a `/scanner`. La pantalla scan es la que se llama "Agrega una planta" — tiene cámara como acción principal + botón "Crear manualmente" debajo del scan box. No hay intermedio.
- **Mobile (actual)**: `(tabs)/plants/add` con dos cards grandes (manual / scan). Doble click para llegar a la cámara.
- **Fix**: eliminar `(tabs)/plants/add`. El FAB lleva a `scan`. La pantalla scan absorbe el rol de "agregar planta".
- **Fuente**: `lib/auth-screens/scanner-screen.js:54-101`.

### `missing` — Landing pública pre-auth (P2)

- **Web**: `/` muestra una landing con hero + 3 stories + CTA band + footer. Solo si NO hay sesión.
- **Mobile**: ninguna pantalla pre-auth, va directo a sign-in.
- **Decisión**: en mobile la "landing" no aplica como concepto (después de instalar, no se "navega" a la home). Lo que sí podría tener sentido es un **onboarding de 2-3 slides** al primer abrir. Marcamos P2 hasta validar si vale.
- **Fuente**: `lib/public-screens.js:2-75`.

### `missing` — Links legales (Privacy + Terms) (P1, requisito Apple)

- **Web**: presentes en auth screen (footer "Al continuar...") y profile (`legal-links`).
- **Mobile**: no aparecen en ningún lado.
- **Requisito**: Apple App Review exige acceso visible a Privacy Policy.
- **Fuente**: `lib/public-screens.js:115`, `lib/auth-screens/overview-screens.js:179-182`.

### `missing` — Google Sign-In (P1)

- **Web**: botón "Continuar con Google" en auth screen.
- **Mobile**: no. (Ya estaba previsto en el plan original como pendiente).
- **Fuente**: `lib/public-screens.js:92-95`.

### `behavior` — Cálculo de "próxima acción" en plant tile (P1, alto impacto UX)

- **Web**: muestra un status calculado dinámicamente: "Sin riegos registrados" / "X días de atraso" / "Regar hoy" / "Regar mañana" / "Regar en X días". Con icono SVG (`riego-empty`, `riego-partial`, `riego-full`, `riego-unknown`).
- **Mobile**: solo "Regada el YYYY-MM-DD · cada Xd". Mucho menos informativo.
- **Fuente**: `lib/shared-render.js:100-137` (`getPlantWaterStatus`).

### `behavior` — Foto real en plant tile cuando existe (P1)

- **Web**: si `plant.imagePreview` existe (URL de Supabase Storage), se muestra como imagen. Si no, emoji fallback.
- **Mobile**: solo muestra emoji. Las plantas identificadas pierden la foto.
- **Fuente**: `lib/shared-render.js:144-146`.

### `copy` — Toasts con emojis al inicio (P2)

- **Web**: "💧 X regada", "🌱 X guardada", "🗑️ X eliminada", "📸 Foto guardada", "🌿 Foto principal actualizada", "💧 X al día" (regar sección).
- **Mobile**: "Regada", "Cambios guardados", etc. sin emoji.
- **Fuente**: `lib/app-actions/plants-actions.js:236, 265, 333, 409, 432, 551, 626`, `lib/app-actions/spaces-actions.js:97`.

### `visual` — Splash con copy "Fotosíntesis en progreso…" (P2)

- **Web**: splash screen con spinner + texto "Fotosíntesis en progreso…".
- **Mobile**: ActivityIndicator solo, sin texto.
- **Fuente**: `lib/shared-render.js:91-98`.

---

## [AUTH]

### `flow` — Una pantalla con toggle vs dos pantallas separadas (P2)

- **Web**: `/login` único, con toggle "Entrar" / "Crear cuenta" arriba del form. Cambiar de modo no navega, solo cambia el botón.
- **Mobile**: dos pantallas separadas (`sign-in.tsx`, `sign-up.tsx`) con `Link` entre ellas.
- **Decisión**: el toggle web es mejor UX. Vale rehacer.
- **Fuente**: `lib/public-screens.js:84-117`.

### `copy` — Título "Ingresar" vs "Entrar" (P2)

- Web: "Ingresar" como h1. Mobile: "Entrar" / "Crear cuenta" (uno por pantalla). Si vamos a toggle único, copy "Ingresar".
- **Fuente**: `lib/public-screens.js:88`.

### `copy` — Mínimo de contraseña (P2)

- Web dice "Mínimo 6 caracteres" (placeholder).
- Mobile valida `password.length < 8`.
- **Decisión**: alinear. 8 es mejor por seguridad, ajustar placeholder web cuando hagamos pasada de copy.
- **Fuente**: `lib/public-screens.js:110`.

### `missing` — Feedback inline (error / success) en el panel (P1)

- **Web**: `auth-feedback.error` / `auth-feedback.success` dentro del panel cuando algo pasa (signup que requiere confirmación de email muestra success card adentro).
- **Mobile**: usa Toast (igualmente válido, pero el feedback "Revisá tu email" se pierde rápido). Vale agregar inline también o aumentar duración del toast.
- **Fuente**: `lib/public-screens.js:101-102`.

### `missing` — Botón Google + divisor "o con email" (P1)

Ya cubierto en GLOBAL.

---

## [DASHBOARD] / OVERVIEW

### `copy` — Título y subtítulo (P2)

- Web: "Tu vista diaria" / "Mira tu jardín y las acciones que tienes que realizar."
- Mobile: "Hola X" / "Tu jardín".
- **Fuente**: `lib/auth-screens/overview-screens.js:31-35`.

### `flow` — Botón "Ver todo" en el summary card → pantalla "Plantas con sed" (P1)

- **Web**: la card del número de plantas sedientas tiene un botón "Ver todo" que abre `/dashboard/thirsty` (lista filtrada).
- **Mobile**: el número no es clickeable. No existe la vista de plantas sedientas.
- **Fuente**: `lib/auth-screens/overview-screens.js:41`, `lib/auth-screens/overview-screens.js:75-111`.

### `missing` — Pantalla "Plantas con sed" (`thirstyPlants`) (P1)

- Vista dedicada al subset de plantas que necesitan riego hoy. Renderea PlantTile grid + estado vacío "Nada para regar hoy".
- **Mobile**: no existe.
- **Fuente**: `lib/auth-screens/overview-screens.js:75-111`.

### `visual` — Chart: stacked bars (watered + thirsty) + leyenda (P1)

- **Web**: barras stacked (parte de abajo `watered`, parte de arriba `thirsty`). Leyenda con dos íconos: "Plantas regadas" / "Necesitan riego". Iconos SVG.
- **Mobile**: barras solo de "thirsty", sin leyenda.
- **Fuente**: `lib/auth-screens/overview-screens.js:42-69`.

---

## [PLANTS] · Lista

### `copy` — Título y subtítulo (P2)

- Web: "Tu Jardín" / "Bienvenid@ a tu colección".
- Mobile: "Tu jardín" (sin subtítulo).
- **Fuente**: `lib/auth-screens/plants-screens.js:42-43`.

### `copy` — Chip "Todos" vs "Todo" (P2)

- Web: "Todos". Mobile: "Todo".
- **Fuente**: `lib/auth-screens/plants-screens.js:27`.

### `behavior` — Empty state copy + CTA (P2)

- Web: "Sin plantas todavía" / "Empieza a subir tus plantas al jardín y no te perderás un solo riego" / CTA "Añadir planta" → `scan`.
- Mobile: "Aún no tenés plantas" / "Tocá + para agregar la primera." / CTA "Agregar planta" → `add` (que no debería existir).
- **Fuente**: `lib/auth-screens/plants-screens.js:57-63`.

### `visual` — Card extra "+ Agregar planta" al final del grid (P1)

- **Web**: dentro del grid, después de las plantas, hay una card grande con "＋ Agregar planta" (estilo `add-plant-card-mobile`). Esto reemplaza la necesidad de FAB.
- **Mobile**: usa FAB flotante.
- **Decisión**: el FAB es mobile-native estándar y va bien. Pero la card al final del grid también funciona y es más descubrible. Evaluar si vale.
- **Fuente**: `lib/auth-screens/plants-screens.js:51-54`.

### `visual` — PlantTile: foto real + status calculado + botón "Regar" pill (P1)

Ya cubierto en GLOBAL pero acá impacta directo a la lista.

---

## [PLANTS] · Detalle

### `flow` — 3 tabs internas: Riegos / Detalles / Evolución (P1, refactor grande)

- **Web**: el detalle se organiza en 3 tabs full-width. Cada tab tiene contenido distinto:
  - **Riegos**: calendario + dropdown frecuencia + dropdown espacio.
  - **Detalles**: input nombre + card con foto editable + metadata (luz/riego/origen) + fun fact.
  - **Evolución**: galería de fotos + botón agregar.
- **Mobile**: una sola pantalla scrolleada con hero card + meta row + water CTA + calendar + acciones. No hay tabs.
- **Fuente**: `lib/auth-screens/plants-screens.js:399-499`.

### `missing` — Tab "Evolución" (galería de fotos) (P1)

- **Web**: tab con grid de fotos. Cada foto tiene fecha + nota opcional. Botón "＋ Agregar foto" abre modal con file picker + nota opcional + preview + guardar. Al tocar una foto, abre lightbox con delete inline.
- **Mobile**: no existe.
- **Tabla**: `plant_photos` (id, plant_id, user_id, url, note, taken_at).
- **Storage**: `plant-images` bucket, path `{userId}/photos/{plantId}/{timestampMs}.jpg`.
- **Fuente**: `lib/auth-screens/plants-screens.js:307-394, 462-474`, `lib/app-actions/plants-actions.js:437-631`, `lib/supabase-data.js:269-352`.

### `missing` — Foto principal editable + overlay (P1)

- **Web**: en tab "Detalles", el avatar de la planta tiene overlay "Cambiar foto principal". Tap → file picker → comprime → upload a Storage → update `imagePreview`.
- **Mobile**: solo emoji, no se puede setear foto.
- **Fuente**: `lib/auth-screens/plants-screens.js:441-453`, `lib/app-actions/plants-actions.js:415-433`.

### `missing` — Metadata cards (Luz / Riego / Origen) (P1)

- **Web**: en card identificada (creación + detalle tab Detalles), rows con ícono + label + valor:
  - Luz (Directa / Indirecta)
  - Riego (Alto · cada N días / Medio · cada N días / etc.)
  - Origen (free text de Haiku, ej. "Sudeste asiático")
- Loading skeleton si está pendiente. Auto-fetch lazy si la planta no la tiene cargada.
- **Mobile**: no existe el concepto.
- **Edge function**: `plant-metadata` con cache en tabla `plant_metadata`.
- **Cliente**: `lib/plant-metadata.js`.
- **Fuente**: `lib/auth-screens/plants-screens.js:151-183`, `lib/app-actions/plants-actions.js:43-79, 121-159`.

### `missing` — "¿Sabías que?" (fun_fact de Haiku) (P1)

- **Web**: card aparte con un párrafo de curiosidad sobre la planta. Loading skeleton durante fetch.
- **Mobile**: no.
- **Fuente**: `lib/auth-screens/plants-screens.js:128-149`.

### `missing` — Imagen de referencia de PlantNet (P2)

- **Web**: en la card de planta identificada, mini-thumbnail con badge "Ref." sobre la foto del usuario. Es la imagen de referencia de PlantNet para la especie identificada.
- **Mobile**: no.
- **Fuente**: `lib/auth-screens/plants-screens.js:212-218`.

### `flow` — Frecuencia: dropdown curado vs Stepper (P1)

- **Web**: `<select>` con opciones `[1, 2, 3, 5, 7, 14, 30]` con labels "Cada día" / "Cada 2 días" / ... / "Cada 30 días".
- **Mobile**: Stepper 1-60.
- **Decisión**: el dropdown curado es mejor UX para este caso. Stepper de 1 en 1 hasta 60 es tedioso y los presets reflejan los valores reales que tiene sentido usar.
- **Fuente**: `lib/auth-screens/plants-screens.js:231-234, 257-260, 416-418`.

### `flow` — Acciones del detalle: "Eliminar" + "Guardar" (P1)

- **Web**: 2 botones al final del detalle: "Eliminar" (danger) + "Guardar" (primary). El "Editar" no existe — los campos son editables in-place dentro de cada tab y se guardan con el botón principal.
- **Mobile**: "Editar" abre pantalla aparte + "Eliminar". Doble nav.
- **Decisión**: el patrón web (edit in-place + guardar) es mejor en mobile también. Eliminamos la pantalla `edit.tsx` separada.
- **Fuente**: `lib/auth-screens/plants-screens.js:493-496`.

### `behavior` — Default a tab "Riegos" al abrir + persiste durante render (P2)

- **Web**: `state.detailActiveTab = 'riegos'` al abrir. Si subís una foto desde "Evolución", el re-render mantiene "Evolución" activa.
- **Mobile**: no aplica hasta que implementemos tabs.
- **Fuente**: `lib/app-actions/plants-actions.js:27`.

### `behavior` — Re-fetch de metadata si el plant no la tiene cargada (P2)

- **Web**: al abrir el detalle, `ensurePlantMetadataLoaded(plant)` chequea si la planta tiene `metadata` con `fun_fact`. Si no, dispara fetch lazy.
- **Mobile**: no aplica hasta que implementemos metadata.
- **Fuente**: `lib/app-actions/plants-actions.js:45-80`.

---

## [PLANTS] · Crear

### `flow` — Pantalla "Crear" diferenciada según venga de scan o manual (P1)

- **Web**: una misma pantalla `plantCreate` que renderea distinto según `draft.identifiedSpecies`:
  - **Identificada** (vino del scan): kicker "¡Lo tenemos!", título "Planta identificada", card grande con foto + nombres común/científico + metadata + fun fact + form abajo (nombre / freq / espacio).
  - **Manual**: hero card 🪴 + título "Crear planta" + form (nombre / freq / espacio).
- **Mobile**: `new.tsx` con form genérico, sin diferencia.
- **Fuente**: `lib/auth-screens/plants-screens.js:185-274`.

### `copy` — Botón "Guardar" (web) vs "Crear planta" (mobile) (P2)

- Web siempre dice "Guardar".
- Mobile dice "Crear planta" en `new`, "Guardar cambios" en `edit`. Coherente con su patrón.
- **Decisión**: si unificamos detail con edit in-place, "Guardar" para todo.
- **Fuente**: `lib/auth-screens/plants-screens.js:270`.

### `behavior` — Auto-fill de frecuencia desde Haiku con snap a opciones (P2)

- **Web**: cuando llega la metadata, si `watering_freq_days` está y el usuario no tocó el campo (`!freqUserChanged`), se setea automáticamente al valor más cercano de `[1,2,3,5,7,14,30]`.
- **Mobile**: no aplica hasta que implementemos metadata.
- **Fuente**: `lib/app-actions/plants-actions.js:99-115, 142-148`.

### `behavior` — Subida de imagen al guardar (de identificación al storage) (P1)

- **Web**: si la planta tiene una preview base64 (vino del scan), al guardar la sube a Supabase Storage como `{userId}/{plantId}.jpg` y reemplaza la preview por la URL pública.
- **Mobile**: el flujo de scan crea la planta con `imagePreview: ''` — la foto del usuario se pierde.
- **Fuente**: `lib/app-actions/plants-actions.js:298-312`, `lib/supabase-data.js:184-201`.

### `missing` — Campo emoji en crear manual (P2)

- **Web**: si es manual, el emoji se fija en `🪴`. No se pide al usuario.
- **Mobile**: PlantForm muestra picker de emoji. Es UX extra que web no da.
- **Decisión**: mantener el picker en mobile (es positivo). No es un gap real, solo una diferencia.
- **Fuente**: `lib/app-actions/plants-actions.js:290`.

---

## [PLANTS] · Scan

### `copy` — Título: "Agrega una planta" / "Enfoca tu planta para identificarla automáticamente o cárgala manualmente." (P2)

- **Mobile**: no tiene título dedicado (header del Stack).
- **Fuente**: `lib/auth-screens/scanner-screen.js:62-65, 84-86`.

### `flow` — Scan box es UN botón grande (no dos: cámara + galería) (P1)

- **Web**: el scan box entero es tappable y abre el file picker (cámara si está disponible, galería como fallback) gracias a `<input type="file" accept="image/*" capture="environment">`.
- **Mobile**: dos botones separados "Cámara" / "Galería" debajo del scan box (porque iOS exige permisos distintos).
- **Decisión**: el patrón mobile es necesario en native (la única forma de elegir cámara vs galería con permisos correctos). Mantener.
- **Fuente**: `lib/auth-screens/scanner-screen.js:88-95`.

### `behavior` — Estado del scan box cambia (idle / loading / has-results) (P2)

- **Web**: el mismo scan box muestra:
  - **Idle**: icono + "Escanear planta" + "Reconocimiento con AI".
  - **Loading**: spinner + "Analizando planta..." + mensaje.
  - **Has results**: thumbnail de la foto + "Analizar otra foto" (sin copy descriptivo).
- **Mobile**: ya implementado con ScanBox component, pero el copy "Analizar otra foto" no existe ni el cambio de título.
- **Fuente**: `lib/auth-screens/scanner-screen.js:73-79`.

### `visual` — Match cards: foto de referencia + badge confidence (P1)

- **Web**: cada match es una card grande con:
  - Thumbnail de la imagen de referencia de PlantNet (foto real de esa especie, no la del usuario).
  - Badge "Match con X% de confianza" con icono check verde (`check-icon.svg`).
  - Nombre científico (grande) + nombre común (si existe).
- **Mobile**: `IdentifiedPlantCard` solo muestra nombres + confidence text.
- **Fuente**: `lib/auth-screens/scanner-screen.js:13-44`.

### `behavior` — Selectar un match dispara `openPlantCreateView` con prefill (P1)

- **Web**: tocar una card de match navega a la pantalla `plantCreate` con el draft prellenado y dispara el fetch de metadata en paralelo.
- **Mobile**: navega directo al detalle con la planta ya creada (sin pasar por la pantalla de "confirmar / completar datos").
- **Fuente**: `lib/app-actions/plants-actions.js:161-176`, `lib/app-actions/scanner-actions.js` (no leí pero es donde vive).

### `missing` — Botón "Crear manualmente" debajo del scan box (P0)

Cubierto en GLOBAL pero relevante acá también: cuando NO hay results, hay un link "Crear manualmente" debajo del scan box (no es el flujo "ya escaneé y no encontré"; es "no quiero escanear, sé qué planta es").

- **Fuente**: `lib/auth-screens/scanner-screen.js:98`.

---

## [SPACES]

### `copy` — Título y subtítulo (P2)

- Web: "Tus Espacios" / "Organiza tu oasis personal por habitaciones."
- Mobile: "Espacios" (sin subtítulo).
- **Fuente**: `lib/auth-screens/spaces-screens.js:46-48`.

### `visual` — SpaceCard: icono a la **derecha**, no a la izquierda (P2)

- **Web**: nombre + count a la izquierda, icono grande a la derecha. Card grande, vertical en mobile.
- **Mobile**: icono a la izquierda. Yo lo puse mal — el patrón web es lo opuesto.
- **Fuente**: `lib/auth-screens/spaces-screens.js:27-41`.

### `copy` — Botones del space card (P2)

- Web: "Editar" (secondary) + "Regar todo" (primary).
- Mobile: "Ver" + "Regar todas".
- **Decisión**: alinear a web. "Regar todo" suena más natural.
- **Fuente**: `lib/auth-screens/spaces-screens.js:37-38`.

### `visual` — Card extra "+ Añadir Nuevo Espacio" al final del grid (P1)

- **Web**: card grande tappable al final de la lista de espacios, mismo patrón que en plants.
- **Mobile**: usa FAB flotante.
- **Fuente**: `lib/auth-screens/spaces-screens.js:52-55`.

### `flow` — Edit screen único para crear y editar (P1)

- **Web**: una sola pantalla `editSpace` que renderea con título distinto según `editingSectionId`. Botones al pie:
  - Si está editando: "Guardar" + "Eliminar" (danger).
  - Si está creando: "Guardar" + "Cancelar" (mismo botón danger, distinto callback).
- **Mobile**: dos pantallas (`new.tsx` y `[id]/edit.tsx`) con form solo.
- **Decisión**: alinear si simplifica. La asimetría web (`btn-danger` para "Cancelar" cuando es create) es rara — probablemente reemplazaríamos por un botón secondary.
- **Fuente**: `lib/auth-screens/spaces-screens.js:61-122`.

### `visual` — Emoji picker grande con grid + helper text (P2)

- **Web**: grid de muchos emojis (no solo 10) con botones grandes. Helper text "Utiliza nombres cortos para identificar rápidamente dónde se encuentran tus plantas." al final.
- **Mobile**: 10 emojis fijos en EmojiPicker, sin helper.
- **Fuente**: `lib/auth-screens/spaces-screens.js:99-112`.

### `behavior` — Regar sección incluye toast con nombre (P2)

- **Web**: toast `💧 ${section.name} al día`.
- **Mobile**: toast genérico "X regada".
- **Fuente**: `lib/app-actions/spaces-actions.js:97`.

### `behavior` — Empty del space card al regar (P2)

- **Web**: si la sección no tiene plantas, toast "⚠️ Esta sección no tiene plantas todavía".
- **Mobile**: toast "Sin plantas en este espacio".
- **Fuente**: `lib/app-actions/spaces-actions.js:71`.

---

## [PROFILE]

### `missing` — Avatar de Google (avatar_url) (P1)

- **Web**: si el user vino por Google sign-in, `user.user_metadata.avatar_url` está poblado y se muestra como `<img>`. Fallback a inicial del nombre.
- **Mobile**: emoji fijo 🌿.
- **Fuente**: `lib/auth-screens/overview-screens.js:146-157`.

### `missing` — Nombre del usuario (`getUserName`) (P2)

- **Web**: `getUserName(user)` deriva nombre desde Google metadata o email. Se muestra grande encima del email.
- **Mobile**: usa `email.split('@')[0]`. Funcional pero menos prolijo.
- **Fuente**: `lib/auth-screens/overview-screens.js:159-160`.

### `missing` — Toggle de push notifications (P1)

- **Web**: botón en profile que cambia según estado:
  - Si soporta + no denegado + no subscripto: "🔔 Activar recordatorios de riego" (primary).
  - Si subscripto: "Desactivar recordatorios de riego" (secondary).
  - Si denegado: texto "Las notificaciones están bloqueadas. Habilitálas desde Configuración → Musgo." (no botón).
- **Mobile**: no expone UI para esto. El registro ocurre automático al loguear.
- **Decisión**: necesitamos el toggle por compliance + UX (usuarios quieren controlar esto).
- **Fuente**: `lib/auth-screens/overview-screens.js:113-127`.

### `copy` — Título: "Perfil" / "Tu cuenta y el resumen de tu colección." (P2)

- Mobile no tiene subtítulo.
- **Fuente**: `lib/auth-screens/overview-screens.js:151-152`.

### `missing` — Links legales al pie (P1, ya cubierto en GLOBAL)

- **Fuente**: `lib/auth-screens/overview-screens.js:179-182`.

---

## [DOMAIN / DATA]

### `missing` — Tabla `plant_photos` consumida (P1)

- DB ya tiene la tabla. Mobile no la consume.
- **Fuente**: `supabase/migrations/` (ver schema).

### `missing` — Tabla `plant_metadata` consumida (P1)

- DB tiene cache compartido entre usuarios. Mobile no la consume al cargar plants.
- **Fuente**: `lib/supabase-data.js:74-99`.

### `missing` — Upload a Storage bucket `plant-images` (P1)

- Web sube tanto foto principal como fotos de evolución a este bucket.
- Mobile: el scanner sube la imagen para identificarla, pero NO la persiste como foto de la planta.
- **Fuente**: `lib/supabase-data.js:178-216`.

### `behavior` — Migración base64 → Storage (P2)

- **Web**: `migrateBase64ImagesToStorage` corre al iniciar la app si detecta plants con `imagePreview` que es `data:...`. Las convierte a archivos y las sube.
- **Mobile**: no aplica todavía (no tiene base64 ni storage upload).
- **Fuente**: `lib/supabase-data.js:221-267`.

---

## Resumen de cantidades

- **P0 (rompen journey)**: 1 (pantalla `add` que no debería existir) + 1 (botón "Crear manualmente" en scan).
- **P1 (parity de feature)**: ~22 ítems. La mayoría se concentra en:
  - 6 ítems alrededor de **Galería de fotos / Foto principal**.
  - 5 ítems alrededor de **Plant metadata (Haiku)**.
  - 4 ítems alrededor de **Plant detail con tabs**.
  - 3 ítems alrededor de **PlantTile** (foto + status + botón pill).
  - 4 ítems sueltos (Google Sign-In, push toggle, plantas con sed, legales).
- **P2 (polish)**: ~25 ítems de copies y detalles menores.

## Roadmap propuesto (por validar contigo)

Si todo entra antes del store launch, sugiero atacar en este orden:

### Sprint A · "Fixes de plan" (corto, ~1 día)

- Eliminar `(tabs)/plants/add`. FAB de plants → `scan` directo.
- Hacer scan screen la "Agrega una planta" con copy correcto.
- Agregar botón "Crear manualmente" en scan.
- Links legales en auth + profile.

### Sprint B · "PlantTile + status" (chico, ~1 día)

- `getPlantWaterStatus()` → port a TS en `src/domain/`.
- PlantTile usa imagePreview si existe, sino emoji.
- Status text dinámico.
- Iconos SVG de status (port desde `/resources/Riegos/`).

### Sprint C · "Plant metadata + Haiku" (medio, ~2 días)

- `src/lib/plant-metadata.ts` (port de `lib/plant-metadata.js`).
- Enrich `fetchUserGarden` para hacer join con `plant_metadata`.
- Componentes: `PlantMetadataCard` (luz/riego/origen) + `PlantFunFactCard`.
- Auto-fetch lazy desde detail.

### Sprint D · "Plant detail rediseño con tabs" (grande, ~3 días)

- Tabs component (Riegos / Detalles / Evolución).
- Refactor screen a in-place editing + botón "Guardar".
- Eliminar `[id]/edit.tsx` (ya no hace falta).
- Frecuencia como SelectField con presets `[1,2,3,5,7,14,30]`.
- Tab "Detalles" con foto principal editable + metadata + fun fact.

### Sprint E · "Galería de fotos (Evolución)" (medio, ~2 días)

- Port `lib/supabase-data.js` photo functions a `src/lib/supabase/photos.ts`.
- Tab "Evolución" con grid + add button.
- Upload modal con BottomSheet + file picker + nota.
- Lightbox con delete.
- Estados loading / error / empty.

### Sprint F · "Crear con identificación + scan polish" (medio, ~1.5 días)

- Match cards visuales (con foto de referencia + badge confidence).
- Pantalla `plantCreate` diferenciada (identified vs manual).
- Upload de imagen del scan al guardar.

### Sprint G · "Spaces + profile parity" (chico, ~1 día)

- SpaceCard: icono a derecha, copies alineados.
- Edit screen único.
- Avatar Google + nombre.
- Push toggle.
- Pantalla "Plantas con sed".

### Sprint H · "Copies, microUX, polish" (chico, ~1 día)

- Pasada de copies en bloque.
- Toasts con emojis.
- Splash text.
- Empty states alineados.

### Sprint I · "Google Sign-In" (riesgo alto, separado)

Su propio sprint porque históricamente es fastidioso en iOS.

**Total estimado**: ~13-15 días de trabajo de Claude + tu revisión por sprint. Si tu lista agrega cosas, sumar.

## Próximo paso

Pegame tu lista de cosas que ves como usuario (formato libre, no hace falta que respete mi schema). Yo las merge con esto, ajusto severidades, y tenemos un único backlog priorizado.
