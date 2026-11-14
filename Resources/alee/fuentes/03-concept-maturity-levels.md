# Concept Maturity Levels (CML) – JPL

> Resumen de [`../pdf/13-3547_A1b.pdf`](../pdf/13-3547_A1b.pdf): *Space Mission Concept Development Using Concept Maturity Levels*, R. Wessen, C. Borden, J. Ziemer, J. Kwok (JPL/Caltech, 2013).
> Enlaces: https://dataverse.jpl.nasa.gov/dataset.xhtml?persistentId=hdl:2014/44299 · https://trs.jpl.nasa.gov/bitstream/handle/2014/44299/13-3547_A1b.pdf
> Nota: la matriz CML y la checklist CML 4 (figuras 3–8) son **imágenes** en el PDF; su contenido no está en texto. Consultarlas directamente en el PDF.

## Idea
Escala para **medir y comunicar la madurez de un concepto de misión** antes de la fase formal de formulación (Pre-Fase A). Permite saber cuánto trabajo lleva un concepto, cuándo conviene explorar alternativas, comparar conceptos con igual madurez y cuánto falta para el siguiente nivel.

## Los niveles
| CML | Nombre | Qué se ha logrado |
|---|---|---|
| 1 | **Cocktail Napkin** ("servilleta") | Preguntas científicas bien formuladas, tipo de observaciones necesarias, boceto del concepto y objetivos de alto nivel. Qué hace única la idea. |
| 2 | **Initial Feasibility** | Se cuestiona la viabilidad (científica, técnica, programática). Objetivos de bajo nivel, **parámetros clave de rendimiento cuantificados**, cálculos básicos de primer orden. |
| 3 | **Trade Space** | Exploración alrededor de los objetivos y **compromisos de arquitectura** entre nave, segmento de tierra y diseño de misión: relación entre **retorno científico, coste y riesgo**. |
| 4 | **Point Design** | Diseño y coste concretos que devuelven la ciencia deseada, definidos hasta subsistemas principales **con márgenes y reservas aceptables**. |
| 5 | Baseline Concept | Enfoque de implementación (socios, contratación, integración y pruebas, coste, calendario). Nivel de una propuesta Step 1 / Mission Concept Review. |
| 6 | Integrated Concept | Más detalle técnico, de gestión y coste (Concept Study Report Step 2). |
| 7 | Preliminary Implementation Baseline | Requisitos preliminares de sistema/subsistema, márgenes demostrados, prototipos, riesgos y mitigaciones. |
| 8 | PDR | Nivel de Preliminary Design Review. |
| 9 | CDR | Nivel de Critical Design Review. |

**Bucle iterativo entre CML 2–4:** el diseño no es lineal. Si el point design falla, se vuelve a la exploración del espacio de soluciones. Saltarse la exploración llevaba a misiones con menor retorno científico, diseños ineficientes de nave y tierra y peor concepto global. Hay que entender las **"derivadas científicas"**: cómo cambia el retorno científico con un parámetro (masa, volumen de datos, periodo orbital…).

## Matriz CML
7 columnas (CML 1–7) × **24 filas** agrupadas como NASA evalúa los conceptos (revisión científica + revisión **TMCO**: Technical, Management, Cost, Other):
- **Ciencia (2):** objetivos científicos (*por qué*) y productos de datos (*qué se produce*).
- **Técnicas (13):** diseño concurrente de misión, nave y segmento de tierra como un sistema integrado.
- **Gestión (5).**
- **Coste (1):** estimación, incertidumbre, sensibilidades a lo largo del espacio de soluciones, validación y reservas.
- **Otros (3):** aspectos programáticos que suelen olvidarse y causan sobrecostes.

En CML 1 solo se consideran: objetivo científico, características únicas, fecha aproximada de lanzamiento y **clase de coste objetivo**.

## Checklists CML (2–6)
- Tres columnas: área funcional, criterio, estado (**Verde** = hecho, **Amarillo** = en curso, **Rojo** = no empezado).
- Un concepto está en un CML si **~80 % de los atributos están en verde**, aplicando juicio de ingeniería (un 90 % sin matriz de trazabilidad científica, requisitos de nivel 1 ni MEL no es robusto).
- Limitaciones: mide completitud, no calidad; no pondera atributos; la **autoevaluación es optimista** → usar evaluador independiente.
- Los equipos no tienen recursos para corregir todo: deben **priorizar** qué carencias atacar.

## Uso en JPL
- **A-Team:** CML 1–3; generación de ideas, viabilidad, arquitecturas, trazabilidad científica. Herramientas de coste de baja fidelidad adecuadas al nivel (en CML 2 basta con saber la clase de coste).
- **Team X** (desde 1995, >1000 estudios): **CML 4 point design**, normalmente **3 sesiones colaborativas en una semana**, con resultados de diseño de misión, nave, coste y riesgo.
- Clases de misión: Explorer, Discovery, New Frontiers, Flagship.

## Acrónimos útiles
AO (Announcement of Opportunity) · C&DH (Command & Data Handling) · GDS (Ground Data System) · I&T (Integración y pruebas) · L/V (lanzador) · MEL (Master Equipment List) · MOS (Mission Operations System) · QQCL (Quantity, Quality, Continuity, Latency) · TRL (Technology Readiness Level) · WBS (Work Breakdown Structure).

## Qué nos aporta para el juego
- **Progresión por niveles de madurez** como estructura de rondas: Servilleta → Viabilidad → Compromisos → Diseño puntual.
- **Semáforo verde/amarillo/rojo** y umbral del 80 % como mecánica de "¿está lista mi misión para avanzar?".
- **Bucle de iteración**: permitir volver atrás y re-simular es fiel a la realidad.
- Puntuación inspirada en **retorno científico vs. coste vs. riesgo**, y **márgenes/reservas** como parte del éxito.
