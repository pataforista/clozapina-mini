# Plan de corrección, mejora y perfeccionamiento — CLZ Mini PWA

> Resultado de la revisión de código y estética (julio 2026).
> Archivos auditados: `index.html` (~4.300 líneas), `engine.js`, `galaxy.js`, `sw.js`, `manifest.json`, `demo-data.json`.
>
> Organización: **Fase 1** corrige bugs (los clínicos primero), **Fase 2** limpia y ordena,
> **Fase 3** mejora accesibilidad y UX, **Fase 4** perfecciona la estética y el acabado.
> Cada punto incluye la ubicación exacta y el criterio de aceptación para verificar la corrección.

---

## Fase 1 — Corrección de bugs (prioridad máxima)

### 1.1 🔴 Labs vacíos se convierten en `0` al recargar → falsa alerta de agranulocitosis
- **Dónde:** `index.html:2997-3012` (`validateAndSanitizeEntry`).
- **Causa:** `Math.max(0, Math.min(25, parseNum(...)))` — cuando `parseNum` devuelve `null`
  (campo vacío), `Math.min(25, null)` coacciona `null` a `0`.
- **Impacto:** una entrada guardada sin ANC (solo síntomas) se transforma en `anc_k: 0` al
  recargar la página o importar JSON, y dispara el modal **"ALERTA CRÍTICA: RIESGO DE
  AGRANULOCITOSIS"** con datos que nunca existieron. Afecta ANC, WBC, PLT, EOS, los likert
  y `constipation_days`.
- **Corrección:** helper que preserve `null`:
  ```js
  const clamp = (v, max) => v === null ? null : Math.max(0, Math.min(max, v));
  ```
  y usarlo en todos los campos numéricos de la sanitización.
- **Aceptación:** guardar entrada sin ANC → recargar → no aparece alerta ANC; el KPI muestra "—".

### 1.2 🔴 `forcePatientSetup` rompe el botón de cierre del modal para el resto de la sesión
- **Dónde:** `index.html:2887-2912` y `modal.close` (`index.html:2821`).
- **Causa:** clona `btnModalClose` para quitar listeners; el clon pierde el listener
  `modal.close` (registrado en `index.html:4149`) y conserva el texto "Guardar y Continuar".
- **Impacto:** tras configurar el paciente, cualquier modal posterior (incluidas las alertas
  críticas reales) muestra "Guardar y Continuar" y al hacer clic lanza `TypeError`
  (`$("quick_pt_label")` ya no existe). El modal solo se cierra tocando el fondo.
- **Corrección:** no clonar el nodo. Usar un listener registrado una sola vez con bandera de
  modo (setup vs. normal), o `addEventListener(..., { once: true })` para el flujo de setup,
  y restaurar `textContent = "Entendido"` dentro de `modal.close()`.
- **Aceptación:** configurar paciente → provocar alerta crítica → el botón dice "Entendido"
  y cierra el modal sin errores en consola.

### 1.3 🔴 Gráfica ilegible en tema claro
- **Dónde:** `index.html:3706` (texto "No hay datos suficientes" en `rgba(233,238,247,.75)`)
  y `index.html:3721` (cuadrícula en `rgba(255,255,255,.08)`).
- **Causa:** colores fijos pensados para fondo oscuro; el resto de `drawChart` ya consulta
  `isDark`, estas dos reglas quedaron fuera.
- **Corrección:** derivar ambos colores de `isDark` (o de las variables CSS del tema).
- **Aceptación:** en tema claro, la cuadrícula y el mensaje de "sin datos" son visibles.

### 1.4 🟠 El force-update puede descartar una captura a medias
- **Dónde:** `sw.js:21` (`skipWaiting` en `install`) + `index.html:4181-4194`
  (`controllerchange` → `location.reload()` a los 400 ms).
- **Impacto:** si llega una actualización mientras el usuario captura una entrada, la página
  recarga sola y se pierde el formulario.
- **Corrección (mínima):** antes de recargar, detectar formulario "sucio" (algún campo con
  valor distinto del estado limpio) y guardar un borrador en `localStorage`
  (`clz_mini_pwa_draft`); al iniciar, restaurarlo y avisar con un toast.
  Alternativa más simple: posponer el reload hasta que el formulario esté limpio.
- **Aceptación:** escribir en el formulario → simular update → tras la recarga el contenido
  del formulario se recupera (o la recarga se pospone).

