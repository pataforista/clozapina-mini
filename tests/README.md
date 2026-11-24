# Pruebas de punta a punta

Playwright contra la app servida en local (los módulos ES no cargan con `file://`).

| Archivo | Qué hace |
|---|---|
| `e2e/smoke.js` | **Prueba de humo con aserciones** (39 comprobaciones): primera apertura, alertas clínicas, modales, unidades y calculadora de ANC, esquemas de monitoreo, divulgación progresiva, exportar e importar (incluida una importación con HTML malicioso), tema, teclado, modo sin conexión y peticiones a terceros. Termina con código 0 o 1. |
| `e2e/devices-audit.js` | Informe en 7 tamaños × 2 temas: modal, desbordes, objetivos táctiles de 44 px y contraste con transparencias. Escribe `audit.json` y capturas en `$OUT`. |
| `e2e/a11y-report.js` | Informe de accesibilidad: nombres de controles, saltos de encabezado, regiones, orden de tabulación. |

```bash
bash tests/run.sh            # solo la prueba de humo
bash tests/run.sh --report   # y los dos informes
```

Variables: `PORT` (8123), `BASE_URL`, `OUT` (carpeta de salida; por defecto, una carpeta temporal) y `NODE_PATH` (si Playwright
está instalado de forma global se detecta con `npm root -g`).

**Notas**
- Los informes no hacen aserciones; son para revisar. En el de accesibilidad, el aviso `h1→h3` de Recursos es un falso
  positivo: cuenta el título del modal cerrado.
- Al recargar con una entrada de alto riesgo reaparece la alerta crítica y bloquea el teclado hasta cerrarla (ver `BL-10`);
  las pruebas la cierran antes de seguir.
- No sustituyen la prueba en dispositivos reales ni la revisión clínica (`BL-01`, `BL-06`).
