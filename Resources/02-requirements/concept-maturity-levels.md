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
| 6 | Integrated Concept | Más detalle técnico, de gestión y coste (Concept Study Report Step 2). **[DISCREPANCIA]** |
| 7 | Preliminary Implementation Baseline | Requisitos preliminares de sistema/subsistema, márgenes demostrados, prototipos, riesgos y mitigaciones. **[DISCREPANCIA]** |
| 8 | PDR | Nivel de Preliminary Design Review. **[DISCREPANCIA]** |
| 9 | CDR | Nivel de Critical Design Review. **[DISCREPANCIA]** |

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
- **A-Team:** CML 1–3 **[DISCREPANCIA]**; generación de ideas, viabilidad, arquitecturas, trazabilidad científica. Herramientas de coste de baja fidelidad adecuadas al nivel (en CML 2 basta con saber la clase de coste).
- **Team X** (desde 1995, >1000 estudios): **CML 4 point design**, normalmente **3 sesiones colaborativas en una semana**, con resultados de diseño de misión, nave, coste y riesgo.
- Clases de misión: Explorer, Discovery, New Frontiers, Flagship.

## Acrónimos útiles
AO (Announcement of Opportunity) · C&DH (Command & Data Handling) · GDS (Ground Data System) · I&T (Integración y pruebas) · L/V (lanzador) · MEL (Master Equipment List) · MOS (Mission Operations System) · QQCL (Quantity, Quality, Continuity, Latency) · TRL (Technology Readiness Level) · WBS (Work Breakdown Structure).

## Qué nos aporta para el juego
- **Progresión por niveles de madurez** como estructura de rondas: Servilleta → Viabilidad → Compromisos → Diseño puntual.
- **Semáforo verde/amarillo/rojo** y umbral del 80 % como mecánica de "¿está lista mi misión para avanzar?".
- **Bucle de iteración**: permitir volver atrás y re-simular es fiel a la realidad.
- Puntuación inspirada en **retorno científico vs. coste vs. riesgo**, y **márgenes/reservas** como parte del éxito.

---

## Ficha anterior del equipo (antes Resources/02-concept-maturity-levels-cml.md, fusionada)

Esta fuente tenía dos fichas. Lo de arriba es la ficha de alee, la más nueva. Lo de abajo es la ficha del equipo, copiada sin cambios salvo el nivel de los títulos, para no perder ningún dato, etiqueta ni pendiente. Título original: "Niveles de madurez conceptual (CML, Concept Maturity Levels)".

### Discrepancias entre las dos fichas

Cada **[DISCREPANCIA]** de arriba remite a esta lista. No se eligió ninguna versión: confirmar en la fuente.

- **Acceso a la fuente.** Esta ficha resume el PDF del paper (`../pdf/13-3547_A1b.pdf`). Ficha del equipo: "**No se pudo leer ninguna fuente original.**" Sus niveles vienen de fuentes secundarias y están [SIN VERIFICAR].
- **Escala.** Esta ficha: 9 niveles, con nombres para CML 1 a 9. Ficha del equipo: "La escala es de 5 o de 9 niveles", "Usen la escala de 9 niveles, pero confirmen los nombres de CML 6 a 9 en la fuente original".
- **CML 6.** Esta ficha: "Integrated Concept: Más detalle técnico, de gestión y coste (Concept Study Report Step 2)". Ficha del equipo: "Útil sobre todo para conceptos impulsados por anuncios de oportunidad (AO)".
- **CML 7.** Esta ficha: "Preliminary Implementation Baseline". Ficha del equipo: "Línea base integrada", necesaria para la PMSR o la MDR.
- **CML 8 y 9.** Esta ficha: "PDR" y "CDR". Ficha del equipo: "Niveles de diseño avanzado y de implementación. Las descripciones exactas no se leyeron de la fuente."
- **A-Team.** Esta ficha: "A-Team: CML 1–3". Ficha del equipo: "El Architecture Design Laboratory de Goddard y el A-Team de JPL son instalaciones de CML 2 y 3" (documento de NASA de 2017), aunque cita también un documento del A-Team con métodos para CML 1, 2 y 3.

**Enlace fuente solicitado:** https://dataverse.jpl.nasa.gov/dataset.xhtml?persistentId=hdl:2014/44299
**Estado de acceso:** la página de Dataverse está bloqueada por `robots.txt`. El repositorio de JPL dio error del servidor en dos intentos el 14 de noviembre de 2026. **No se pudo leer ninguna fuente original.** La referencia bibliográfica y la descripción vienen de búsquedas y tienen estado [SIN VERIFICAR].
**Fuente abierta alternativa:** https://trs.jpl.nasa.gov/handle/2014/44299
**Fecha de consulta:** 14 de noviembre de 2026

---

### 1. Qué es el marco CML

Los Niveles de Madurez Conceptual son un marco de JPL para medir y comunicar la madurez de un concepto de misión espacial antes de que entre en las fases formales de formulación. La referencia principal es Wessen, Borden, Ziemer y Kwok (2013), "Space mission concept development using concept maturity levels", presentada en la conferencia AIAA SPACE 2013 en San Diego.

Según el repositorio de JPL, el método lo desarrolló un grupo de expertos en pre-formulación del JPL durante unos cinco años antes de 2013. Los equipos de desarrollo de conceptos lo usan, junto con sus herramientas asociadas, antes de que el concepto entre a las fases A/B.

