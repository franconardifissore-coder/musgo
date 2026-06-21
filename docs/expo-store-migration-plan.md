# Musgo · Plan de migracion a Expo y lanzamiento en stores

## Objetivo

Llevar Musgo desde la app web actual a una app mobile publicable en:

- Apple App Store
- Google Play Store

La recomendacion para este proyecto es ir directo a Expo / React Native, no pasar por Capacitor salvo que aparezca una necesidad urgente de lanzar una version wrapper muy rapida.

Este documento esta pensado para:

- dar contexto a AI agents
- ordenar el roadmap
- evitar rehacer trabajo
- cubrir tambien la burocracia de stores para alguien que empieza desde cero

## Decision estrategica

### Recomendacion

Ir directo a Expo.

### Por que

- Musgo ya tiene backend y reglas de negocio claras, asi que el cuello de botella no es producto sino capa app.
- Capacitor permitiria salir antes, pero mucho de lo que habria que resolver bien para mobile se volveria a hacer en Expo:
  - autenticacion Google
  - notificaciones push
  - camara y picker
  - navegacion
  - UX mobile
- Expo permite llegar a stores con una arquitectura mas limpia y mas durable.

### Cuando tendria sentido Capacitor

Solo si el objetivo cambiara a:

- salir a stores en el menor tiempo posible
- aceptar UX web encapsulada
- usarlo como experimento temporal

No es el camino recomendado para la version principal.

## Decisiones tomadas (sesion 2026-05-25)

Esta seccion sobrescribe partes del plan original. Donde haya contradiccion entre esta seccion y el resto del documento, esta seccion gana.

### Estrategia web vs mobile

- La web actual queda como esta hoy, funcionando, sin trabajo de features.
- Se construye la app nativa en paralelo (no se mantiene dual-maintenance porque la web no evoluciona).
- El dia que la app este publicada en stores se hace sunset de la web.
- En el futuro la web podria reabrirse, pero la experiencia principal seria la app. Esta posibilidad NO debe influenciar las decisiones de arquitectura de hoy. YAGNI.

### Mantenimiento de la web durante la transicion

- Solo parches criticos de seguridad o auth. Nada de features ni mejoras.
- Si algo no critico se rompe, banner o aceptarlo hasta el sunset.
- Sin uptime monitoring formal: el volumen actual de usuarios no lo justifica.

### Tamano de usuarios actual (clave para todo lo demas)

Hoy hay 2-3 usuarios reales ademas de la owner del producto, todos conocidos personales. Esto define la escala de las decisiones de transicion:

- No hay infraestructura de comunicacion a usuarios: un mensaje de WhatsApp a 3 personas resuelve el aviso de migracion.
- No hay sunset escalonado (ventanas 30/60/90 dias, banners de migracion progresiva).
- No hay doc de "politica de transicion" formal.
- Si en la migracion se pierde alguno de esos 2-3 usuarios, es perdida aceptable y asumida explicitamente.

### Sunset de la web (mecanica)

El dia del lanzamiento de la app:

- Opcion A: dejar la web viva sin tocarla. Si en algun momento se rompe, no hay drama porque ya esta migrado.
- Opcion B (recomendada por limpieza): reemplazar `index.html` por una pantalla estatica tipo "Musgo ahora vive en la app" con links a App Store y Google Play. 5 minutos de trabajo.

No se requiere trigger por metrica ni proceso escalonado.

### Continuidad de datos

Se valida una sola vez por la owner: loguearse en la app con la cuenta real propia y verificar que aparecen las plantas. Como es el mismo backend Supabase, deberia funcionar trivialmente. Es el primer smoke test cuando haya auth en mobile.

### Implicancias en arquitectura mobile

Estas decisiones simplifican varias cosas que el plan original dejaba abiertas:

- **Sin monorepo**: no se usa pnpm workspaces ni Turbo. La app Expo vive en `/mobile` dentro del repo actual, plano.
- **Sin paquete `packages/domain` compartido**: la logica de `lib/domain/*.js` se porta a TypeScript dentro de `/mobile/src/domain/*.ts`. Se acepta la duplicacion con la web porque la web no va a cambiar; nunca diverge.
- **Tipos de Supabase autogenerados**: usar `supabase gen types typescript` para tener `Plant`, `Section`, `WaterLog`, etc. consistentes con la DB sin esfuerzo manual.
- **Push durante la ventana de coexistencia**: al registrar el Expo push token de un usuario, marcar sus suscripciones VAPID web como inactivas. Implementacion: columna `disabled_at` en la tabla `push_subscriptions`.

