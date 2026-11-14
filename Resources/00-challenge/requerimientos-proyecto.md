# 08. Requerimientos del proyecto: Space Mission Design Game

**Propósito:** lista de lo que el proyecto debe cumplir para ser evaluado y elegible para premios. Cada requisito indica su origen y su estado de verificación.

**Revisado:** 14 de noviembre de 2026.

**Fuentes y su estado:**
- **Enunciado completo** (`Enunciado.md`, copia entregada por el equipo). Leído. Fuente de los requisitos del reto. [VERIFICADO-ENUNCIADO]
- **Guía de envío** (spaceappschallenge.org/resources/project-submission-guide/). Leída. Fechas de 2025. [VERIFICADO-GUÍA]
- **Guía de jueceo y premios** (spaceappschallenge.org/resources/judging-awards-guide). Leída. Fechas de 2024. [VERIFICADO-GUÍA]
- **Términos y condiciones 2026** (spaceappschallenge.org/legal/). No leídos. [SIN VERIFICAR]
- **Reto oficial en spaceappschallenge.org.** Bloqueado por robots.txt. [SIN VERIFICAR]

Cuando el enunciado dice "could", "may" o "might", el requisito es **sugerido**. Cuando dice "must", "required" o "eligibility" en la guía, es **obligatorio**.

---

## A. Requisitos del reto (enunciado)

| ID | Requisito | Origen | Notas |
|---|---|---|---|
| A1 | Crear un **juego interactivo** de diseño de misiones espaciales. | [VERIFICADO-ENUNCIADO] "Your challenge is to create an interactive game" | Debe ser utilizable por una persona, no solo un modelo de cálculo. |
| A2 | Permitir **diseñar, gestionar y simular** una misión espacial completa. | [VERIFICADO-ENUNCIADO] | Interpretación: deben existir las tres partes. El enunciado dice "allows". |
| A3 | Hacer **decisiones de ingeniería** con consecuencias. | [VERIFICADO-ENUNCIADO] | Cada decisión importante debe tener efecto visible en otra parte. |
| A4 | **Gestionar recursos limitados.** | [VERIFICADO-ENUNCIADO] | Masa, potencia, presupuesto, datos, comunicaciones y tiempo, según el enunciado. |
| A5 | **Evaluar** cómo cada decisión afecta el éxito de la misión. | [VERIFICADO-ENUNCIADO] | Requiere un sistema de evaluación, no solo una pantalla de resultado. |
| A6 | Permitir que el jugador **defina un objetivo de misión**. | [VERIFICADO-ENUNCIADO] redactado como "could" | Interpretación: el objetivo es la base del reto. Tratarlo como obligatorio es una decisión de diseño. |

### A7 y A8: requisitos NO confirmados

- **A7 (usar datos o recursos de NASA):** en la versión anterior se marcaba como requisito de elegibilidad para premios globales. **La guía leída no lo dice.** Lo que sí dice es que todo recurso externo, incluidos código, texto e imágenes, debe listarse en "References". Confirmar la regla de elegibilidad. [SIN VERIFICAR]
- **A8 (responder a un reto oficial):** la versión anterior citaba una regla de la guía de jueceo sobre "Create Your Own Challenge". **No aparece en las guías leídas.** [SIN VERIFICAR]

## B. Elementos sugeridos por el enunciado [VERIFICADO-ENUNCIADO]

El enunciado dice que pueden considerarse. No son obligatorios, pero el jurado los verá como señales de solución completa.

### B1. Diseño y experiencia de juego
- Accesible para personas con distintos niveles de conocimiento espacial.
- Modo individual y en equipo, con hasta cuatro personas.
- Roles de equipo: planificación, diseño de nave, ciencia, comunicaciones y recursos.
- Objetivos y retroalimentación claros que expliquen por qué la misión funciona o falla.
- Puntaje que recompense éxito, valor científico, uso eficiente de recursos y buenas decisiones.
- Niveles de dificultad, tipos de misión o escenarios.

### B2. Diseño de misión
- Empezar por el objetivo de la misión antes de las decisiones de ingeniería.
- Cada decisión importante tiene una consecuencia (por ejemplo, más instrumentos suman valor científico y también masa, potencia, datos y costo).
- Varias combinaciones distintas pueden cumplir el mismo objetivo.
- Restricciones realistas: presupuesto, masa, potencia, comunicaciones y tiempo de vida.

### B3. Nave e instrumentos
- Componentes: estructura, potencia, baterías, comunicaciones, computadora, control de actitud e instrumentos.
- Instrumentos con masa, potencia, costo, generación de datos y valor científico distintos.
- Opción entre componentes simples y avanzados según la dificultad.

### B4. Órbita y lanzamiento
- Varias órbitas con explicación básica.
- Efecto de la órbita en cobertura, observación, comunicaciones y tiempo de vida.
- Lanzadores con capacidad, costo y alcance orbital distintos.
- Validación recomendada: masa de la nave y órbita compatibles con el lanzador.

### B5. Recursos
- Mostrar claramente los recursos disponibles durante la misión.
- Identificar cuáles son críticos para cada misión.

