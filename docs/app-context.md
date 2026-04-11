# Musgo · App Context

## Resumen operativo

- La aplicación es una SPA servida desde [`index.html`](/Users/franconardi/Documents/GitHub/musgo/index.html).
- El frontend está implementado en JavaScript vanilla con estado global en memoria.
- La persistencia funcional actual depende de Supabase:
  - autenticación en [`lib/supabase-auth.js`](/Users/franconardi/Documents/GitHub/musgo/lib/supabase-auth.js)
  - lectura/escritura de datos en [`lib/supabase-data.js`](/Users/franconardi/Documents/GitHub/musgo/lib/supabase-data.js)
  - identificación de plantas vía edge function en [`supabase/functions/identify-plant/index.ts`](/Users/franconardi/Documents/GitHub/musgo/supabase/functions/identify-plant/index.ts)
- No hay persistencia local activa: `saveState()` no guarda nada y `loadState()` reinicia `sections` y `plants` vacíos.

## Entidades reales del sistema

### `sections`

Fuente de verdad: migración y mapeo en cliente.

Campos implementados:

- `id: text`
- `user_id: uuid`
- `name: text`
- `icon: text`
- `outdoor: boolean`
- `created_at: timestamptz`
- `updated_at: timestamptz`

Uso funcional:

- representa espacios donde agrupar plantas
- se muestra en filtros de plantas
- se muestra en la vista de espacios
- puede editarse, crearse y eliminarse
- se usa para regar todas las plantas asignadas a ese espacio

### `plants`

Campos implementados:

- `id: text`
- `user_id: uuid`
- `name: text`
- `species: text | null`
- `emoji: text`
- `section_id` en BD, mapeado a `section` en frontend
- `freq: integer`
- `light: text`
- `water_log: jsonb`, mapeado a `waterLog`
- `image_preview: text | null`, mapeado a `imagePreview`
- `identified_species: text | null`, mapeado a `identifiedSpecies`
- `identification_confidence: numeric | null`, mapeado a `identificationConfidence`
- `identified_at: timestamptz | null`, mapeado a `identifiedAt`
- `created_at: timestamptz`
- `updated_at: timestamptz`

Uso funcional:

- representa una planta individual de la colección del usuario
- se puede crear manualmente o desde identificación por imagen
- se puede editar en detalle
- se puede regar individualmente
- se puede eliminar
- participa en dashboard, lista de plantas, detalle, calendario y perfil

### `auth`

Estado de sesión en frontend:

- `ready`
- `configured`
- `session`
- `user`
- `error`

Proveedor implementado:

- email/password
- Google OAuth

### `cloud`

Estado de sincronización en frontend:

- `loading`
- `syncedUserId`
- `error`

### `identification`

Estado temporal para identificación por imagen:

- `file`
- `preview`
- `bestMatch`
- `results`
- `selectedIndex`
- `loading`
- `error`
- `emptyMessage`
- `remainingRequests`

## Navegación actual

### Rutas HTTP reales

- `/` -> SPA principal
- `/privacidad` -> `docs/privacy_policy/index.html`
- `/terminos-y-condiciones` -> `docs/terms_and_conditions/index.html`

Configurado en [`vercel.json`](/Users/franconardi/Documents/GitHub/musgo/vercel.json).

### Vistas SPA reales

Vistas principales:

- `dashboard`
- `plants`
- `scan`
- `spaces`
- `profile`

Vistas secundarias:

- `auth`
- `thirstyPlants`
- `plantCreate`
- `plantDetail`
- `editSpace`

### Reglas de acceso por navegación

- Si Supabase Auth está configurado y no hay usuario autenticado:
  - cualquier vista distinta de `auth` renderiza landing pública
  - `auth` renderiza pantalla de acceso
- Si hay usuario autenticado:
  - se cargan `sections` y `plants` desde Supabase
- Si el usuario cierra sesión:
  - se vacían `sections` y `plants`
  - la app vuelve a `dashboard`

### Menú actual

Elementos de menú implementados:

- Inicio
- Plantas
- Escanner
- Espacios
- Perfil

Comportamiento:

- en mobile es drawer
- en desktop ancho `>= 1100px` se convierte en sidebar fijo para vistas principales

## Funcionalidades implementadas

### Splash y experiencia pública

- splash inicial temporal usando `sessionStorage` con clave `musgo:splash-seen`
- landing pública con CTA a acceso
- enlaces a privacidad y términos

### Autenticación

- login con Google
- login con email/password
- registro con email/password
- validación mínima de contraseña: 6 caracteres
- cierre de sesión

### Gestión de plantas

- listado de plantas con filtro por espacio
- creación manual de planta
- creación de planta desde foto identificada
- edición de nombre, frecuencia de riego y espacio
- eliminación con confirmación modal
- riego individual
- visualización de estado de riego por tarjeta

### Gestión de espacios

