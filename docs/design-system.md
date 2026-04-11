# Musgo · Design System Actual

## Alcance

Este documento describe el sistema visual que está implementado hoy en el código del proyecto, principalmente en [`index.html`](/Users/franconardi/Documents/GitHub/musgo/index.html). Se basa en componentes y estilos reales renderizados por la SPA actual.

## Fundamentos visuales

### Paleta base

Tokens definidos en `:root`:

- `--green-dark: #345D4C`
- `--green-light: #C6EBD4`
- `--bg: #f4f7f1`
- `--bg-soft: #eef4ec`
- `--surface: rgba(255, 255, 255, 0.84)`
- `--surface-strong: #ffffff`
- `--surface-muted: #f6faf4`
- `--line: rgba(96, 125, 101, 0.14)`
- `--line-strong: rgba(83, 115, 88, 0.2)`
- `--accent: var(--green-dark)`
- `--accent-deep: var(--green-dark)`
- `--accent-soft: rgba(198, 235, 212, 0.5)`
- `--text: #1f3425`
- `--text-soft: #526457`
- `--muted: #708172`
- `--muted-soft: #94a096`
- `--rain: #6e9db3`
- `--rain-soft: rgba(110, 157, 179, 0.12)`
- `--earth: #987d58`
- `--earth-soft: rgba(152, 125, 88, 0.1)`
- `--danger: #cf7152`
- `--danger-soft: rgba(207, 113, 82, 0.12)`

### Colores usados de forma recurrente

#### Neutros y superficies

- fondo global: `#F9F9F8`
- superficie principal: `#ffffff`
- superficies suaves: `#f3f4f3`, `#f5f7f4`, `#f7f8f6`, `#f9fbf8`, `#f9fcf8`
- bordes suaves: `rgba(52, 93, 76, 0.06)` y `rgba(96, 125, 101, 0.14)`

#### Verde de marca

- color principal de acción y texto destacado: `#345D4C`
- verde secundario de apoyo: `#4d7663`
- verde suave para estados y fondos: `#C6EBD4`
- anillos/focus/hover: `rgba(79, 168, 109, 0.12)` a `rgba(79, 168, 109, 0.38)`

#### Estados

- éxito/agua/planta al día: verde oscuro y verde claro
- warning/riego atrasado: `#cf7152`, `#b24f37`, `#9f402d`
- información/identificación/fichas auxiliares: `#6e9db3`
- estado “earth” para vacíos o identificación insuficiente: `#987d58`

### Gradientes y fondos

Patrones repetidos:

- gradientes blancos con tinte verde:
  - `linear-gradient(180deg, #ffffff 0%, #f6faf5 100%)`
  - `linear-gradient(180deg, #f3faf2 0%, #ffffff 100%)`
  - `linear-gradient(180deg, #f2f5f1 0%, #edf3eb 100%)`
- gradientes de CTA:
  - `linear-gradient(90deg, #345d4c 0%, #4d7663 100%)`
- fondos con `radial-gradient` verde para crear profundidad visual suave

### Sombra

Tokens:

- `--shadow-xs: 0 10px 30px rgba(31, 52, 37, 0.05)`
- `--shadow-sm: 0 18px 44px rgba(31, 52, 37, 0.08)`
- `--shadow-md: 0 26px 70px rgba(31, 52, 37, 0.12)`

Uso real:

- cards: sombras suaves-medias
- botones primarios: sombra corta verde
- modales: sombra mucho más profunda
- drawer/sidebar: sombra media

### Border radius

Tokens:

- `--radius-sm: 16px`
- `--radius-md: 22px`
- `--radius-lg: 30px`
- `--radius-xl: 40px`

Radio dominante real:

- pills y botones redondos: `999px`
- inputs y pequeños contenedores: `18px`
- cards principales: `20px`, `22px`, `24px`, `28px`
- modal principal: `36px`

## Tipografía

### Familia

- única familia cargada y usada: `DM Sans`
- fallback: `sans-serif`

### Jerarquía tipográfica

#### Branding

- `.mobile-brand-name`: `24px`, `font-weight: 600`, color verde marca