La idea es parecida a los Niveles de Madurez Tecnológica (TRL), pero en lugar de medir una tecnología aislada, los CML miden todo el concepto de misión: objetivos científicos, diseño técnico, gestión y costo.

### 2. Niveles (información de fuentes secundarias y de referencias citadas)

Los niveles completos no se pudieron leer de la fuente original. Lo que sigue combina tres fuentes de búsqueda; las discrepancias se indican.

| Nivel | Nombre | Descripción según las fuentes |
|---|---|---|
| CML 1 | Idea inicial ("initial cartoon" / "cocktail napkin") | Las preguntas científicas están articuladas, se proponen las observaciones necesarias y existe un boceto del concepto y sus objetivos de alto nivel. Se captura lo que hace única la idea. |
| CML 2 | Factibilidad inicial | Se cuestiona la idea desde la ciencia, lo técnico y lo programático. Se especifican objetivos de nivel inferior, se cuantifican parámetros clave y se hacen cálculos básicos (física, masa y costo de alto nivel). |
| CML 3 | Espacio de compensaciones (trade space) | Se exploran objetivos científicos y compensaciones entre sistema de nave, sistema terrestre y diseño de misión, para entender la relación entre retorno científico, costo y riesgo. |
| CML 4 | Diseño de punto (point design) | Diseño preferido en el que el diseño y el costo dan la ciencia deseada. El sistema y sus subsistemas tienen márgenes y reservas aceptables. Las compensaciones de misión, sistema y subsistema ya se hicieron. Es el nivel que se requiere para un estudio de misión (Mission Study Report). |
| CML 5 | Línea base del concepto (Concept Baseline) | La estrategia de implementación está definida, con socios y planes de prueba. Es requisito para una propuesta de paso 1 en misiones competitivas de la NASA. |
| CML 6 | Útil sobre todo para conceptos impulsados por anuncios de oportunidad (AO) | Representa el nivel de contenido del concepto para ese tipo de misiones. |
| CML 7 | Línea base integrada | Requisitos y análisis preliminares a nivel de sistema y subsistema. Es necesario para la revisión preliminar del sistema de misión (PMSR) en misiones competidas y para la revisión de definición de misión (MDR) en proyectos asignados. |
| CML 8 y 9 | Niveles de diseño avanzado y de implementación | Acercan el concepto a su diseño final. Las descripciones exactas no se leyeron de la fuente. |

**Discrepancias:**
- Un artículo de la NASA Innovative Advanced Concepts de 2026 describe solo los niveles 1 a 5. Otra fuente dice que la escala va de 1 a 9. Un artículo de AIAA de 2010 habla de nueve niveles. **Usen la escala de 9 niveles**, pero confirmen los nombres de CML 6 a 9 en la fuente original.
- Una fuente de 2026 llama al nivel 1 "Cocktail Napkin", mientras que la de 2010 lo llama "Initial Cartoon". Son nombres informales del mismo nivel.

### 3. Quién trabaja en qué nivel [SIN VERIFICAR]

Según un documento de guía de NASA de 2017 (Expanded Guidance for NASA Systems Engineering):
- **Team X** (JPL) y **COMPASS** (Glenn) son equipos de CML 4.
- El **Architecture Design Laboratory** de Goddard y el **A-Team** de JPL son instalaciones de CML 2 y 3.
- Un proyecto típico trabaja de CML 5 a CML 9.

Según un documento del A-Team de JPL, sus métodos se agrupan por nivel: generación y captura de ideas (CML 1), factibilidad inicial (CML 2) y exploración del espacio de compensaciones (CML 3).

### 4. Relación con las fases de la NASA

- Pre-Fase A y Fase A: CML 1 a 4.
- Fase B: CML 5 a 7 (definición preliminar).
- Fases C y D: CML 8 y 9 (diseño final y fabricación).

Esta correspondencia es un resumen de las fuentes secundarias. No pude confirmar la tabla oficial.

### 5. Relación con las herramientas de diseño del juego

- **El CML es una barra de progreso.** El jugador empieza en CML 1 con una idea y sube de nivel al completar decisiones.
- **Requisitos por nivel.** Para subir de CML 2 a CML 3, por ejemplo, el jugador debe haber cuantificado masa, potencia y costo. Para subir a CML 4, debe tener un diseño con márgenes aceptables.
- **Relación con el juego Webb.** El juego Webb no usa CML, pero su estructura (elegir ciencia y luego decidir diseño) corresponde a CML 1 a 3.
- **Recomendación:** usen CML 1 a 4 para el juego. Son los niveles que cubren el diseño de la misión, que es el alcance del reto.

### 6. Pendientes

- [ ] Leer la definición oficial de cada nivel desde el repositorio de JPL (la página de Dataverse está bloqueada, pero el repositorio abierto sí tiene el trabajo).
- [ ] Confirmar la escala exacta (5 o 9 niveles).
- [ ] Confirmar los requisitos de entrada para el Point Design Study del Goddard MDL (ver archivo 03).

### 7. Cómo citar

Wessen, R. R., Borden, C., Ziemer, J., & Kwok, J. (2013). Space mission concept development using concept maturity levels. AIAA SPACE 2013 Conference & Exposition, San Diego, CA. JPL Open Repository. https://hdl.handle.net/2014/44299
