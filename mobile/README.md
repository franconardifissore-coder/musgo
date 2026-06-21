# Musgo Mobile

App Expo + TypeScript que consume el backend Supabase actual.

Este README es el **handoff de la sesión de bootstrap automática** del 25 de mayo de 2026. Léelo entero antes de hacer `npm install` la primera vez.

## Estado actual

Lo que está hecho y verificado:

### Infraestructura

- Estructura `/mobile` plana (sin monorepo, decisión en `/docs/expo-store-migration-plan.md`).
- Expo 51 + Expo Router + TypeScript estricto (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- `app.json` + `app.config.ts` con bundle ID `com.musgo.app`.
- `.env` ya creado con las credenciales públicas de Supabase del proyecto existente.
- Storage híbrido SecureStore + AsyncStorage para tokens (`src/lib/supabase/client.ts`).
- Store global liviano con `useSyncExternalStore` (`src/lib/garden-store.ts`).

### Dominio (TypeScript)

- `src/domain/types.ts` con `Plant`, `Section`, `PlantMetadata`, etc.
- `src/domain/watering.ts` — 14 tests pasando.
- `src/domain/calendar.ts` — 11 tests pasando.

### Auth

- Email/password sign-in + sign-up.
- `AuthProvider` con load/clear automático del garden + registro de Expo push token al loguear.
- Redirect automático entre `(auth)` y `(tabs)` según sesión.

### CRUD de plantas

- Listado con botón regar rápido (toggle hoy, optimistic update).
- Detalle con calendario mensual interactivo (tap en día pasado/hoy → toggle riego).
- Crear planta manual (form reutilizable con emoji picker + sección picker).
- Editar planta.
- Eliminar planta con confirmación.
- Componente `PlantCalendar` y `PlantForm` reutilizables.

### CRUD de espacios (sections)

- Listado con plantas por espacio + contador de sed.
- Detalle con lista de plantas de la sección + botón "Regar todas hoy".
- Crear, editar, eliminar. Al eliminar, las plantas quedan sin sección (no se borran).

### Scanner

- Pantalla con cámara y galería.
- Compresión con `expo-image-manipulator` (max 1600px JPEG 0.86).
- Upload a edge function `identify-plant` existente.
- Resultados con confidence + tap → crea planta prellenada.

### Push notifications

- Migration `20260525000000_expo_push_subscriptions.sql` con:
  - Tabla nueva `expo_push_subscriptions`.
  - Columna `disabled_at` en `push_subscriptions` legacy.
- Registro de Expo push token al loguear, deshabilita VAPID web del usuario para evitar duplicados.
- Edge function `send-watering-reminders` reescrita para enviar a VAPID activos + Expo Push API en paralelo, con limpieza de tokens inválidos.

### Account deletion (requisito Apple)

- Edge function `delete-account` que valida JWT y borra el usuario con admin API (cascade hace el resto).
- Pantalla en perfil con confirmación tipeando el email.

### Verificado

- `tsc --noEmit` limpio en `src/` + `app/`.
- 25/25 tests del dominio pasan.

## Lo que NO está hecho (tareas pendientes para ti)

### 1. Aplicar la nueva migration de push subscriptions

Hay una migration nueva en `/supabase/migrations/20260525000000_expo_push_subscriptions.sql`. Aplicala al proyecto Supabase:

```bash
cd ..   # raíz del repo
npx supabase db push
# o pegando el SQL en el dashboard de Supabase
```

Sin esto, el registro del Expo push token falla la primera vez que loguees en mobile.

### 2. Desplegar las edge functions actualizadas

- `send-watering-reminders`: reescrita para enviar a VAPID activos + Expo Push API en paralelo, con limpieza de tokens inválidos.
- `delete-account`: nueva, requisito de Apple App Review.

```bash
npx supabase functions deploy send-watering-reminders
npx supabase functions deploy delete-account
```

### 3. Assets de icono y splash

Pendiente que los hagas en Figma. Specs detalladas (paths, dimensiones, safe zones, paleta) en `mobile/assets/README.md`.

### 4. Tipos autogenerados de Supabase (opcional)

```bash
npm run gen:supabase-types
```

Una vez generado, podés refactorizar `src/domain/types.ts` para derivar `Plant`/`Section` de allí en vez de mantenerlos a mano.

### 5. Probar push en device real

Push notifications NO funcionan en simulador iOS ni en Android emulator sin Google Play Services. Para validar end-to-end:

- Build de desarrollo con EAS: `npx eas build --profile development --platform ios`
- Instalar en device real.
- Disparar `send-watering-reminders` manualmente desde el dashboard de Supabase Edge Functions.

### 6. Instalar dependencias y primer arranque

```bash
cd mobile
npm install
# Si tenés Xcode (iOS):
npm run ios
# Si tenés Android Studio + emulador:
npm run android
# O para probar rápido con Expo Go:
npm start
```

> **Nota**: el primer `npm install` baja ~600MB. En el sandbox de la sesión se hizo timeout, por eso no quedó hecho. En tu máquina debería andar en 1-2 min.

## Comandos útiles

```bash
npm run typecheck    # tsc --noEmit
npm test             # vitest run (corre los tests del dominio)
npm run test:watch   # vitest en watch mode
npm start            # expo dev server
npm run ios          # build + run en simulador iOS (requiere Xcode)
npm run android      # build + run en emulador Android (requiere Android Studio)
```

## Decisiones tomadas durante el bootstrap (vale la pena que las conozcas)

### `image-processing.js` NO se portó

El archivo original depende de APIs de browser (`File`, `FileReader`, `HTMLImageElement`, `canvas`). En mobile la equivalencia es `expo-image-manipulator`, que tiene una API distinta. Vale la pena reescribirlo (no portarlo) cuando se llegue a la pantalla del scanner (Fase 5 del plan). El paquete `expo-image-manipulator` ya está declarado en `package.json`.

### Lógica de toggle de riego separada del calendar

`lib/domain/calendar.js` mezclaba dominio puro con mutaciones de estado y llamadas a `syncPlantToCloud`. Porté solo lo puro (`getCalendarMonthData`, `toggleWaterLogDate`). La mutación y el sync van a vivir en `src/lib/actions/` cuando se cree la pantalla de detalle de planta.

### Funciones de dominio ahora reciben `plants` como argumento

La versión web leía `state.plants` desde un getter global. La versión TS recibe el array como parámetro. Esto las hace puras, testeables y reutilizables desde cualquier capa (RN, scripts de test, futuras edge functions).

### Storage de auth: SecureStore con fallback a AsyncStorage

SecureStore tiene un límite de ~2KB por valor en iOS. Los JWT de Supabase normalmente caben, pero si llegan a no caber el cliente cae automáticamente a AsyncStorage. Ver `src/lib/supabase/client.ts`.

### Theme provisorio en `src/theme/colors.ts`

Hardcodeé una paleta basada en el verde-musgo de la web (#0b1f17). No es un design system todavía — solo tokens. Diseño mobile real es trabajo posterior.

### Sin Google Sign-In en este scaffold

Email/password funciona. Google Sign-In es notoriamente fastidioso en iOS (provisioning, URL schemes, pantalla de consentimiento) y el plan lo dejó para la Fase 4. Mejor sumar usuarios con email primero y agregar Google después.

### Sin tests de UI todavía

Solo tests de dominio. Tests de componentes RN requieren `@testing-library/react-native` + setup de jest/vitest distinto. Vale la pena agregarlo cuando haya 2-3 componentes estables.

## Próxima sesión: por dónde seguir

Orden sugerido para la próxima vez que abramos el proyecto:

1. **Validación end-to-end del bootstrap**: `npm install`, correr el simulador iOS, loguearte con tu cuenta real, verificar que el dashboard carga tus plantas (smoke test de continuidad de datos del plan).
2. **CRUD completo de plantas**: detalle de planta + edit + crear manual + regar (botón rápido en el dashboard).
3. **Espacios (sections)**: listado + crear + regar espacio.
4. **Scanner**: integración con `expo-image-picker` + `expo-image-manipulator` + la edge function `identify-plant` que ya existe.
5. **Push** + **account deletion** + **Google Sign-In**.

Ver `/docs/expo-store-migration-plan.md` para el plan completo y el timing realista por fases.
