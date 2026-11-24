# CLZ Mini PWA: guía para agentes y colaboradores

Aplicación web progresiva (PWA) para el **registro local y el apoyo a la decisión en el monitoreo de clozapina**
(laboratorios, síntomas, alertas). Desarrollada por la Clínica de Esquizofrenia del INPRFM. Es una herramienta de
**apoyo**, no un dispositivo médico: todo lo que muestra debe poder rastrearse a una fuente y dejar la decisión al clínico.

> Estado, pendientes y decisiones: `docs/BACKLOG.md`. Fuentes clínicas y su verificación: `docs/CLINICAL_SOURCES.md`.
> Plan histórico de la primera revisión: `PLAN_MEJORAS.md` (con estado actualizado al inicio).

## Estructura

| Archivo | Qué contiene |
|---|---|
| `index.html` | Toda la interfaz (HTML + CSS + JS en un módulo). ~5.200 líneas; el CSS termina con capas de ajustes añadidas por revisión. |
| `engine.js` | Lógica clínica pura: `analyzeANC`, `auditSideEffects`, `checkInteractions`. |
| `sw.js` | Service worker (offline). Cambia `SW_VERSION` en cada publicación. |
| `manifest.json`, `icon-*.png` | Instalación como app. |
| `demo-data.json` | Datos de demostración (botón "Cargar demo"). |
| `docs/` | PDF de apoyo para el paciente y el clínico, más la documentación del proyecto. |
| `tests/` | Pruebas de punta a punta con Playwright (ver `tests/README.md`). |

No hay compilación ni dependencias de ejecución: se sirve como sitio estático. Los datos viven solo en `localStorage`
(clave `clz_mini_pwa_v1`); no hay servidor.

## Cómo ejecutar y probar

```bash
bash tests/run.sh             # prueba de humo con aserciones (debe terminar en 39/39 o más)
bash tests/run.sh --report    # además, auditoría de dispositivos y de accesibilidad
python3 -m http.server 8123   # para abrir la app a mano (los módulos ES no cargan con file://)
```

Requiere Node y Playwright (`require('playwright')`). **Ejecuta la prueba de humo antes de cada commit.**

## Reglas del proyecto

**Contenido clínico**
- Cada alerta se crea con `add(kind, tag, title, text, steps, source)` dentro de `assess()` (`index.html`): `text` es el
  hallazgo en una frase; `steps`, lo que el clínico puede considerar; `source`, de dónde viene el criterio.
- Tono de **apoyo**: "considera", "la ficha indica", nunca órdenes absolutas. Siempre queda la nota de que las alertas no
  sustituyen el juicio clínico.
- Todo criterio nuevo se registra en `docs/CLINICAL_SOURCES.md` con su fuente y estado de verificación. Si no hay fuente
  verificada, la app debe decirlo ("umbral configurado, no figura en la ficha FDA").
- No inventes umbrales numéricos (por ejemplo, para PCR o troponina: la app solo los registra).
- Unidades: laboratorios en x10³/µL. La conversión desde células/µL se ofrece, no se asume.
- Mantén la distinción entre fuentes: ficha FDA, comunicado EMA, consenso Delphi, monografía canadiense.

**Interfaz**
- Español de México, vocabulario clínico conocido (ANC, BEN/DARC-null, biometría hemática).
- Divulgación progresiva: lo crítico a la vista y completo; lo demás plegado. Evita sumar texto por defecto.
- Color nunca es la única señal: la gravedad lleva texto y símbolo (✕ Crítico, ! Vigilar, i Informativo, ✓ Normal).
- Contraste mínimo 4.5:1 en texto y 3:1 en bordes de controles, en ambos temas (tokens `--line-strong`, `--line-mid`).
- Objetivos táctiles de 44 px; campos a 16 px en pantallas táctiles (evita el zoom de iOS).
- Las unidades con "µ" no pueden quedar bajo `text-transform: uppercase` (se convierte en "M"): usa la clase `.u`.
- Usa los modales solo para lo que exige acción; el modal crítico no se cierra tocando el fondo.
- Una vista nueva debe funcionar de 320 px a 1440 px y en horizontal con poca altura.

**Privacidad y red**
- **Ninguna petición a terceros** (la prueba de humo lo verifica). Tipografía del sistema (`--sans`, `--mono`); no agregues
  CDN, fuentes externas ni analítica. No captures datos identificables (el aviso está en la interfaz).
- Todo texto que venga de datos importados o escritos por el usuario y entre como HTML pasa por `esc()`. Las fechas
  importadas se validan con `AAAA-MM-DD`.

**Publicación**
- Sube `SW_VERSION` en `sw.js` y `state.swVersion` en `index.html` en cada publicación (si no, los usuarios conservan
  la caché anterior).
- No incluyas documentos de terceros con derechos (artículos, fichas) en `docs/`; cítalos en `CLINICAL_SOURCES.md`.

## Decisiones ya tomadas (no las reabras sin motivo)

- Esquema de monitoreo de ANC seleccionable (FDA por defecto, EMA 2025, Delphi 2025). Solo cambia la **fecha sugerida**.
  No hay norma mexicana específica identificada; prevalece el protocolo institucional.
- Los leucocitos bajos son **informativos** (la EMA eliminó su monitoreo en 2025; basta el ANC).
- La taquicardia sola **no** activa el aviso de PCR y troponina (consenso Delphi de miocarditis, 2026).
- Eosinófilos: vigilar desde 0.7 (ficha FDA); 3.0 y plaquetas 50 son umbrales **configurables** de la monografía
  canadiense, no de la FDA.
- Se eliminó el fondo animado (dependencia externa y costo de batería). Sin dependencias de CDN.
- Tipografía del sistema, sin mayúsculas sostenidas en etiquetas, texto base de 16 px y cifras con la misma fuente y alineadas.
- Primera apertura: lleva a Ajustes con una bienvenida; al guardar el paciente, pasa a Registro.

## Seguimiento de tareas con Beads

El proyecto usará **Beads (`bd`)** para las tareas. En esta máquina aún no estaba instalado, así que **no hay carpeta
`.beads/` creada**. Para activarlo:

1. Instala `bd` (`brew install beads` o `npm install -g @beads/bd`; consulta la documentación vigente).
2. En la raíz, `bd init`. Según su documentación, crea o actualiza este `AGENTS.md` y agrega sus propias instrucciones de
   flujo; conserva las secciones de arriba.
3. Siembra las tareas con `bash scripts/beads-seed.sh` (imprime los comandos) y `bash scripts/beads-seed.sh --run`
   (los ejecuta). Cada tarea lleva un identificador `BL-xx` en el título que enlaza con `docs/BACKLOG.md`, donde están la
   descripción y los criterios de aceptación.
4. Después usa `bd ready`, `bd show <id>`, `bd update <id> --claim` y `bd close <id>`. No uses listas de pendientes en
   markdown para seguimiento.

Si `bd` guarda las tareas en otro formato o ubicación en tu versión, prevalece su documentación. `docs/BACKLOG.md` sigue
siendo la fuente legible por personas.

## Antes de cerrar una tarea

1. `bash tests/run.sh` en verde. 2. Si cambiaste un criterio clínico, actualiza `docs/CLINICAL_SOURCES.md`.
3. Si cambiaste algo que ve el usuario, sube la versión del service worker. 4. Cierra la tarea en Beads con una razón breve.