#### Títulos principales

- `.screen-title`: `2rem`, `font-weight: 800`, `letter-spacing: -0.05em`
- en tablet/desktop sube a `2.5rem`
- `.landing-title`: `3.2rem` y en desktop `4.2rem`
- `.modal h2`: `1.95rem`, `font-weight: 800`

#### Títulos de cards y bloques

- `.plant-tile-name`: `1.15rem`, `font-weight: 800`
- `.space-card-name`: `1.55rem`, `font-weight: 800`
- `.identified-plant-name`: `1.1rem`, `font-weight: 800`
- `.profile-name`: `1.5rem`, `font-weight: 800`

#### Texto secundario

- `.screen-subtitle`: `0.95rem`, `line-height: 1.45`
- textos descriptivos y ayudas: `0.88rem` a `0.96rem`
- labels auxiliares y metadata: `0.72rem` a `0.82rem`, a menudo en uppercase

#### Estilo de labels

Patrón repetido:

- tamaño pequeño
- `font-weight: 700`
- uppercase
- tracking amplio (`0.06em` a `0.08em`)
- color `muted-soft`

## Espaciado

Tokens definidos:

- `--space-1: 6px`
- `--space-2: 10px`
- `--space-3: 14px`
- `--space-4: 18px`
- `--space-5: 24px`
- `--space-6: 32px`
- `--space-7: 44px`

Espaciados realmente dominantes:

- gaps internos pequeños: `8px`, `10px`, `12px`
- separación entre bloques de formulario o cards: `14px`, `16px`, `18px`
- padding de cards: `18px`, `20px`, `22px`, `24px`
- padding de pantallas: `24px 28px 40px`

## Componentes actuales

### Botones

#### Botón primario

Clases:

- `.btn-primary`
- `.btn-save`
- `.btn-water`

Características:

- fondo en gradiente verde
- texto blanco
- `min-height: 64px`
- padding `16px 24px`
- `border-radius: 24px`
- `font-weight: 700`
- hover con leve elevación y sombra más fuerte

Uso actual:

- CTA principal de landing
- guardar formularios
- acciones principales de detalle
- crear planta/guardar espacio

#### Botón secundario

Clases:

- `.btn-secondary`
- `.btn-auth`
- `.btn-cancel`

Características:

- fondo blanco translúcido
- borde suave
- texto oscuro o verde oscuro según contexto
- misma altura y estructura que el primario

Uso actual:

- login con Google
- acciones secundarias
- cancelar modales
- cerrar sesión

#### Botón de peligro

Clase:

- `.btn-danger`

Características:

- fondo blanco
- borde y texto en rojo/marrón
- icono por pseudo-elemento con `Delete icon.svg`
- `min-height: 64px`
- forma pill

Uso actual:

- eliminar planta
- eliminar espacio
- confirmar borrado

#### Botón icon-only

Clase:

- `.btn-icon`

Variantes:

- `.btn-icon.small`
- `.btn-icon.delete:hover`

Características:

- tamaño fijo `46x46` o `40x40`
- fondo blanco translúcido
- borde suave
- hover con realce verde
- hover delete con feedback rojo

Nota:

- existe en estilos, pero en la SPA actual visible el patrón dominante es botón textual o con icono embebido, no toolbar de icon-only.

#### Botones específicos de cards

- `.plant-tile-water-button`
  - pill gris claro
  - texto verde oscuro
  - icono de gota por `::before`
- `.space-card-button.secondary`
  - fondo gris claro
  - texto verde
- `.space-card-button.primary`
  - fondo verde oscuro
  - texto blanco
- `.topbar-menu-button`
  - botón transparente de menú
- `.topbar-menu-button.public-cta`
  - versión pill para “Ingresar”

### Inputs y selects

#### Form inputs principales

Clases:

- `.editor-input`
- `.editor-select`
- `.form-group input`
- `.form-group select`
- `.form-group textarea`

Características:

- fondo claro (`#f9fbf8` o `#f9fcf8`)
- borde verde muy suave
- `border-radius: 18px`
- altura mínima `54px` o `56px`
- focus con borde verde y halo de `4px`