- listado de espacios
- creación de espacio
- edición de nombre e icono
- riego masivo de todas las plantas de un espacio
- eliminación con confirmación modal
- recuento de plantas por espacio

### Dashboard

- contador de plantas que necesitan riego hoy
- acceso a vista `thirstyPlants`
- proyección de riegos para 5 días
- barras separando plantas "regadas" y "necesitan riego"

### Identificación de plantas

- selección de imagen desde input file con `accept="image/*"` y `capture="environment"`
- generación de preview comprimido en base64/jpeg
- llamada al endpoint `https://hbojzifhocxygdojzqjn.supabase.co/functions/v1/identify-plant`
- apertura automática del flujo de creación usando el primer resultado útil

### Calendario de riego

- calendario inline en detalle de planta
- calendario modal también implementado
- navegación por mes
- marcado manual de riegos por día
- bloqueo de edición en fechas futuras
- visualización de riegos reales y riegos proyectados

### Perfil

- avatar desde `user_metadata.avatar_url` o inicial del usuario
- nombre desde `user_metadata.full_name` o `user_metadata.name`
- email del usuario
- contador de plantas
- contador de espacios
- botón de cerrar sesión

## Reglas de negocio detectadas en el código

### Riego

- Una planta necesita riego si:
  - no tiene registros en `waterLog`
  - o los días transcurridos desde el último riego son `>= freq`
- `lastWatered` toma la fecha más reciente de `waterLog`
- `waterPlant()` solo agrega la fecha de hoy si aún no existe
- `waterSection()` riega todas las plantas asignadas a un espacio, evitando duplicar la fecha de hoy
- En calendario se puede agregar o quitar un riego pasado o de hoy
- En calendario no se puede registrar ni quitar riegos futuros

### Estado visual de riego en tarjetas

- sin historial -> `Sin riegos registrados`
- si `daysSinceLastWater > freq` -> atraso
- si `daysUntilNext <= 0` -> `Regar hoy`
- si `daysUntilNext === 1` -> `Regar mañana`
- en otro caso -> `Regar en N días`

### Frecuencia de riego

Valores ofrecidos en formularios:

- `1`
- `2`
- `3`
- `5`
- `7`
- `14`
- `30`

Fallbacks implementados:

- planta nueva o editada sin frecuencia válida -> `3`
- esquema BD default -> `3`

### Creación y edición de plantas

- nombre final de guardado:
  - `draft.name.trim()`
  - si no existe, `draft.species.trim()`
  - si no existe, `Planta sin nombre`
- en creación manual:
  - `species` se guarda vacío
  - `emoji` se fuerza a `🪴`
- en creación desde identificación:
  - `species` se toma del draft identificado
  - `emoji` usa el draft o fallback `🌿`
- `waterLog` siempre se normaliza a array

### Identificación por AI

- la edge function envía la imagen a PlantNet con `organs=leaf`
- la función devuelve como máximo 3 resultados
- el frontend solo considera resultados con `confidence >= 15`
- si no hay resultados útiles:
  - no crea borrador de planta
  - muestra mensaje para reintentar o crear manualmente
- si hay resultados útiles:
  - usa solo el primer resultado útil para abrir el formulario
- `identificationConfidence` se guarda en frontend como valor decimal `0..1`
- en UI el porcentaje se muestra convertido a `%`

### Imágenes

- las previews se almacenan como data URL
- al preparar preview se intenta comprimir a JPEG
- dimensión máxima objetivo: `1280px`
- longitud máxima objetivo del string: `900000`

### Espacios

- el nombre del espacio es obligatorio para crear o editar
- el icono por defecto es `🪴`
- `outdoor` se deriva automáticamente del nombre si contiene alguna de estas palabras:
  - `balcón`
  - `terraza`
  - `jardín`
  - `exterior`
  - `patio`
- al eliminar un espacio:
  - las plantas afectadas quedan sin asignar en frontend (`section = ''`)
  - en cloud se ejecuta `clearPlantSection(sectionId)` antes de borrar la sección

### Sincronización cloud

- `fetchUserGarden()` carga `sections` y `plants` en paralelo
- antes de guardar una planta se sincroniza también su sección, si existe
- los errores de sincronización muestran toast pero no revierten el cambio local ya aplicado en memoria
- no existe reconciliación posterior automática tras un fallo local de sincronización

### Seguridad de datos

RLS implementado en Supabase:

- cada usuario solo puede leer, insertar, actualizar y borrar sus propias `sections`
- cada usuario solo puede leer, insertar, actualizar y borrar sus propias `plants`

## Integraciones externas reales

- Supabase Auth
- Supabase Postgres
- Supabase Edge Function `identify-plant`
- PlantNet API

## Limitaciones observables del estado actual

- la persistencia local está desactivada
- `light` existe en base de datos y en el mapeo, pero no se expone en formularios ni vistas principales
- `outdoor` se calcula y persiste para espacios, pero no modifica la UI actual
- existe modal de calendario, pero la navegación principal usa calendario inline en detalle de planta