### 1.5 🟠 Cambiar la serie de la gráfica no redibuja
- **Dónde:** `index.html:4056-4057` — hay listener para `chartWindow` pero no para `chartSeries`.
- **Corrección:** `$("chartSeries").addEventListener("change", drawChart);`
  (el botón "Redibujar" puede eliminarse una vez que ambos selects redibujan solos).
- **Aceptación:** cambiar serie o ventana actualiza la gráfica sin pasos extra.

### 1.6 🟠 Umbral "ANC grave" (`t_anc_sev`) editable pero sin efecto
- **Dónde:** campo en `index.html:2377`, guardado en `index.html:4116`; ni `analyzeANC`
  (`engine.js:32`) ni `assess` lo usan.
- **Impacto:** un ajuste clínico que aparenta tener efecto y no lo tiene es engañoso.
- **Corrección (elegir una):**
  - **(a) Usarlo:** añadir nivel `SEVERE` en `analyzeANC` (mensaje/acción diferenciados de
    CRITICAL) alimentado por `anc_severe`; **o**
  - **(b) Quitarlo** del formulario de Ajustes y del objeto de umbrales.
- **Aceptación:** el campo tiene efecto observable o ya no existe.

### 1.7 🟠 Fallback offline del service worker devuelve `index.html` para todo
- **Dónde:** `sw.js:63-66`.
- **Impacto:** scripts, fuentes y PDFs fallidos reciben HTML como respuesta (content-type
  incorrecto, errores confusos).
- **Corrección:** limitar el fallback a navegación:
  ```js
  if (req.mode === "navigate") return cache.match("./index.html", { ignoreSearch: true });
  return Response.error();
  ```
- **Aceptación:** offline, una petición de PDF no cacheado falla limpio; la navegación sigue
  cayendo en `index.html`.

### 1.8 🟠 `navigator.clipboard` sin guarda
- **Dónde:** `index.html:4009` (`copyClinicalNote`) y `index.html:3055` (`shareEntry`).
- **Impacto:** en contexto no seguro (http) `navigator.clipboard` es `undefined` y el botón
  truena en silencio.
- **Corrección:** guard + toast de error; opcionalmente fallback con `document.execCommand("copy")`.
- **Aceptación:** en contexto sin clipboard, el usuario recibe un mensaje claro en vez de nada.

### 1.9 🟡 `clearForm` deja los likert sin valor
- **Dónde:** `index.html:3256-3262` — pone `value = ""` en los hidden de los likert cuando el
  estado inicial del HTML es `"0"`.
- **Corrección:** los ids de likert (`sial`, `const`, `somn`, `diz`, `blur`, `app`) deben
  resetearse a `"0"`; los labs (`anc`, `wbc`, `plt`, `eos`) a `""`.
- **Aceptación:** tras "Limpiar", todos los likert muestran el `0` marcado.

### 1.10 🟡 Triple render por guardado
- **Dónde:** `upsertEntryFromForm` → `auditLog` → `save(false)` → `renderAll()`, luego
  `save(true)` → `renderAll()`, luego `renderAll()` explícito (`index.html:4438-4446, 2950-2965`).
- **Corrección:** quitar `renderAll()` de `save()` (o de `auditLog`) y dejar que cada flujo
  renderice una sola vez al final.
- **Aceptación:** un guardado produce un único render (verificable con un contador temporal).

---

## Fase 2 — Limpieza de código

### 2.1 Eliminar `anime.js` (no se usa)
- **Dónde:** `index.html:16` — script bloqueante desde cdnjs, sin SRI; grep confirma cero usos.
- **Beneficio:** menos peso, menos superficie de riesgo (supply chain) en una app médica.

### 2.2 Eliminar CSS muerto de `.update-banner` (~100 líneas)
- **Dónde:** `index.html:955-1081` + referencias en el bloque reduce-motion
  (`index.html:1168-1175`). No existe ningún elemento `.update-banner` en el HTML
  (el flujo actual solo usa `.update-overlay`).

### 2.3 Eliminar código muerto en JS
- `checkPatientContext` (`index.html:2835`): definida, nunca llamada.
- Selector `".tab"` en `setTab` y listeners (`index.html:3207, 3243`): no existe la clase.
- Comentarios de "pensamiento en voz alta" en `forcePatientSetup`
  (`index.html:2870-2876`, "Actually, let's inject...").
- En `engine.js`: `SOMNOLENCE_MAX`, `SMOKING_FACTOR`, `FLUVOXAMINE_REDUCTION` sin uso
  (usarlos o quitarlos; si se quitan, dejar nota en el commit de por qué).