### B6. Colaboración
- Modo de equipo con hasta cuatro participantes.
- Roles distintos con decisiones colectivas.
- Situaciones en las que el equipo negocia prioridades.
- Resultado que depende de cómo coordina el equipo.

### B7. Valor educativo
- Explicaciones en lenguaje sencillo.
- Conceptos como altitud orbital, capacidad de carga, consumo de potencia, tasa de datos y comunicaciones, introducidos en el juego.
- Tutoriales, indicadores visuales o recursos opcionales.
- Explicar **por qué** una decisión afecta el desempeño.

### B8. Funciones adicionales posibles
- Varios escenarios con objetivos distintos.
- Eventos aleatorios o restricciones inesperadas.
- Niveles de dificultad.
- Modelos de nave realistas o simplificados.
- Visualizaciones interactivas de la nave.
- Dashboards de consumo de recursos en tiempo real.
- Tabla de posiciones o rankings.
- Reporte de misión al final de cada simulación.
- Guardar, compartir y comparar diseños.
- Modo cooperativo (hasta cuatro) o competitivo entre equipos.
- Modo libre (sandbox).
- Análisis posterior a la misión que explique por qué tuvo éxito o falló.

## C. Requisitos de envío y documentación

| ID | Requisito | Origen | Estado |
|---|---|---|---|
| C1 | Todos los miembros deben ser participantes confirmados del mismo evento local. | Guía de envío | [SIN VERIFICAR] no aparece en la guía leída |
| C2 | Envío antes de la fecha límite. El envío es final ("submission is final"). Los envíos tardíos no son elegibles. | Guía de envío | [VERIFICADO-GUÍA] |
| C3 | Todo el contenido del formulario en **inglés**. | Guía de envío y términos | [SIN VERIFICAR] en la guía leída; confirmar |
| C4 | Campos del formulario: nombre del proyecto, resumen de alto nivel, enlace a la demo, enlace al proyecto final, descripción detallada, datos de NASA, datos de agencias socias y otros (lista de recursos), uso de IA y verificación del envío. | Guía de envío | [VERIFICADO-GUÍA] |
| C5 | **Demo:** video de hasta 30 segundos con subtítulos en inglés, **o** presentación de hasta siete diapositivas (incluida la de título) en inglés. Los proyectos que excedan el límite no son elegibles para jueceo global. | Guía de envío | [VERIFICADO-GUÍA] |
| C6 | Videos y documentos no se suben al sitio de NASA; se alojan en un servicio externo con enlace público, sin contraseña ni registro. Las imágenes sí se suben (JPG, PNG o GIF, hasta 10 MB). | Guía de envío | [VERIFICADO-GUÍA] |
| C7 | **Referencias:** cada recurso externo (código, texto e imágenes) debe listarse en el campo "References", aunque sea de código abierto o de libre uso. | Guía de envío y de jueceo | [VERIFICADO-GUÍA] |
| C8 | **Verificación del envío:** aceptar los términos y confirmar que el trabajo es original. | Guía de envío | [VERIFICADO-GUÍA] |
| C9 | **Uso de IA:** permitido, pero debe declararse. Imágenes y videos generados con IA llevan marca visible de agua. El audio, el código y los datos generados con IA se reconocen en el texto y en los metadatos. El contenido generado con IA no puede usar ni modificar la marca o el diseño de NASA. | Guía de envío | [VERIFICADO-GUÍA] |
| C10 | **Material con derechos:** no usar música, imágenes ni texto con copyright sin permiso. | Guía de envío y de jueceo | [VERIFICADO-GUÍA] |
| C11 | **Software de código abierto:** permitido si se respeta su licencia. | Guía de envío | [VERIFICADO-GUÍA] |
| C12 | Contenido prohibido (lenguaje amenazante, ataques personales, promoción comercial, información personal) | Versión anterior | [SIN VERIFICAR] no aparece en la guía leída |
| C13 | Menores de 18 años: solo con acuerdo de padre o tutor legal. | Fuente de organizadores locales de otro país | [SIN VERIFICAR] |

**Advertencia de citas:** la versión anterior decía que NASA puede retirar premios o el estatus de ganador a equipos que no citen sus recursos. **La guía de jueceo leída no lo menciona.** [SIN VERIFICAR]

## D. Criterios de evaluación [VERIFICADO-GUÍA]

La guía de jueceo usa cinco criterios: **Influence**, **Creativity**, **Validity**, **Relevance** y **Presentation**.

| Criterio | Qué mide, según la guía | Qué debe mostrar nuestro juego |
|---|---|---|
| **Influence** | Qué tan lejos puede llegar el proyecto y si ayuda a muchas o pocas personas. | Por qué estudiantes y comunidad necesitan un juego de diseño de misiones. |
| **Creativity** | Qué tan novedoso es el enfoque, frente a una mejora incremental. | Mecánicas propias, como el monitor de salud integrado al diseño de misión. |
| **Validity** | Si la solución es científicamente sólida y funciona en el mundo real. | Números con fuente (masa, presupuesto, órbita) y reglas que representen trade-offs reales. |
| **Relevance** | Qué tan bien responde al reto, qué tan completa y factible es técnicamente, y qué tan usable es. | Cumplir la sección A completa y que el juego sea jugable de principio a fin. |
| **Presentation** | Qué tan bien el equipo comunica el reto, la solución y por qué importa. | Demo clara, diapositivas de siete o menos, subtítulos en inglés. |

