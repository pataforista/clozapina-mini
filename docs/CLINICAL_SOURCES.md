# Fuentes clínicas de CLZ Mini y estado de verificación

Cada regla que muestra la app, con su fuente y qué tan verificada está. Última revisión: **24 de noviembre de 2026**.
La app es un **apoyo a la decisión**: no sustituye el juicio clínico ni los protocolos institucionales.

**Estados**
- **Verificado en el documento**: se leyó el texto de la fuente y coincide.
- **Verificado en el resumen**: se confirmó en el resumen o abstract; falta leer el texto completo.
- **Sin verificar**: el valor viene del proyecto original o de memoria; no hay fuente confirmada.
- **Revisión clínica pendiente**: lo debe validar un clínico (ver `BL-01`).

## Fuentes consultadas

| Clave | Fuente | Notas |
|---|---|---|
| **FDA** | Ficha de Clozaril (clozapina), FDA, revisión 1/2025, ref. 5515510 | Leída completa. Anterior al retiro del REMS (junio 2025): su advertencia aún menciona el programa. |
| **FDA-REMS** | FDA, "FDA removes REMS program for clozapine" (13 jun 2025) y página "Information on Clozapine" | Fecha de vigencia confirmada. El monitoreo de ANC sigue recomendado. |
| **Delphi-ANC** | Siskind D, et al. *Lancet Psychiatry* 2026;13(1):77-86. DOI 10.1016/S2215-0366(25)00098-7 | Leído el texto completo. Publicado en línea el 2 jul 2025. |
| **Delphi-Mio** | Wagner EM, et al. *Br J Psychiatry* 2026;228(4):348-356. DOI 10.1192/bjp.2025.89 | Leído el texto completo (PMC13051212). |
| **EMA-DHPC** | Comunicado DHPC sobre clozapina, EMA (acordado por PRAC el 10/07/2025) | **Borrador con campos de plantilla** (`<Date>`, `<National Competent Authority>`). Falta la versión final. |
| **Gen-Clozapine** | Guía de monitoreo hematológico de Gen-Clozapine (Viatris/Mylan, Canadá, 2022) | Resumen de la monografía canadiense; no es la monografía completa. |
| **Consensus-2026** | Síntesis de literatura de Consensus sobre eosinofilia y trombocitopenia | Secundaria y generada automáticamente; solo apoyo. |

Los documentos en sí no se versionan en el repositorio por derechos de autor. Se citan aquí.

## Reglas de la app

### Neutrófilos (ANC)

| Regla | Valor en la app | Fuente | Estado |
|---|---|---|---|
| ANC basal para iniciar | ≥ 1.5 (general); ≥ 1.0 (BEN) x10³/µL | FDA 2.1 y 5.1; EMA-DHPC | Verificado en el documento |
| Neutropenia grave | < 0.5 | FDA 5.1 | Verificado en el documento |
| Considerar suspender | < 1.0 (general); < 0.5 (BEN / DARC-null) | Delphi-ANC; EMA-DHPC; FDA (interrumpir con 0.5–0.99 en general) | Verificado en el documento (EMA: borrador) |
| Umbrales de la guía canadiense | Más conservador: rojo < 1.5 | Gen-Clozapine | Informativo; la app no lo usa |
| Frecuencia, esquema FDA (por defecto) | Semanal hasta 6 meses; cada 2 semanas de 6 a 12; mensual después | FDA 5.1, Tabla 2 | Verificado en el documento |
| Frecuencia, esquema EMA | Semanal 18 semanas; mensual hasta la semana 52; cada 12 semanas; anual tras 2 años sin neutropenia | EMA-DHPC | Verificado (borrador). "Historia de neutropenia" = cualquier ANC bajo el rango normal registrado: aproximación del proyecto |
| Frecuencia, esquema Delphi | Semanal 18 semanas; cada 4 semanas hasta 2 años; luego sin ANC de rutina y revisión de efectos adversos cada 3 meses | Delphi-ANC | Verificado en el documento |
| ANC en vigilancia o crítico | Sugiere control cada 3 días en cualquier esquema | Criterio del proyecto (FDA: 3 veces por semana en neutropenia leve) | Revisión clínica pendiente |
| Confirmar con segundo ANC en 24 h | Texto en la monografía rápida | FDA 5.1 | Verificado en el documento |
| Norma mexicana | No se identificó una norma nacional específica | Búsqueda web; confirmado por el usuario | Prevalece el protocolo institucional (ver `BL-04`) |