### 2.4 Resolver el estado vacío duplicado de la lista
- **Dónde:** CSS `#entryList:empty` (`index.html:1792-1814`, con 📋 y mensaje) nunca se
  muestra porque `renderList` inyecta `<div class="note">Sin entradas…</div>`.
- **Corrección:** en `renderList`, cuando no haya entradas dejar el contenedor vacío para que
  aplique el estado `:empty` del CSS (es el mejor de los dos) y borrar el inyectado.

### 2.5 Consolidar el CSS en una sola capa
- **Dónde:** tres "eras": estilos base, «MODERN UI 2025 — Targeted overrides»
  (`index.html:1570`) y «POLISH» (`index.html:1854`). Reglas definidas 2-3 veces:
  `label`, `.card`, `.card:hover`, `.collapsible-trigger::after` (el `content:'▾'` de
  `index.html:1228` queda pisado por el chevron posterior), transiciones de `.item`,
  `.box`, `.icon-btn`, `.btn-doc`, `.rating-opt`, `.feedback-badge`.
- **Corrección:** fusionar cada selector en una única definición con el valor final vigente.
  Fusionar también los dos bloques `@media (prefers-reduced-motion)` (`index.html:112` y `692`).
- **Beneficio estimado:** −200 líneas y un CSS donde "lo que lees es lo que gana".
- **Riesgo:** medio (regresiones visuales). Hacerlo en commit propio y comparar capturas
  antes/después en ambos temas.

### 2.6 Unificar la identidad de versión
- **Dónde:** `sw.js:2` (`1.4.0`), `DEFAULTS.version` (`clz-mini-pwa-v2-delphi`,
  `index.html:2730`), firma "v2026" en `shareEntry` (`index.html:3049`).
- **Corrección:** una sola fuente de verdad (la del SW, que ya se muestra en Ajustes) y
  derivar las demás menciones de ella.

### 2.7 Higiene del repositorio
- **`clozapina.zip` (12.8 MB) en la raíz:** si el repo se publica como sitio estático, el zip
  se publica también. Sacarlo del repo (y valorar limpiar el historial si contiene datos
  sensibles).
- **`icon-512.png` (260 KB):** optimizar (~40 KB sin pérdida visible con `oxipng`/`pngquant`).

---

## Fase 3 — Accesibilidad y UX

### 3.1 Likert accesibles por teclado (crítico de a11y)
- **Dónde:** `.rating-opt` son `div` sin `role` ni `tabindex` (`index.html:2118-2230`).
- **Corrección:** convertir a `<button type="button">` dentro de un contenedor
  `role="radiogroup"` con `aria-label` del síntoma, o `role="radio"` + `aria-checked` +
  navegación con flechas. Es el mecanismo principal de captura de síntomas.
- **Aceptación:** capturar una entrada completa solo con teclado.

### 3.2 Gestión de foco en el modal
- **Dónde:** `modal.open/close` (`index.html:2796-2829`).
- **Corrección:** al abrir, mover el foco al modal (título o primer botón); atrapar Tab dentro;
  cerrar con `Escape` (excepto en modo `hard-stop`); al cerrar, devolver el foco al elemento
  que lo abrió.
- **Aceptación:** una alerta crítica es operable íntegramente con teclado.

### 3.3 Checkboxes con `<label>` real
- **Dónde:** filas `.checkbox-row` usan `<span class="small">` (`index.html:2033-2057, 2140-2158`);
  solo "Modo Ahorro" (`index.html:2388-2390`) usa `<label for>` correcto.
- **Corrección:** replicar el patrón de Modo Ahorro en todas las filas.
- **Aceptación:** clic en el texto marca/desmarca la casilla.

### 3.4 Corregir `aria-labelledby` de los tabpanels
- **Dónde:** `index.html:3220` — apunta al id de la propia sección; los `.nav-item` no tienen id.
- **Corrección:** dar `id="navtab-{nombre}"` a cada `.nav-item` y apuntar los paneles a esos ids.

### 3.5 Evitar el auto-zoom de iOS en inputs
- **Dónde:** `input/select/textarea` con `font-size: 14px` (`index.html:420`).
- **Corrección:** subir a 16px (al menos en `@media (max-width: 768px)`).
- **Aceptación:** enfocar un input en iOS Safari no dispara zoom.

### 3.6 `theme-color` dinámico
- **Dónde:** `<meta name="theme-color">` fijo en `#0D0C12` (`index.html:7`).
- **Corrección:** actualizar el meta desde `setTheme()` (`#F5F3EE` claro / `#0D0C12` oscuro).

---