**Nota:** la versión anterior decía que los jueces dan peso igual a la presentación. Esa frase no aparece en la guía leída. [SIN VERIFICAR]

## E. Premios globales [VERIFICADO-GUÍA]

La guía de jueceo lista diez categorías: Best Use of Science, Best Use of Data, Best Use of Technology, Galactic Impact, Best Mission Concept, Most Inspirational, Best Storytelling Award, Global Connection Award, Art & Technology Award y Local Impact Award.

Los más cercanos a nuestro juego: **Best Mission Concept**, **Best Use of Science**, **Best Use of Data** y **Best Use of Technology**. [DERIVADO]

Las descripciones de cada premio que aparecían en la versión anterior no se reconfirmaron. [SIN VERIFICAR]

## F. Fechas

- **Evento local de Athlone:** 13 a 15 de noviembre de 2026. [SIN VERIFICAR contra la fuente oficial]
- **Envío de 2026:** apertura y cierre no confirmados. La guía leída trae fechas de 2025: abre el sábado 4 de octubre a las 9:00 a. m. y cierra el domingo 5 de octubre a las 11:59 p. m., hora del evento local. [VERIFICADO-GUÍA, de 2025]
- **Apertura de envío el 14 de noviembre a las 9:00 a. m.:** viene de un resumen de terceros. [SIN VERIFICAR]
- **Inicio del jueceo el 16 de noviembre:** viene de un sitio de terceros. [SIN VERIFICAR]
- **Anuncios de premios** (diciembre de 2026 y enero de 2027): la guía leída trae fechas de 2024 (nominados el 29 de octubre, finalistas el 19 de noviembre, ganadores el 16 de enero). [VERIFICADO-GUÍA, de 2024]
- **Pendiente:** confirmar en el sitio del evento local la hora de cierre de 2026.

## G. Matriz de cumplimiento

| Requisito | Decisión de diseño | Estado |
|---|---|---|
| A1 Juego interactivo | Interfaz web con decisiones por fases | Pendiente |
| A2 Diseñar, gestionar y simular | Fases: concepto, definición, diseño, fabricación y pruebas, lanzamiento, operaciones | Pendiente |
| A3 Decisiones de ingeniería | Opciones de nave, instrumentos, lanzador, órbita, presupuesto y licencias | Pendiente |
| A4 Recursos limitados | Masa, potencia, presupuesto, datos, comunicaciones, tiempo | Pendiente |
| A5 Evaluación | Puntaje por éxito, costo, valor científico y salud de la tripulación | Pendiente |
| A6 Objetivo de misión | Selección de objetivo al inicio | Pendiente |
| A7 Datos de NASA | GMAT, CubeSat 101, Mission Viz, MDL, HRP | Parcial: hay fuentes, falta usarlas en el juego |
| A8 Reto oficial | Space Mission Design Game (según el enunciado) | Cumplido según el enunciado |
| C7 Referencias | Lista de todas las fuentes en el campo References | Pendiente |
| C9 Uso de IA | Declarar cada uso de IA en el formulario | Pendiente |
| C5 Demo | Video de 30 s o siete diapositivas | Pendiente |
| D Validity | Números con fuente, marcados como verificados o derivados | Parcial: ver `pendientes.md` |

## H. Riesgos

- **Alcance:** el enunciado pide muchos elementos. Priorizar A1 a A6 antes de cualquier función de B8.
- **Datos de salud:** no son fuente de datos reales. Presentarlos como simulación.
- **Recursos nuevos:** el enunciado dice que pueden agregarse recursos antes del hackathon. Revisar la pestaña de recursos durante el evento.
- **Citas incompletas:** la falta de citas en "References" es un riesgo. Llevar la lista desde el inicio.
- **Demo de 30 segundos o siete diapositivas:** poco espacio. Planear la demo desde el principio.
- **Módulo de salud:** el enunciado no lo pide. Es una decisión de diseño del equipo.

## I. Lista de verificación final

- [ ] Requisitos A1 a A6 cumplidos y probados.
- [ ] Al menos un recurso de NASA usado y explicado en la descripción.
- [ ] Campo References completo con todas las fuentes.
- [ ] Casilla de verificación del envío marcada solo si es cierto.
- [ ] Uso de IA declarado, si aplica.
- [ ] Demo de 30 segundos con subtítulos en inglés, o siete diapositivas en inglés.
- [ ] Videos y documentos alojados con enlace público sin inicio de sesión.
- [ ] Todo el formulario en inglés.
- [ ] Todos los miembros confirmados en el mismo evento local.
- [ ] Envío realizado antes de la fecha límite de su evento local.
- [ ] Sin material con derechos de autor, sin datos personales y sin contenido prohibido.