### Cosas que NO cambian por el volumen de usuarios

Estos requisitos siguen aplicando aunque haya solo 3 usuarios reales:

- Portar el dominio de JS a TypeScript.
- **Account deletion como requisito duro de v1**: Apple lo exige por regla de App Review, no por volumen de usuarios.
- Arrancar ya las cuentas de Apple Developer Program y Google Play Console (la burocracia tarda lo mismo).
- Google Sign-In y push siguen siendo los riesgos tecnicos reales del proyecto.

### Cosas descartadas explicitamente

Para evitar overengineering para 3 usuarios:

- Doc de "politica de transicion web → mobile".
- Infraestructura formal de comunicacion a usuarios.
- Sunset escalonado por fases.
- Uptime monitoring de la web post-sunset.
- React Native Web "por si acaso" para reabrir la web mas adelante.

## Contexto actual del repo

Musgo hoy es:

- una SPA web en `index.html`
- frontend en JavaScript vanilla
- estado global en memoria
- backend en Supabase
- router web custom
- push web con service worker y VAPID

### Activos reutilizables

- modelo de datos
- reglas de negocio de riego
- estructura funcional del producto
- Supabase Auth
- tablas y migraciones
- edge functions
- assets visuales reutilizables
- documentos legales base

### Activos a reescribir o adaptar

- UI completa
- navegacion
- auth social mobile
- push notifications
- flujo de camara / galeria
- storage local
- configuracion mobile nativa

## Objetivo tecnico

Construir una nueva app mobile con Expo que consuma el backend actual de Supabase y preserve las funcionalidades principales de Musgo.

## Arquitectura objetivo

### Stack recomendado

- Expo
- React Native
- TypeScript
- Expo Router
- Supabase JS
- Zustand o un store simple
- React Query o equivalentemente una capa de fetch/cache simple
- Expo Secure Store para tokens sensibles
- AsyncStorage para estado no sensible
- Expo Notifications para push
- Expo Image Picker y/o Expo Camera
- EAS Build
- EAS Submit

### Estructura sugerida

Decision tomada: NO monorepo. La app Expo vive en `/mobile` dentro del repo actual, plano. Ver "Decisiones tomadas" para el racional.

- `/` (repo actual, web congelada)
  - `index.html`, `lib/`, `supabase/`, etc. → se mantienen como estan
- `/mobile` (app Expo nueva)
  - `app/` → rutas de Expo Router
  - `src/screens/`
  - `src/components/`
  - `src/theme/`
  - `src/lib/supabase/`
  - `src/domain/` → port TS de `lib/domain/*.js` (duplicacion aceptada, ver Decisiones tomadas)
  - `src/lib/notifications/`
  - `src/lib/storage/`
  - `src/hooks/`
- `/supabase` (backend actual, sin cambios estructurales)

### Principio importante

Separar dentro de `/mobile` desde el comienzo:

- logica de negocio pura (en `src/domain/`)
- adaptadores de infraestructura (en `src/lib/`)
- UI (en `src/screens/` y `src/components/`)

Todo lo que sea calculo de riego, agenda, estados de planta y transformaciones de datos deberia vivir en modulos puros para que los AI agents puedan trabajar sin romper la interfaz.

## Roadmap general

## Fase 0 · Preparacion

Objetivo: dejar el terreno listo antes de construir mobile.

### Entregables

- decision formal de ir con Expo
- branch de trabajo para mobile
- documento de arquitectura
- inventario funcional de Musgo web vs Musgo mobile v1

### Tareas

- crear nueva app Expo dentro del repo o en workspace separado
- definir TypeScript desde el dia 1
- elegir estrategia de estado
- elegir estrategia de data fetching
- listar funcionalidades obligatorias para v1
- listar funcionalidades que pueden quedar para v1.1

### Alcance recomendado para mobile v1

- onboarding / auth
- dashboard
- listado de plantas
- detalle de planta
- crear planta manual
- crear planta desde foto
- espacios
- perfil
- notificaciones de riego

### Postergar si hace falta