Uso actual:

- login/registro
- formularios de planta
- formularios de espacio

#### Inputs de detalle

Clases:

- `.detail-input`
- `.detail-select`

Características:

- patrón equivalente al input principal
- fondo un poco más gris: `#F3F4F3`
- radio `18px`

Uso actual:

- edición de planta en vista detalle

#### Labels

Patrón:

- uppercase
- `font-size` pequeño
- peso alto
- color `muted-soft`

### Chips y tabs

#### Chips de filtro

Clases:

- `.chip-row`
- `.filter-chip`
- `.filter-chip.active`

Características:

- lista horizontal con scroll en mobile
- pills con fondo gris claro
- activa en verde oscuro con texto blanco

Uso actual:

- filtro de plantas por espacio

#### Tabs heredados

Clases:

- `.section-tabs`
- `.tab`

Nota:

- están definidas en CSS, pero la SPA actual usa `.chip-row` y `.filter-chip` para filtrado visible.

### Cards

#### Plant tile

Clases:

- `.plant-tile`
- `.plant-tile-visual`
- `.plant-tile-body`
- `.plant-tile-name`
- `.plant-tile-last`

Patrón visual:

- card blanca con borde sutil y sombra suave
- bloque visual superior con gradiente verde
- imagen `cover` o emoji centrado
- contenido compacto abajo
- CTA de riego dentro de la card

#### Space card

Clases:

- `.space-card`
- `.space-card-top`
- `.space-card-icon`
- `.space-card-name`
- `.space-card-count`
- `.space-card-actions`

Patrón visual:

- card blanca vertical
- título muy prominente
- icono grande en contenedor suave
- dos acciones al pie en grid 2 columnas

#### Dashboard cards

Clases:

- `.dashboard-summary-card`
- `.dashboard-chart-card`

Patrón visual:

- cards blancas
- contenido centrado en la de resumen
- gráfica de barras en la de chart

#### Auth card

Clase:

- `.auth-panel`

Patrón visual:

- card blanca con sombra media
- padding `22px`
- contiene CTA Google, divisor, toggle y formulario

#### Profile card

Clases:

- `.profile-card`
- `.profile-head`
- `.profile-panel-body`

Patrón visual:

- cabecera con gradiente radial verde muy suave
- avatar circular grande
- cuerpo con stats en celdas suaves

#### Cards de edición y detalle

Clases:

- `.space-editor-card`
- `.identified-plant-card`
- `.manual-plant-card`
- `.detail-form-card`
- `.detail-calendar-card`

Patrones:

- fondo blanco o transparente según el bloque
- radios medios-altos
- secciones verticales con spacing uniforme

#### Empty state

Clases:

- `.view-empty`
- `.empty-state`

Patrón visual:

- card centrada
- icono grande sobre fondo suave
- texto breve
- CTA principal opcional

### Navegación

#### Topbar

Clases:

- `.mobile-topbar`
- `.mobile-brand`
- `.topbar-menu-button`

Patrón:

- header blanco con borde inferior fino
- logo a la izquierda
- acción contextual o menú a la derecha

#### Menú lateral / drawer

Clases:

- `.menu-overlay`
- `.menu-drawer`
- `.menu-list`
- `.menu-item`
- `.menu-item.active`

Patrón visual:

- mobile: drawer flotante sobre overlay con blur
- desktop: sidebar blanca fija
- item activo en fondo verde oscuro
- icono del activo invertido a blanco

### Scan e identificación

#### Scan box

Clases:

- `.scan-box`
- `.scan-box-inner`
- `.scan-box-preview`
- `.scan-box-icon`
- `.scan-box-title`
- `.scan-box-copy`

Patrón visual:

- gran contenedor central
- borde verde suave
- fondo con gradientes radiales
- preview cuadrada o icono circular

#### Identificación

Clases:

- `.identify-state`
- `.identify-state.loading`
- `.identify-state.error`
- `.identify-state.empty`
- `.identify-result`

Nota:

- estos estilos existen para el flujo de identificación; en la SPA actual el flujo renderizado visible principal abre directamente el formulario de planta identificada y no expone una lista seleccionable de resultados.

