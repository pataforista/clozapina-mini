# Backlog de CLZ Mini PWA

Fuente legible por personas de las tareas pendientes. Última actualización: **24 de noviembre de 2026**.
Cada tarea tiene un identificador `BL-xx`, una prioridad (**0** = bloquea el uso clínico, **1** = alta, **2** = media,
**3** = baja), dependencias, descripción y criterios de aceptación. La línea que empieza con `bd create` es el comando de
Beads para crear la tarea; `bash scripts/beads-seed.sh` extrae y ejecuta esas líneas (ver `AGENTS.md`).

Convención: el título lleva el identificador `BL-xx` para enlazar la tarea de Beads con esta ficha.

## Prioridad 0: antes de usar con pacientes reales

### BL-01 Validación clínica del contenido por otro clínico
- **Depende de:** nada. **Bloquea:** BL-09.
- **Descripción:** las alertas, los umbrales, la monografía rápida y los textos de apoyo fueron redactados y cotejados con
  fuentes, pero ningún clínico los ha revisado con casos conocidos. Armar 8 a 10 casos (ANC crítico, BEN, eosinofilia,
  fiebre con síntomas cardíacos, tabaquismo, fluvoxamina, entradas incompletas) y comparar lo que dice la app con el
  criterio de al menos dos clínicos.
- **Aceptación:** lista de casos con el resultado esperado por los clínicos; discrepancias registradas como tareas; firma
  de quien revisó en `docs/CLINICAL_SOURCES.md` (columna de estado).

```
bd create "BL-01: Validacion clinica del contenido por otro clinico" -p 0
```

## Prioridad 1: alta

### BL-02 Revisar el texto de interacciones de engine.js contra la ficha FDA
- **Descripción:** `engine.js` indica "reducción crítica de dosis (~75–90 %)" con fluvoxamina, pero la ficha FDA (Tabla 1)
  indica usar **un tercio de la dosis** (≈ 67 % de reducción). Para el cese del tabaquismo, el texto "niveles ×2–3 en
  6–12 días, reducir ~30–50 %" no tiene fuente verificada (la ficha solo pide vigilar y considerar reducir). Verificar
  también el mensaje de cafeína.
- **Aceptación:** cada cifra de `engine.js` tiene fuente en `docs/CLINICAL_SOURCES.md` o se retira; la monografía rápida y
  las alertas no se contradicen; prueba nueva en `tests/e2e/smoke.js`.

```
bd create "BL-02: Revisar cifras de interacciones en engine.js contra la ficha FDA" -p 1
```

### BL-03 Confirmar la versión final del comunicado DHPC de la EMA y la ficha vigente
- **Descripción:** el DHPC que se usó es un borrador con campos de plantilla. Obtener la versión publicada y la ficha
  técnica (SmPC) vigente; confirmar que el esquema EMA y la eliminación del monitoreo de leucocitos se mantienen.
- **Aceptación:** fila de `EMA-DHPC` en `docs/CLINICAL_SOURCES.md` pasa a "verificado en el documento final".

```
bd create "BL-03: Confirmar version final del DHPC de la EMA y la ficha vigente" -p 1
```

### BL-04 Esquema de monitoreo del protocolo institucional (INPRFM)
- **Depende de:** recibir el protocolo institucional. **Relacionada:** BL-01.
- **Descripción:** no hay norma mexicana específica identificada. Agregar el protocolo del INPRFM como cuarta opción del
  selector (fecha sugerida del próximo laboratorio y umbrales propios si los hay). Leer también el protocolo de
  CIASAME (Jalisco) como referencia; no se ha leído.
- **Aceptación:** esquema "Institucional" seleccionable, con su fuente citada; pruebas de fechas en el humo.

```
bd create "BL-04: Agregar el protocolo institucional INPRFM como esquema de monitoreo" -p 1
```

### BL-05 Eliminar la dependencia de Google Fonts
- **Descripción:** es la única comunicación con terceros que queda (`fonts.googleapis.com`, `fonts.gstatic.com`). Opciones:
  tipografía del sistema, o autoalojar Inter y JetBrains Mono (agregarlas al caché del service worker). Decidir y aplicar.
- **Aceptación:** la prueba "solo hay peticiones a Google Fonts" cambia a "ninguna petición fuera del origen"; la app se ve
  igual de legible; funciona sin conexión desde la primera carga.

```
bd create "BL-05: Eliminar la dependencia de Google Fonts (autoalojar o fuente del sistema)" -p 1
```

### BL-06 Probar en dispositivos y tecnologías de apoyo reales
- **Descripción:** todo se midió con un navegador de escritorio simulando dispositivos. Probar en un teléfono de gama baja,
  iPhone con Safari, una tableta (vertical y horizontal) y con un lector de pantalla (VoiceOver, TalkBack o NVDA). Revisar
  rendimiento de animaciones, zoom en iOS, teclado en pantalla sobre los campos y el modal en horizontal.
- **Aceptación:** lista de hallazgos con capturas; correcciones abiertas como tareas.

```
bd create "BL-06: Probar en dispositivos reales y con lector de pantalla" -p 1
```

## Prioridad 2: media