### Otras células

| Regla | Valor en la app | Fuente | Estado |
|---|---|---|---|
| Leucocitos bajos (< 3.0) | **Solo informativo**; no cuenta para el riesgo global | EMA-DHPC (se eliminó su monitoreo); FDA (el ANC es más relevante) | Verificado (EMA: borrador) |
| Eosinofilia: vigilar | > 0.7 x10³/µL; manejo según compromiso de órganos | FDA 5.9 | Verificado en el documento |
| Eosinofilia: alerta alta | > 3.0, reiniciar solo bajo 1.0 (configurable) | Gen-Clozapine. **No figura en la ficha FDA** | Verificado en el resumen de la monografía canadiense |
| Plaquetas: alerta alta | < 50 (configurable) | Gen-Clozapine. **No figura en la ficha FDA** | Verificado en el resumen de la monografía canadiense |
| Eosinofilia o trombocitopenia aisladas suelen ser benignas | Texto de apoyo | Consensus-2026 | Fuente secundaria |

### Fiebre y corazón

| Regla | Valor en la app | Fuente | Estado |
|---|---|---|---|
| Fiebre | ≥ 38.5 °C: solicitar ANC y considerar interrumpir como precaución | FDA 5.1 | Verificado en el documento |
| Miocarditis: conducta | Ante sospecha, suspender y obtener evaluación cardíaca | FDA 5.6 | Verificado en el documento |
| Miocarditis: cuándo | Sobre todo en los primeros 2 meses; la app usa las primeras 8 semanas | FDA 5.6; Delphi-Mio (aparición típica en el primer mes) | Verificado en el documento |
| Síntomas que alertan | Dolor torácico, disnea, palpitaciones, síntomas gripales, mal estado, fiebre | FDA 5.6; Delphi-Mio | Verificado en el documento |
| Taquicardia sola | Alerta suave; **no** activa el aviso de PCR/troponina | Delphi-Mio (valor diagnóstico bajo) | Verificado en el documento |
| PCR y troponina | Campos opcionales; la app solo las **registra y sugiere**, sin umbrales | Delphi-Mio (hs-troponina y PCR semanales en las semanas 1–4 como mínimo; no obligatorio en todos los países) | Verificado en el documento. **La ficha FDA no las menciona** |
| Eosinofilia como marcador tardío de miocarditis | Texto en la alerta de eosinofilia | Delphi-Mio | Verificado en el documento |

### Interacciones y efectos adversos (`engine.js`)

| Regla | Valor en la app | Fuente | Estado |
|---|---|---|---|
| Ajuste con inhibidores de CYP1A2 / inductores | Monografía rápida: tabla de la ficha | FDA 2.6, Tabla 1 | Verificado en el documento |
| **Fluvoxamina** | `engine.js`: "reducción crítica de dosis (~75–90 %)" | La ficha indica **usar un tercio de la dosis** (≈ 67 % de reducción) | **Discrepante. Revisión clínica pendiente (`BL-02`)** |
| Cese del tabaquismo | `engine.js`: niveles pueden subir "2–3 veces en 6–12 días"; reducir "~30–50 %" | La ficha solo indica vigilar reacciones adversas y considerar reducir | **Sin verificar (`BL-02`)** |
| Cafeína (> 3 tazas) | `engine.js`: mantener consumo constante | FDA 2.6 (inhibidor débil o moderado de CYP1A2) | Parcial |
| Estreñimiento / íleo | Alerta con días sin evacuar y dolor | FDA 5.8 | Verificado en el documento (umbrales de días: criterio del proyecto) |
| Reacciones frecuentes (monografía rápida) | Sedación, mareo, cefalea, temblor, taquicardia, hipotensión, sialorrea, estreñimiento, fiebre | FDA, reacciones ≥ 5 % | Verificado en el documento |
| Dosificación (monografía rápida) | 12.5 mg inicio; 300–450 mg al final de 2 semanas; máximo 900 mg; reinicio tras omisiones | FDA 2.2 a 2.5 | Verificado en el documento |

## Cómo agregar o cambiar una regla

1. Localiza o crea la fuente y léela (no uses resúmenes secundarios como única base).
2. Escribe la alerta con `add(...)` incluyendo `source`. Si el valor es configurable, indícalo.
3. Añade la fila aquí con su estado y, si dudas, abre una tarea de revisión clínica.
4. Agrega una comprobación en `tests/e2e/smoke.js`.