- calendarios muy refinados
- animaciones complejas
- offline completo
- experiencias publicas tipo landing

## Fase 1 · Portar dominio a TypeScript dentro de /mobile

Objetivo: tener la logica de negocio existente disponible en la app Expo, en TS y tipada contra Supabase.

### Estado actual

El repo ya tiene `lib/domain/` con:

- `watering.js` (calculo de cuando una planta necesita riego, dias desde ultimo riego, proximo riego)
- `calendar.js` (resumen por dia, calendario proyectado)
- `image-processing.js`

Es decir, la fase no es "extraer dominio desde cero" como sugeria la version original del plan. Es portar lo que ya existe.

### Entregables

- `/mobile/src/domain/*.ts` con las funciones equivalentes a `lib/domain/*.js`
- Tipos consistentes para `Plant`, `Section`, `WaterLog`, `UserProfile` generados desde Supabase
- Tests unitarios minimos sobre las reglas portadas

### Tareas

- Generar tipos de Supabase: `supabase gen types typescript --project-id <id> > mobile/src/lib/supabase/types.gen.ts`
- Portar `watering.js` a `watering.ts` como primer ejercicio de validacion del setup TS
- Portar `calendar.js` a `calendar.ts`
- Portar `image-processing.js` a `image-processing.ts` (puede esperar hasta Fase 5)
- Agregar tests unitarios de las reglas portadas (Vitest o Jest)

### Resultado esperado

La app Expo importa todo el dominio desde `/mobile/src/domain/` en TS. La web seguira usando `lib/domain/*.js` sin tocar. Duplicacion aceptada y documentada en "Decisiones tomadas".

## Fase 2 · Bootstrap de la app Expo

Objetivo: tener una shell mobile ejecutando.

### Entregables

- app Expo corriendo en iOS y Android
- navegacion base
- theming base
- configuracion de entornos

### Tareas

- inicializar Expo app
- configurar `app.config.ts`
- definir bundle identifiers:
  - iOS: `com.tudominio.musgo` o similar
  - Android: `com.tudominio.musgo`
- instalar Expo Router
- crear tabs o stack principal
- definir tokens de color, tipografia y espaciado
- mover assets de icono y splash
- configurar variables de entorno para Supabase

### Decision UX recomendada

No replicar la web pixel por pixel. Mantener el producto, pero rediseñar para patrones mobile.

## Fase 3 · Datos y autenticacion

Objetivo: conectar Expo con Supabase de manera nativa y estable.

### Entregables

- login con email/password
- session persistence
- logout
- carga inicial de datos del usuario

### Tareas

- crear cliente Supabase para React Native
- persistir sesion con Secure Store
- implementar auth guards
- implementar carga de:
  - plants
  - sections
- modelar errores y estados de loading

### Google Sign-In

No tomar como referencia directa el redirect web actual.

Se debera definir una de estas rutas:

- Google auth via navegador del sistema con deep link de vuelta
- Google Sign-In nativo compatible con Supabase

Esto exige configuracion en:

- Google Cloud Console
- Supabase Auth providers
- iOS URL schemes
- Android intent filters

## Fase 4 · Navegacion y pantallas core

Objetivo: reproducir el producto principal.

### Orden recomendado

1. Auth
2. Dashboard
3. Plants list
4. Plant detail
5. Create plant manual
6. Spaces
7. Profile

### Criterio

Primero cubrir las rutas de mayor uso y menor riesgo. La pantalla de scanner se hace despues de que la app ya pueda crear plantas manualmente.

## Fase 5 · Scanner / imagen

Objetivo: soportar alta de planta a partir de foto.

### Entregables

- pedir permisos de camara y fotos
- tomar foto o elegir de galeria
- comprimir imagen si hace falta
- enviar a Supabase function de identificacion
- mostrar matches
- crear planta desde resultado

### Tareas

- integrar `expo-image-picker` y/o `expo-camera`
- unificar formato de imagen
- revisar tamaño maximo y compresion
- manejar errores de red y permisos denegados

### Riesgos

- diferencias de permisos entre iOS y Android
- peso de imagen
- timeouts en edge functions

## Fase 6 · Push notifications

Objetivo: reemplazar Web Push por push nativo.

### Entregables

- registro de device token por usuario
- opt-in de permisos
- envio de notificaciones de riego
- deep link a pantalla relevante

