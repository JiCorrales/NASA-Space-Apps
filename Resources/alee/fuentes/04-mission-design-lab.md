# Mission Design Lab (MDL) – NASA Goddard Integrated Design Center

> Fuentes (leídas 2026-11-14; las páginas indican "Page Last Updated: Jul 23, 2026" y un aviso de que no se actualizan por falta de financiación federal):
> - https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/
> - https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/instrument-design-lab/
> - https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/

## Qué es
- **IDC (Integrated Design Center):** instalación de **ingeniería concurrente multidisciplinar** de Goddard, especializada en el diseño conceptual rápido de misiones e instrumentos. Creada en 1997. Tres laboratorios: **MDL** (misiones) e **IDL** (instrumentos) en Greenbelt (MD), y **MPL** (Mission Planning Lab) en Wallops.
- Beneficios: evaluación temprana de riesgos y exploración del espacio de soluciones, ingeniería de sistemas desde el inicio, evaluación técnica independiente, ciclos de desarrollo rápidos.
- **MDL:** entorno colaborativo (personas + proceso + herramientas + instalación) para diseño y análisis conceptual **de extremo a extremo** de misiones.
- Cada laboratorio tiene un equipo núcleo (Team Leads + Lead Systems Engineer) y los estudios se completan con expertos de toda la dirección de ingeniería.

## Niveles de estudio
Los estudios se adaptan para madurar conceptos **de CML 1 a CML 4** (ver [`03-concept-maturity-levels.md`](03-concept-maturity-levels.md)).

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
- **Órbitas:** LEO, GEO, libración, retrógradas, "drift-away", lunares, espacio profundo.
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
