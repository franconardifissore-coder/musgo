# Postmortem — `Exception in HostFunction` al importar `@gorhom/bottom-sheet`

**Fecha:** 2026-06-06
**Componente:** `mobile/src/components/ui/BottomSheet.tsx`
**Severidad:** bloqueante (la app crasheaba al arrancar; el sign-in no cargaba)
**Estado:** resuelto

---

## Resumen

La app reventaba en el arranque con:

```
Uncaught Error
Exception in HostFunction: <unknown>
  BottomSheet.tsx:16   → import { BottomSheetBackdrop, BottomSheetModal, ... } from '@gorhom/bottom-sheet'
  index.ts:4
  sign-in.tsx:12
```

No era un bug de nuestro código. El error se lanzaba en la **línea del import** (evaluación del módulo), antes de renderizar nada.

## Causa raíz

`@gorhom/bottom-sheet` importa **Reanimated**, que es un módulo **nativo**. En **Expo Go** el lado nativo está congelado a las versiones que Expo compila dentro de la app del store; no se puede modificar. Nuestras versiones JS (`react-native-worklets@0.8.3`, `react-native-reanimated@4.1.7`) no coincidían con el binario nativo de Expo Go SDK 54.

Cuando Reanimated intenta instalar sus *host functions* nativas y la versión nativa no coincide con la JS → `Exception in HostFunction: <unknown>`.

**Regla mental:** una excepción en un *HostFunction* al **cargar** un módulo = mismatch entre el JS y el binario nativo. No es provider faltante ni mal uso del componente (eso fallaría al renderizar, no al importar).

## Qué lo resolvió

Alinear las dependencias a las versiones que espera el SDK y limpiar la cache de Metro:

```bash
cd mobile
npx expo install --check     # corrige versiones que no cuadran con el SDK 54
npx expo start -c            # arranca limpiando la cache de Metro
```

## Cómo evitar que se repita

### 1. Antes de añadir cualquier librería con nativo, alinear versiones
Para deps con código nativo (Reanimated, gesture-handler, bottom-sheet, camera, etc.) **nunca** uses `npm install <pkg>` a secas. Usa:

```bash
npx expo install <pkg>
```

`expo install` instala la versión compatible con tu SDK en vez de la `latest`. La mitad de estos crashes vienen de un `npm install` que trajo una versión por delante del SDK.

### 2. Tras tocar dependencias nativas, valida y limpia cache
```bash
npx expo install --check     # ¿algo desalineado con el SDK?
npx expo-doctor              # chequeo de salud general del proyecto
npx expo start -c            # cache limpia
```

### 3. Saber cuándo Expo Go ya no alcanza
Expo Go sirve para prototipar, pero su lado nativo es fijo. En cuanto dependes de librerías con nativo "pesado" (Reanimated 4 + gorhom 5 es el caso típico), Expo Go empieza a dar mismatches. La solución estable es un **dev build** (tu propia copia de Expo Go compilada con tus deps exactas):

```bash
npm install -g eas-cli
eas login
npx expo install expo-dev-client
eas build --profile development --platform ios   # compila en la nube, sin Xcode
# luego:
npx expo start --dev-client
```

Misma experiencia (QR + hot reload), pero el nativo lo controlas tú. Recomendado migrar a esto antes de seguir sumando librerías nativas.

### 4. Diagnóstico rápido para la próxima vez
Si vuelve a aparecer un `Exception in HostFunction` o un crash al importar una lib con nativo:

1. ¿Estoy en Expo Go o dev build? (Expo Go = sospecha mismatch nativo de entrada.)
2. `npx expo install --check` → ¿versiones desalineadas?
3. `npx expo start -c` → descartar cache sucia.
4. Para aislar: comenta el import sospechoso y mockea el componente. Si arranca, es nativo, no tu árbol de React.

## Señales que descartamos (y por qué no eran)
- **Provider faltante** (`BottomSheetModalProvider` / `GestureHandlerRootView`): estaban correctamente montados en `app/_layout.tsx`. Además, un provider faltante falla al **renderizar**, no al importar.
- **Plugin de babel:** `react-native-worklets/plugin` estaba presente y último en `babel.config.js` (correcto para Reanimated 4).
- **New Architecture:** SDK 54 la trae activada por defecto y no la habíamos desactivado.

## Acción pendiente recomendada
Migrar de Expo Go a **dev build (EAS)** para el desarrollo del día a día. Evita esta clase de mismatch de forma estructural.