### Cambios conceptuales

La implementacion web actual con service worker y VAPID no sirve como base final en native.

### Tareas

- integrar Expo Notifications
- decidir si usar:
  - Expo Push Service
  - o FCM/APNs directamente
- crear nueva tabla o adaptar almacenamiento de tokens
- guardar:
  - user_id
  - platform
  - expo_push_token o native token
  - device metadata
- adaptar jobs o cron de recordatorios
- definir comportamiento de tap en notificacion

### Recomendacion

Para v1, usar Expo Push Service puede simplificar mucho. Mas adelante se puede migrar si hubiera necesidad.

## Fase 7 · Calidad, observabilidad y estabilidad

Objetivo: que la app sea publicable y mantenible.

### Entregables

- manejo de errores consistente
- analytics basico
- crash reporting
- tests minimos

### Tareas

- integrar Sentry
- registrar eventos clave:
  - sign up
  - login
  - plant created
  - plant watered
  - notification enabled
- agregar tests de dominio
- smoke tests de flujos criticos

### Flujos que deben probarse siempre

- crear cuenta
- login
- crear planta manual
- crear planta desde foto
- editar planta
- regar planta
- regar espacio
- logout
- recibir push

## Fase 8 · Preparacion de stores

Objetivo: dejar todo listo para build y submission.

### Entregables

- cuentas creadas
- metadata preparada
- assets de store listos
- build firmada

## Burocracia de stores

## Apple App Store

### Que necesitas

- Apple ID propio
- inscripcion a Apple Developer Program
- pago anual
- acceso a un dispositivo Apple para pruebas reales
- idealmente Mac para revisar temas nativos si algo falla

### Costos

- Apple Developer Program cobra suscripcion anual

Verificar precio vigente al momento de pagar.

### Pasos

1. Crear o reutilizar Apple ID.
2. Inscribirte en Apple Developer Program.
3. Elegir cuenta individual o empresa.
4. Completar datos legales y fiscales.
5. Esperar aprobacion.
6. Entrar a App Store Connect.
7. Crear la app nueva:
   - nombre
   - primary language
   - bundle ID
   - SKU interno
8. Completar informacion comercial y de privacidad.

### Decisiones importantes

- Individual vs empresa
  - individual es mas rapido
  - empresa da presencia mas profesional pero exige mas validacion legal
- nombre del publisher
  - en individual aparece tu nombre personal
  - en empresa aparece la razon social

## Google Play Store

### Que necesitas

- cuenta Google
- Play Console account
- pago unico de registro
- verificacion de identidad
- datos legales y de contacto

### Costos

- Google Play cobra una sola vez por apertura de cuenta

Verificar precio vigente al momento de pagar.

### Pasos

1. Crear o reutilizar cuenta Google.
2. Registrarte en Google Play Console.
3. Pagar registro.
4. Completar verificacion de identidad.
5. Configurar perfil de developer.
6. Crear app nueva:
   - nombre
   - idioma
   - app o game
   - free o paid

## Activos y formularios que vas a necesitar si o si

### Branding

- icono final de app
- splash / launch assets
- nombre comercial final
- subtitulo o short description

### Legales

- politica de privacidad publicada en URL accesible
- terminos y condiciones si corresponde
- email de soporte
- website de soporte o landing minima

### Screenshots y media

- screenshots iPhone
- screenshots Android
- iconos y assets promocionales
- posiblemente feature graphic para Google Play

### Operativos

- categoria de la app
- clasificacion por edad
- descripcion corta
- descripcion larga
- listado de funcionalidades
- paises de distribucion
- datos de contacto

### Privacidad y data disclosure

Apple y Google te van a pedir declarar que datos recolectas y para que.

Debes mapear al menos:

- email
- identificadores de usuario
- fotos o contenido subido
- identificadores de dispositivo o push token
- analytics si usas
- crash logs si usas

### Review access

Si la app requiere login, conviene preparar:

- cuenta demo
- instrucciones para reviewer
- video o notas si el flujo es poco obvio

## Compliance a revisar para Musgo

### Permisos mobile

- camara
- libreria de fotos
- notificaciones

Cada permiso necesita:

- texto claro al usuario
- descripcion en configuracion iOS
- declaracion consistente en stores

### Contenido generado por usuario

Si los usuarios suben fotos, revisar:

- moderacion si aplica
- politica sobre contenido abusivo
- canal de contacto / reporte

Probablemente para v1 no sea un problema grande, pero conviene definir una postura minima.

### Autenticacion social

Si usas Google Sign-In, debes alinear:

- branding permitido por Google
- client IDs correctos
- pantalla de consentimiento configurada

### Suscripciones o pagos

Si en el futuro agregas pagos in-app, el scope regulatorio y tecnico cambia bastante. Para v1 conviene evitarlo.

## Checklist de App Store metadata

- nombre de app
- subtitulo
- descripcion promocional si aplica
- descripcion completa
- keywords
- categoria primaria
- categoria secundaria si aplica
- URL de privacy policy
- URL de soporte
- marketing URL si tienes
- screenshots requeridos por device class
- app icon
- age rating questionnaire
- App Privacy answers

## Checklist de Google Play metadata

- app name
- short description
- full description
- category
- contact email
- privacy policy URL
- app icon
- feature graphic
- phone/tablet screenshots
- Data safety form
- content rating questionnaire
- target audience questionnaire
- ads declaration

## Build y release con Expo

### Herramientas

- EAS Build
- EAS Submit

### Tareas

- configurar proyecto en Expo
- conectar Apple Developer
- conectar Google Play service account si hiciera falta
- definir profiles:
  - development
  - preview
  - production
- generar builds internas
- distribuir a testers

### Testing previo al release

- TestFlight para iOS
- Internal testing / closed testing en Google Play

### Recomendacion

No mandar la primera build directo a review sin:

- pruebas reales en varios dispositivos
- push probado
- auth probado
- permisos probados
- account deletion contemplada

## Requisito importante: eliminacion de cuenta

Muchas apps con cuenta de usuario necesitan ofrecer mecanismo de eliminar cuenta o al menos solicitarlo claramente.

Para Musgo, esto deberia resolverse desde v1 o muy temprano.

### Implica

- UI para pedir eliminacion
- borrado o anonimizado de datos
- documentacion en privacidad

## Roadmap de ejecucion para AI agents

## Regla general

Usar agents en paralelo, pero con ownership claro. Nadie deberia tocar las mismas carpetas al mismo tiempo.

## Reparto sugerido

### Agent 1 · Arquitectura mobile

Responsable de:

- bootstrap Expo
- TypeScript
- Expo Router
- config base
- themes

### Agent 2 · Dominio compartido

Responsable de:

- extraer reglas de negocio
- tipos
- tests unitarios de dominio

### Agent 3 · Supabase mobile

Responsable de:

- auth
- session persistence
- repositorios de plants/sections
- transforms de datos

### Agent 4 · UI core

Responsable de:

- dashboard
- plants
- spaces
- profile

### Agent 5 · Scanner

Responsable de:

- permisos
- image picker / camera
- upload / compression
- identificacion

### Agent 6 · Notifications

Responsable de:

- Expo Notifications
- registro de tokens
- backend support para reminders

### Agent 7 · Release ops

Responsable de:

- EAS config
- env handling
- build profiles
- checklist de stores
- assets faltantes

## Orden recomendado de trabajo

1. Arquitectura mobile
2. Dominio compartido
3. Supabase mobile
4. Navegacion + auth
5. CRUD principal de plantas y espacios
6. Scanner
7. Push
8. Analytics / crash reporting
9. Store readiness
10. Submission

## Definicion de listo para v1

Musgo v1 esta listo para publicar cuando:

- la app instala y abre bien en iOS y Android
- el usuario puede registrarse y loguearse
- el usuario puede crear, editar y regar plantas
- el usuario puede usar espacios
- el scanner funciona en condiciones reales
- las notificaciones llegan
- hay privacidad y soporte publicados
- las builds pasaron testing interno
- los formularios de Apple y Google estan completos

## Riesgos principales

- subestimar Google Sign-In mobile
- retrasos con cuentas de developer
- permisos y push en iOS
- deuda al no extraer dominio primero
- querer replicar demasiado la web en vez de diseñar mobile

## Recomendacion de timing

### Camino realista (8-10 semanas calendario)

La version original del plan estimaba 5 semanas. Realista para una developer sola + AI, contando burocracia de stores que corre en background:

- Semana 0 (en paralelo desde el dia 1):
  - inscripcion a Apple Developer Program (puede tardar 1-4 semanas con verificacion)
  - apertura de Google Play Console + verificacion de identidad
- Semana 1:
  - bootstrap Expo en `/mobile`
  - TypeScript, Expo Router, EAS configurado (incluido EAS Update)
  - port de `lib/domain/watering.js` a TS como validacion del setup
  - generar tipos de Supabase
- Semana 2:
  - cliente Supabase mobile + auth email/password + Secure Store
  - dashboard, listado plantas, detalle planta, crear planta manual, regar planta
- Semana 3:
  - espacios (CRUD + regar espacio)
  - scanner (image picker, camera, compresion, integracion con edge function existente)
- Semana 4:
  - push notifications con Expo Notifications
  - reescribir `send-watering-reminders` para Expo Push Service
  - **account deletion completa** (requisito duro de Apple)
  - Google Sign-In nativo
- Semana 5:
  - Sentry, eventos analytics minimos, smoke tests de flujos criticos
  - publicar privacy policy y terms en URL accesible
  - builds internas (TestFlight + Internal Testing en Play)
  - pruebas en al menos 2 iPhones y 2 Androids distintos
- Semana 6-7:
  - screenshots por device class
  - metadata, privacy questionnaires, age rating, data safety form
  - submission a ambas stores
  - esperar review (1-7 dias Apple, 1-3 dias Google)
- Semana 8+ (buffer):
  - rechazos de Apple, ajustes, bugs en device especifico
  - es practicamente seguro que se va a necesitar

### Por que el plan original de 5 semanas era optimista

- Apple Developer enrollment con verificacion puede tardar semanas y bloquear la submission.
- Google Sign-In nativo en iOS via Supabase es historicamente fastidioso.
- Push en iOS requiere APNs keys, capabilities y provisioning profiles bien configurados.
- Screenshots por device class te comen un dia entero.
- El review de Apple casi siempre rebota la primera vez.

## Backlog posterior a v1

- offline mode real
- sync mas robusto
- widgets
- richer reminders
- onboarding mas pulido
- analytics de retention
- suscripciones si hubiera modelo premium

## Siguiente accion recomendada

Dos workstreams en paralelo, porque corren en hilos independientes:

### 1. Burocracia (arrancar hoy, ~1-2 horas de trabajo activo)

- Iniciar inscripcion al Apple Developer Program (cuenta individual recomendada para arrancar rapido).
- Abrir cuenta de Google Play Console + pagar registro unico + iniciar verificacion de identidad.
- Confirmar nombre comercial definitivo de la app.
- Confirmar URLs publicas para privacy policy y terms (ya existen en `docs/`, hay que publicarlas).
- Confirmar email de soporte.

Esto corre en background mientras se codea. Si se deja para el final del proyecto, bloquea la submission.

### 2. Bootstrap tecnico (esta semana)

- Crear carpeta `/mobile` en el repo con app Expo nueva.
- Configurar TypeScript, Expo Router, EAS (con EAS Update habilitado desde el dia 1).
- Definir bundle identifiers definitivos para iOS y Android.
- Crear cliente Supabase para React Native con Secure Store.
- Generar tipos de Supabase con `supabase gen types typescript`.
- Portar `lib/domain/watering.js` a `mobile/src/domain/watering.ts` como primer ejercicio de validacion del setup TS.

### Lo que NO se va a hacer

- Doc de "alcance v1 vs v1.1" formal: el alcance ya esta definido en este plan (seccion "Alcance recomendado para mobile v1").
- Doc de "politica de transicion web → mobile": descartado por volumen de usuarios, ver "Decisiones tomadas".
- Lista de piezas que se convertiran en "dominio compartido": no hay dominio compartido, se porta a TS dentro de `/mobile`. Ver Fase 1 y "Decisiones tomadas".

## Resumen ejecutivo

La mejor ruta para Musgo es:

- no usar Flutter
- no invertir en Capacitor salvo urgencia extrema
- construir directamente en Expo
- reutilizar backend y reglas de negocio
- tratar store ops como parte del proyecto desde el dia 1, no como un cierre administrativo

La principal trampa a evitar es pensar que la publicacion en stores ocurre al final. En la practica, cuentas, permisos, privacidad, capturas, metadata, review y push forman parte del desarrollo.
