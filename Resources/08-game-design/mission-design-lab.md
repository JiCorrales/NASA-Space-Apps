# Mission Design Lab (MDL) – NASA Goddard Integrated Design Center

> Fuentes (leídas 2026-11-14; las páginas indican "Page Last Updated: Jul 23, 2026" y un aviso de que no se actualizan por falta de financiación federal):
> - https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/
> - https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/instrument-design-lab/
> - https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/

## Qué es
- **IDC (Integrated Design Center):** instalación de **ingeniería concurrente multidisciplinar** de Goddard, especializada en el diseño conceptual rápido de misiones e instrumentos. Creada en 1997. Tres laboratorios: **MDL** (misiones) e **IDL** (instrumentos) en Greenbelt (MD), y **MPL** (Mission Planning Lab) en Wallops. **[DISCREPANCIA]**
- Beneficios: evaluación temprana de riesgos y exploración del espacio de soluciones, ingeniería de sistemas desde el inicio, evaluación técnica independiente, ciclos de desarrollo rápidos.
- **MDL:** entorno colaborativo (personas + proceso + herramientas + instalación) para diseño y análisis conceptual **de extremo a extremo** de misiones.
- Cada laboratorio tiene un equipo núcleo (Team Leads + Lead Systems Engineer) y los estudios se completan con expertos de toda la dirección de ingeniería.

## Niveles de estudio
Los estudios se adaptan para madurar conceptos **de CML 1 a CML 4** (ver [`../02-requirements/concept-maturity-levels.md`](../02-requirements/concept-maturity-levels.md)).

| Nivel | Duración | Formato / productos |
|---|---|---|
| **Office Hours** | ~1 h, sin preparación | Lluvia de ideas. Identifica los "tall poles" (retos principales) y estudios de compromiso clave; recomienda siguientes pasos y contacto. |
| **Concept Development** | Unas pocas medias jornadas | Viabilidad del concepto, evaluación de riesgos. Alcance según CML. |
| **Tailored Trade Study** | Variable | Concepto, ConOps, resumen de recursos, **árbol de compromisos (trade tree)**, posible coste ROM (orden de magnitud). |
| **Point Design Study** | 6 días (MDL) / 6,5 días (IDL) | CAD, **MEL** (Master Equipment List), modelos de ingeniería, coste. Requisito de entrada: **superar la checklist de CML**. |

## Disciplinas del equipo MDL (16)
Control de actitud · Coste de misión · Propulsión · Aviónica · Diseño mecánico · Fiabilidad · Dinámica de vuelo · Software de vuelo · Sistemas mecánicos · Basura orbital · Entorno de radiación · Estructuras · Comunicaciones · Operaciones de misión · Sistemas de potencia · Térmico.

## Disciplinas del equipo IDL (21)
Contaminación · Costes · Criogenia · Detectores · Electromecánica · Electroóptica/láser · Guiado fino · Software de vuelo · Integración y pruebas · Procesado de datos científicos · Diseño mecánico · RF de microondas · Radiometría · Óptica · Materiales · Radiación · Electrónica de instrumento · Estructuras · Sistemas mecánicos · Protección planetaria · Térmico.

**Cada disciplina entrega:** requisitos, diseño base, alternativas y estudios de compromiso, diagramas funcionales, interfaces, **estimaciones detalladas de masa, potencia y tasa de datos**, riesgos técnicos, problemas, recomendaciones, modelos, costes paramétricos/detallados.

## Elementos de misión considerados (MDL)
- **Órbitas:** LEO, GEO, libración, retrógradas, "drift-away", lunares, espacio profundo. **[DISCREPANCIA]**
- **Arquitecturas:** nave única, constelaciones, vuelo en formación, sistemas distribuidos.
- **Sistema de tierra** (servicios y productos).
- **Acomodación en el lanzador.**
- **Fin de misión:** reentrada controlada/no controlada, aterrizaje, retorno de muestras, etc.

## Instrumentos y entornos (IDL)
- Tipos: telescopios, cámaras, lidar, espectrómetros, polarímetros, coronógrafos, radiómetros, espectrómetros de masas.
- Longitudes de onda: rayos X, gamma, UV, visible, IR, microondas.
- Plataformas: estación espacial, globos, cohetes sonda, UAV; orbitadores, landers, sondas, rovers, retorno de muestras.