### BL-07 Sesiones de uso con 3 a 5 clínicos
- **Descripción:** observar cómo capturan una entrada real y cómo leen las alertas. Medir tiempo para la primera entrada,
  dudas, datos que nunca usan y datos que buscan primero. Es la evidencia que falta sobre la carga cognitiva.
- **Aceptación:** notas de sesión resumidas; decisiones sobre BL-08 y BL-09.

```
bd create "BL-07: Sesiones de uso con 3 a 5 clinicos" -p 2
```

### BL-08 Modo de captura rápida
- **Depende de:** BL-07. **Descripción:** hoy el formulario ofrece 17 campos y 4 pantallas de alto, con hábitos, síntomas y
  PCR/troponina plegados. Un "control rápido" (fecha, ANC, leucocitos, plaquetas, fiebre) con "más detalle" opcional reduciría
  la carga si el uso típico es solo laboratorio.
- **Aceptación:** captura rápida en menos de 30 segundos con la fecha y el ANC; pruebas del humo adaptadas.

```
bd create "BL-08: Modo de captura rapida con mas detalle opcional" -p 2
```

### BL-09 Política de alertas críticas múltiples
- **Depende de:** BL-01 y BL-07. **Descripción:** con varias alertas críticas, todas se muestran abiertas (más de una
  pantalla). Decidir si abrir solo la primera y dejar las demás plegadas en rojo. Es una decisión clínica: plegar un paso
  crítico lo deja a un toque.
- **Aceptación:** decisión documentada en `AGENTS.md` y probada.

```
bd create "BL-09: Definir politica de alertas criticas multiples" -p 2
```

### BL-10 La alerta crítica reaparece al recargar
- **Descripción:** `state.lastAlertKey` no se guarda, así que al abrir o recargar la app el modal crítico de la última
  entrada vuelve a mostrarse (y bloquea el teclado hasta cerrarlo). Es seguro, pero puede ser molesto. Decidir si se
  persiste un "reconocida" por entrada.
- **Aceptación:** comportamiento decidido y cubierto por una prueba.

```
bd create "BL-10: Decidir si la alerta critica reaparece al recargar" -p 2
```

### BL-11 Consolidar el CSS en una sola capa
- **Descripción:** `PLAN_MEJORAS.md` punto 2.5. Hoy el CSS tiene la capa base, «MODERN UI», «POLISH» y varias capas de
  ajustes añadidas al final por las revisiones de usabilidad, contraste, tabletas y legibilidad. Fusionar cada selector en
  una sola definición con su valor vigente, y los dos bloques de `prefers-reduced-motion`.
- **Aceptación:** sin cambios visuales (comparar capturas de `tests/run.sh --report` antes y después, en ambos temas).

```
bd create "BL-11: Consolidar el CSS en una sola capa" -p 2
```

### BL-12 Unificar la identidad de versión
- **Descripción:** `PLAN_MEJORAS.md` 2.6. `SW_VERSION` (sw.js) y `state.swVersion` están en 1.7.0, pero `DEFAULTS.version`
  dice "1.5.0" y el resumen compartido tiene un valor de respaldo "1.4.0". Dejar una sola fuente de verdad.
- **Aceptación:** una sola constante; el resumen y las exportaciones muestran la misma versión.

```
bd create "BL-12: Unificar la identidad de version de la app" -p 2
```

## Prioridad 3: baja

### BL-13 Optimizar icon-512.png
- **Descripción:** pesa 260 KB; con `oxipng` o `pngquant` baja a unos 40 KB sin pérdida visible.
- **Aceptación:** el icono se ve igual y pesa menos de 80 KB.

```
bd create "BL-13: Optimizar icon-512.png" -p 3
```

### BL-14 Verificar puntos del plan antiguo sin confirmar
- **Descripción:** `PLAN_MEJORAS.md` puntos marcados "sin verificar": 1.10 (triple render al guardar), 2.3 (código muerto
  en `index.html` y `engine.js`), 3.x y 4.x no revisados uno por uno.
- **Aceptación:** cada punto marcado como resuelto, descartado o convertido en tarea.

```
bd create "BL-14: Verificar los puntos sin confirmar del plan de mejoras antiguo" -p 3
```

### BL-15 Integración continua
- **Descripción:** ejecutar `bash tests/run.sh` en cada pull request (GitHub Actions con Playwright).
- **Aceptación:** el flujo falla si la prueba de humo falla.

```
bd create "BL-15: Integracion continua con la prueba de humo" -p 3
```

### BL-16 Accesibilidad automática con axe
- **Descripción:** `tests/e2e/a11y-report.js` es un informe propio con heurísticas. Cuando haya acceso de red, sumar axe-core
  como aserción.
- **Aceptación:** cero violaciones de nivel serio o crítico en las 5 vistas, en ambos temas.

```
bd create "BL-16: Aserciones de accesibilidad con axe" -p 3
```

## Resuelto en esta ronda (para contexto)

Interfaz ordenada en pasos, modales corregidos, contraste y bordes, tabletas, conversión de unidades, calculadora de ANC,
monografía rápida, esquema de monitoreo seleccionable, leucocitos informativos, alertas con jerarquía y divulgación
progresiva, fondo animado eliminado, importación segura, accesibilidad básica. El detalle está en el historial de git de
la rama `claude/interface-navigation-usability-wsbkov`.