### Modales

Clases:

- `.modal-overlay`
- `.modal`
- `.modal.modal-calendar`
- `.modal-actions`

Patrón visual:

- overlay oscuro translúcido con blur
- modal centrado con gran radio y sombra profunda
- entrada por `translateY + scale`
- layout interno vertical con acciones al final

Uso actual:

- confirmación de borrado
- calendario modal

### Calendario

Clases:

- `.cal-nav-btn`
- `.cal-legend`
- `.cal-day`
- `.cal-day.today`
- `.cal-day.watered`
- `.cal-day.future-water`
- `.cal-summary`

Patrón visual:

- grilla 7 columnas
- días como círculos de `44x44`
- estados codificados por color
- gota visual en día regado
- resumen inferior en cards compactas

### Feedback

#### Toast

Clase:

- `.toast`

Características:

- pill flotante centrada abajo
- fondo verde oscuro opaco
- texto blanco
- transición vertical al mostrarse

#### Feedback states

Clases:

- `.auth-feedback.error`
- `.auth-feedback.success`
- `.identify-state.loading`
- `.identify-state.error`
- `.identify-state.empty`
- `.delete-confirm`

Patrón:

- bloques redondeados con color de fondo por estado

## Layout patterns

### Shell principal

- `.app-shell` centra la aplicación
- `.app-frame` limita la anchura en mobile a `430px`
- fondo exterior gris claro y fondo interior blanco

### Pantallas

- cada vista usa `.screen`
- estructura habitual:
  - `.screen-head` opcional
  - `.screen-intro`
  - bloque principal de contenido
  - `.screen-actions` para acciones finales

### Responsive

#### Mobile first

- diseño base pensado para móvil
- cards, listas y formularios apilados verticalmente

#### Tablet

- desde `760px`
  - más padding
  - grids de plantas de 3 columnas
  - espacios con más anchura

#### Desktop ancho

- desde `1100px`
  - shell completo
  - sidebar fija en vistas principales
  - contenido principal centrado
  - plantas en grid fijo de 4 columnas de `190px`
  - espacios en columna central de `600px`

### Grids repetidos

- plantas: `2` columnas en mobile, `3` en tablet, `4` fijas en desktop
- espacios: lista vertical en mobile, grid o columna fija en desktop
- dashboard: dos columnas en desktop
- profile stats: grid de `2` columnas
- acciones de espacio: grid de `2` columnas

### Contenedores centrados

Patrón frecuente en desktop:

- bloques con `max-width`
- `margin-left/right: auto`
- formularios y detalle limitados a `560px`
- profile y legales alrededor de `504px`
- auth panel a `374px`

## Motion y estados interactivos

### Animaciones implementadas

- `screen-enter`: entrada suave de pantalla
- `fadeIn`: entrada de cards heredadas
- `splash-spin`: spinner
- modal: transición de opacidad + scale/translate
- toast: desplazamiento vertical

### Interacciones repetidas

- hover con `translateY(-1px)` o `translateY(-4px)`
- aumento de sombra en hover
- focus con halo verde suave
- estados activos con inversión a verde oscuro y texto blanco

## Patrones de estilo consistentes

- uso dominante de superficies blancas sobre fondo muy claro
- forma general redondeada, con muchas pills y cards suaves
- verde oscuro como color principal de acción
- feedback de estado mediante bloques suaves tintados
- tipografía condensada visualmente mediante tracking negativo en títulos
- uso frecuente de gradientes y halos radiales verdes para dar profundidad

## Componentes o estilos presentes pero no centrales en la SPA actual

Existen estilos adicionales para variantes previas o heredadas, entre ellas:

- `.plant-card`
- `.plants-grid`
- `.section-tabs`
- `.tab`
- `.emoji-picker`
- `.identify-results`

Están definidos en CSS, pero el flujo visible actual usa principalmente:

- `.plant-tile`
- `.space-card`
- `.auth-panel`
- `.scan-box`
- `.profile-card`
- `.dashboard-*`
- `.detail-*`
- `.filter-chip`