## Productos de ejemplo
- **MDL:** diagramas de bloques de la nave, análisis de órbita, análisis de comunicaciones y segmento de tierra, acomodación en lanzador, MEL, empaquetado mecánico/CAD, modelos 3D del observatorio.
- **IDL:** rendimiento óptico, MEL, diseño de mecanismos, CAD, arquitectura eléctrica, modelo térmico.

## Ejemplos
- Concepto AeSI (Artemis-enabled Stellar Imager), estudio IDL.
- **Planetary Science Winter School:** semana final de diseño donde jóvenes científicos diseñan un instrumento planetario (https://svs.gsfc.nasa.gov/12362/).

## Qué nos aporta para el juego
- **Estructura de fases** directamente jugable: *Office Hours → Concept Development → Trade Study → Point Design*.
- **Roles de equipo** a partir de las disciplinas (agrupadas en 4 para hasta 4 jugadores, p. ej.: Ciencia/Instrumentos · Nave (potencia, térmico, estructura, propulsión, ADCS) · Comunicaciones/Operaciones/Tierra · Sistemas/Coste/Riesgo/Lanzamiento).
- La **MEL** (lista de equipos con masa/potencia/coste) es el modelo natural de la "hoja de diseño" del jugador.
- Cada disciplina estima **masa, potencia y tasa de datos** → los recursos centrales del juego.

---

## Ficha anterior del equipo (antes Resources/03-mission-design-lab-goddard.md, fusionada)

Esta fuente tenía dos fichas. Lo de arriba es la ficha de alee, la más nueva. Lo de abajo es la ficha del equipo, copiada sin cambios salvo el nivel de los títulos, para no perder ningún dato, etiqueta ni pendiente. Título original: "Laboratorio de Diseño de Misiones (Mission Design Lab, MDL), Goddard".

### Discrepancias entre las dos fichas

Cada **[DISCREPANCIA]** de arriba remite a esta lista. No se eligió ninguna versión: confirmar en la fuente.

- **Estado de verificación.** Esta ficha leyó las páginas del MDL, del IDL y del IDC y da como hechos los tres laboratorios, las órbitas y los productos. Ficha del equipo: "**Sin verificar:** historia del IDC, pódcast, laboratorios IDL y MPL, órbitas listadas, proceso de solicitud y el contexto histórico".

**Enlace fuente:** https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/
**Agencia:** NASA Goddard, Directorio de Ingeniería y Tecnología (ETD)
**Estado de la fuente:** página oficial leída el 14 de noviembre de 2026. Verificado: tipos de estudio y duración, disciplinas, alcance de CML 1 a 4 y la descripción general. **Sin verificar:** historia del IDC, pódcast, laboratorios IDL y MPL, órbitas listadas, proceso de solicitud y el contexto histórico (secciones 1, 3 a 5).
**Fecha de consulta:** 14 de noviembre de 2026

---

### 1. Qué es

El Mission Design Lab es el laboratorio de diseño de misiones del Centro Integrado de Diseño (Integrated Design Center, IDC) de Goddard. Según la página, es un entorno de ingeniería colaborativo para desarrollar diseños de vuelos espaciales y conceptos de arquitectura. Reúne personas, procesos, herramientas e instalaciones para acelerar el trabajo de diseño según las necesidades de cada cliente.

El IDC es un centro de ingeniería concurrente y multidisciplinario, especializado en diseño conceptual rápido de misiones e instrumentos. Tiene tres laboratorios:
- **Mission Design Lab (MDL):** diseño de misiones y naves.
- **Instrument Design Lab (IDL):** diseño de instrumentos.
- **Mission Planning Lab (MPL):** planificación de misiones, en Wallops.

[SIN VERIFICAR] Según una entrevista del pódcast de NASA con la gerente del IDC, Liz Matson, el laboratorio se usa para que los conceptos "nazcan, se refinen y luego se preparen para vuelo".

### 2. Niveles de estudio

La página describe cuatro tipos de estudio, que dependen del nivel de madurez CML del concepto.

| Tipo de estudio | Duración | Productos | Notas |
|---|---|---|---|
| **Office Hours** | Unos 60 minutos, con poca o ninguna preparación | Lluvia de ideas; identificación de temas críticos y de estudios de compensación clave; próximos pasos y contacto de ingeniería | Primer contacto con el laboratorio |
| **Concept Development** | Unas pocas medias jornadas | Factibilidad del concepto y evaluación de riesgos | El alcance depende del CML |
| **Tailored Trade Study** | Duración variable | Concepto, ConOps, resumen de recursos, árbol de compensaciones y, posiblemente, un costo de orden de magnitud (ROM) | El alcance depende del CML |
| **Point Design Study** | Unos 6 días | CAD, lista maestra de equipos (MEL), modelos de ingeniería y estimación de costo CEMA | Para entrar, se requiere aprobar un checklist de CML |

La página dice que los estudios del IDC apoyan la maduración del concepto desde CML 1 hasta CML 4.

### 3. Alcance técnico (disciplinas verificadas; órbitas y lista de productos [SIN VERIFICAR])

El laboratorio cubre el diseño de órbitas: **LEO, GEO, libración, retrógrada, deriva lejana, lunar y espacio profundo**.

Considera la misión completa:
- Órbita y trayectoria.
- Nave espacial.
- Comunicaciones.
- Sistemas terrestres.
- Vehículo de lanzamiento.
- Operaciones de misión.
- Planificación del fin de misión.

Disciplinas que cubre:
- Control de actitud, dinámica de vuelo, estructuras.
- Costo de misión, propulsión, aviónica, diseño mecánico, confiabilidad.
- Software de vuelo, sistemas mecánicos, basura orbital, entorno de radiación.
- Comunicaciones, operaciones de misión, sistemas de potencia y control térmico.

Productos específicos listados: concepto, ConOps, resumen de recursos, árbol de compensaciones, costo ROM, lista maestra de equipos, modelos CAD de empaquetado, modelos 3D del concepto del observatorio.

### 4. Acceso externo

- La página invita a colaborar a científicos, profesionales de la industria aeroespacial y socios académicos.
- Para solicitar un estudio, se usa el formulario Goddard Front Door Connection. Para preguntas generales, la página de contacto del ETD.
- La página no describe otro proceso ni requisitos de elegibilidad.
- La solicitud de estudio la atiende la gerencia del IDC.

### 5. Contexto histórico [SIN VERIFICAR]

- Un documento de 2003 del Centro Integrado de Diseño de Misiones de Goddard (IMDC) dice que el centro había realizado más de 150 estudios de conceptos de misión. Su idea central fue crear un laboratorio físico de diseño con estaciones de trabajo y servidores compartidos, con un equipo de estudio que trabajara casi a tiempo completo durante cada estudio.
- Un artículo de 2016 sobre ingeniería de sistemas en la etapa previa a la formulación describe la práctica del MDL como un método probado para esa etapa.

### 6. Uso propuesto en el juego

El MDL es la referencia más directa para la **estructura de decisiones** del juego:

1. **Office Hours → Concept Development.** El primer nivel del juego es una lluvia de ideas: el jugador identifica riesgos principales (por ejemplo, radiación, costo, comunicaciones).
2. **Tailored Trade Study.** El jugador hace compensaciones (por ejemplo, un instrumento más grande frente a más masa, o una órbita más alta frente a más tiempo de vida).
3. **Point Design Study.** El jugador produce un diseño con lista de equipos, presupuesto y masa total. Para entrar, debe cumplir un checklist (una condición de desbloqueo).
4. **Subsistemas.** Las disciplinas de la lista se pueden usar como subsistemas del juego: potencia, comunicaciones, control de actitud, térmica, aviónica, estructura y radiación.
5. **Productos como entregables.** Al final de cada etapa, el juego genera un "entregable" parecido a un ConOps o a una lista de equipos. Esto da al jugador un resultado visible.

### 7. Pendientes

- [ ] Confirmar qué significa el checklist de CML para el Point Design Study (ver archivo 02).
- [ ] Confirmar el costo CEMA en la fuente de NASA antes de usar una cifra de costo.
- [ ] Confirmar si el MDL acepta equipos externos además de solicitudes de clientes.

### 8. Cómo citar

NASA Goddard Space Flight Center. Integrated Design Center: Mission Design Lab. https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/
