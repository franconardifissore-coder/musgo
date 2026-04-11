# Musgo · Contrato de Navegación Objetivo

## Objetivo

Este documento fija el contrato de navegación para la migración desde la SPA actual basada en `state.currentView` hacia una SPA con rutas separadas, `History API` y rewrites en Vercel.

Su propósito es servir como base de implementación para las siguientes fases sin cambiar todavía el comportamiento funcional de la app.

## Principios de migración

- Mantener el comportamiento actual mientras se introduce routing real.
- Evitar una migración doble: el objetivo es ir directamente a `History API`, sin fase temporal de hash routing.
- Centralizar toda navegación en una única función antes de mover pantallas.
- Mantener `state.currentView` como compatibilidad transitoria durante la migración.
- Priorizar diffs pequeños y revisables.

## Rutas objetivo

### Públicas

- `/` -> landing
- `/login` -> login

### Autenticadas principales

- `/dashboard` -> dashboard
- `/plants` -> plants
- `/scanner` -> scan
- `/spaces` -> spaces
- `/profile` -> profile

### Autenticadas secundarias

Estas rutas no tienen por qué implementarse todas en la primera pasada, pero forman parte del contrato objetivo:

- `/dashboard/thirsty` -> thirstyPlants
- `/plants/new` -> plantCreate
- `/plants/:plantId` -> plantDetail
- `/spaces/new` -> editSpace en modo creación
- `/spaces/:spaceId/edit` -> editSpace en modo edición

## Relación entre rutas y vistas actuales

Durante la migración, `state.currentView` seguirá existiendo como capa de compatibilidad.

Mapa principal previsto:

- `landing` <-> `/`
- `auth` <-> `/login`
- `dashboard` <-> `/dashboard`
- `plants` <-> `/plants`
- `scan` <-> `/scanner`
- `spaces` <-> `/spaces`
- `profile` <-> `/profile`
- `thirstyPlants` <-> `/dashboard/thirsty`
- `plantCreate` <-> `/plants/new`
- `plantDetail` <-> `/plants/:plantId`
- `editSpace` <-> `/spaces/new` o `/spaces/:spaceId/edit`

Notas:

- `landing` no existe hoy como `currentView`; actualmente se deriva de auth más `state.currentView !== 'auth'`.
- `auth` corresponde a la pantalla de login/registro actual.
- `scan` seguirá llamándose internamente `scan` durante la migración, aunque la ruta pública será `/scanner`.

## Fuente de verdad de navegación

La implementación objetivo tendrá una única entrada para navegar:

- recibe un destino semántico o una ruta
- resuelve la ruta final
- actualiza `history.pushState()` o `history.replaceState()`
- sincroniza `state.currentView`
- actualiza `previousMainView` cuando aplique
- ejecuta efectos de navegación existentes:
  - cerrar menú
  - resetear estado de scanner cuando corresponda
  - hacer scroll al top
  - disparar `render()`

Mientras la migración no termine, ninguna otra parte del código debería mutar `state.currentView` directamente para navegación normal.

## Reglas de acceso

### Rutas públicas

- `/` siempre renderiza landing.
- `/login` siempre renderiza login si no hay sesión.
- Si hay sesión activa y el usuario entra en `/login`, la app debe redirigir a `/dashboard`.

### Rutas autenticadas

- `/dashboard`, `/plants`, `/scanner`, `/spaces` y `/profile` requieren sesión.
- Si no hay sesión y el usuario entra en una ruta autenticada, la app debe redirigir a `/login`.
- La redirección debe ocurrir una vez que el estado de auth esté resuelto, para evitar flicker o decisiones prematuras durante `initAuth()`.

## Reglas de compatibilidad transitoria

- `state.currentView` seguirá usándose para no romper los renderizadores actuales.
- Los renderizadores existentes podrán seguir preguntando por `state.currentView` hasta extraer pantallas.
- La conversión `route -> currentView` y `currentView -> route` debe vivir en un único sitio.
- `setView()` podrá sobrevivir temporalmente solo como wrapper de la nueva función de navegación, pero dejará de ser la fuente de verdad.

## App Shell objetivo

La estructura final deseada separa claramente:

- layout público:
  - landing
  - login
- layout autenticado:
  - topbar
  - navegación principal
  - contenido principal por ruta

Las rutas autenticadas principales deben renderizarse dentro de un `App Shell` común.

## Impacto esperado en Vercel

Para soportar `History API`, Vercel debe responder `index.html` para las rutas SPA, preservando las páginas legales:

- `/privacidad`
- `/terminos-y-condiciones`

El rewrite SPA debe añadirse sin romper assets ni documentos estáticos ya publicados.

## Criterio de done de Fase 0

- Existe un contrato escrito y explícito de rutas objetivo.
- Está definida la relación entre rutas y `currentView`.
- Está definida la política de acceso público/autenticado.
- Está definida la decisión de ir con `History API` directamente.
- No hay cambios funcionales en la app.