## Fase 4 — Estética y acabado

> Lo que ya funciona y se conserva: paleta ukiyo-e (distintiva y coherente en ambos temas),
> sistema de tokens CSS, semántica de colores ok/warn/bad clara, `prefers-reduced-motion`
> respetado, `focus-visible` cuidado.

### 4.1 Reducir la competencia de efectos visuales
- **Problema:** conviven fondo WebGL de galaxia + glassmorphism + borde eléctrico girando
  24/7 en el botón Guardar (`index.html:264-325`) + anillos pulsantes + shimmer + gradientes
  en cards y KPIs. En una herramienta de decisión clínica, la animación compite con las
  alertas — lo único que debería llamar la atención.
- **Propuesta:** dejar la galaxia como único efecto protagonista (ya tiene interruptor en
  Modo Ahorro). El botón Guardar pasa a `button.primary` normal (con su micro-lift); el
  `electric-border` se reserva, si acaso, para un estado transitorio (p. ej. pulso al guardar).
- **Riesgo:** decisión de gusto — validar con el equipo antes de aplicar.

### 4.2 Un solo lenguaje de iconos (SVG)
- **Problema:** la navegación usa SVG; los botones de acción usan emoji
  (📋 🧹 🗑️ ℹ️ 👁️ ⬇ 🔗 en `index.html:2244-2247, 2554-2588, 3532, 3545`), que se ven
  distintos en cada plataforma.
- **Propuesta:** reemplazar los emoji funcionales por SVG inline (mismo set visual que la
  nav, `fill: currentColor`). Los emoji decorativos de textos informativos pueden quedarse.

### 4.3 Sistematizar la escala de radios
- **Problema:** 12 valores distintos (4, 6, 8, 9, 10, 12, 14, 18, 20, 22, 26, 32 px).
- **Propuesta:** tokens `--radius-sm: 8px`, `--radius: 14px`, `--radius-lg: 20px`,
  `--radius-full: 999px` y mapear cada uso al más cercano.

### 4.4 Toast que no se encime a la barra flotante
- **Dónde:** toast `bottom: 24px` (`index.html:846`) vs. nav flotante `bottom: 20px`.
- **Corrección:** subir el toast a `bottom: 96px` (misma altura que usaba el update-banner)
  o `calc(20px + altura nav + 12px)`.

### 4.5 Migrar estilos inline a clases
- **Dónde:** banner de contexto de paciente (`index.html:1967-1974`), formulario inyectado
  del modal (`index.html:2878-2885`), botones del header, support-boxes con overrides inline
  (`index.html:2063, 2148`).
- **Propuesta:** clases `.context-banner`, `.support-box--warn`, `.support-box--bad`, etc.,
  aprovechando el sistema que ya existe.

### 4.6 Afinado tipográfico menor
- Helpers de 11px con `opacity: .8` y labels uppercase de 11px: verificar contraste AA en
  tema claro (`--muted` #6B6878 sobre #F5F3EE está al límite en tamaños pequeños);
  subir a 12px donde el contenido sea informativo y no decorativo.

---

## Orden de ejecución sugerido (commits atómicos)

| # | Alcance | Ítems | Riesgo |
|---|---------|-------|--------|
| 1 | fix(clinical): sanitización preserva null | 1.1 | Bajo |
| 2 | fix(ui): modal reutilizable tras setup de paciente | 1.2 | Bajo |
| 3 | fix(chart): tema claro + redibujo por serie | 1.3, 1.5 | Bajo |
| 4 | fix(pwa): borrador ante force-update + fallback navigate | 1.4, 1.7 | Medio |
| 5 | fix(form): clipboard con guarda, likert a 0, render único, umbral grave | 1.6, 1.8, 1.9, 1.10 | Bajo |
| 6 | chore: quitar anime.js, CSS/JS muerto, zip, icono optimizado | 2.1-2.4, 2.7 | Bajo |
| 7 | refactor(css): consolidación en una capa + versión única | 2.5, 2.6 | Medio |
| 8 | feat(a11y): likert, modal, labels, aria, iOS zoom, theme-color | 3.1-3.6 | Medio |
| 9 | style: iconos SVG, radios, toast, clases, tipografía | 4.2-4.6 | Bajo |
| 10 | style: reducción de efectos (previa validación del equipo) | 4.1 | Decisión de diseño |

**Verificación transversal tras cada commit:** probar en ambos temas, con y sin datos,
con `prefers-reduced-motion`, offline (SW), y el flujo completo
crear → recargar → editar → borrar → importar/exportar.
