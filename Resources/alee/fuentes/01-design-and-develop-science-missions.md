# Design and Develop Science Missions (NASA SmallSat Institute)

> Resumen de [`../pdf/250323-design-and-develop-science-mission.pdf`](../pdf/250323-design-and-develop-science-mission.pdf) — webinar de la serie *Systems Engineering* "Access to Space for All", 26-03-2025, Julie Levri (Flight Systems Engineer). https://www.nasa.gov/smallsat-institute

## Qué es una misión científica
Para NASA, una misión gestionada por el Science Mission Directorate (SMD) centrada en investigación y exploración. Cuatro disciplinas: **Ciencias de la Tierra · Heliofísica · Ciencia planetaria · Astrofísica**. Suelen estar guiadas por los planes estratégicos del SMD.

## Los 4 segmentos de una misión
| Segmento | Contenido |
|---|---|
| **Lanzamiento** | Vehículo de lanzamiento y servicios para llevar la nave al espacio |
| **Espacial** | Nave y componentes: orbitadores, landers, rovers, instrumentos |
| **Tierra** | Estaciones terrenas y centros de control: comunicación, recepción de datos, gestión |
| **Usuario** | Científicos y público que usan los datos para investigación y educación |

## Proceso general
**Identificar necesidad y objetivos → Definir concepto → Definir requisitos → Diseñar → Construir y verificar → Implementar (operar)**

Principio clave: **"Empezar con el final en mente"**: se parte del segmento de usuario (qué datos/producto final necesito) y se derivan los requisitos hacia atrás. Al definir cada requisito, **planificar también cómo se verificará** (p. ej. "<250 g" se verifica pesando el contenedor vacío).

### Concepto de Operaciones (ConOps, según NPR 7123.1)
- Describe a alto nivel cómo se usará el sistema para cumplir las expectativas, normalmente en **secuencia temporal**.
- Describe el sistema desde la perspectiva operativa y ayuda a entender sus objetivos.
- Estimula el desarrollo de requisitos y arquitectura.
- Base de los documentos posteriores y de la planificación operativa a largo plazo.
- Da los criterios de **validación** del sistema.

## Ejemplo completo: BioNutrients-2 (ISS)
- **Necesidad:** producir nutrientes in situ, de forma rápida, segura y fiable, con **mínima masa, potencia y volumen** para misiones largas (los alimentos almacenados se degradan).
- **Objetivos:** (1) permitir el crecimiento de levaduras; (2) producir beta-caroteno en la ISS; (3) reducir masa y volumen respecto a BioNutrients-1.
- **Segmentos:** lanzamiento en NG-18 a la ISS, a temperatura ambiente y protegido de oxígeno/humedad · experimento en la ISS (hidratar, incubar, congelar, devolver) · en tierra se sigue el inicio en tiempo real y luego la temperatura · los científicos procesan muestras y publican.
- **Requisitos derivados del producto final (publicación):** 12 muestras réplica · 30 mL por muestra · 3 µg beta-caroteno/mL · 1 mg peso seco celular por muestra · sin contaminación microbiana.
- **Requisitos de reducción de recursos:** contenedor <250 g · volumen total ocupado <300 mL.
- Flujo de usuario: entrega → descongelar → vaciar y lavar → centrifugar → analizar.

## Ejemplos de misiones citados
- **PUNCH:** constelación de 4 smallsats en LEO para observar en 3D la corona solar y su paso a viento solar.
- **PILOT:** flota de 34 satélites en dos órbitas para medir plasma frío en la magnetosfera.
- **Dawn:** primera nave en orbitar dos cuerpos menores (Vesta y Ceres).
- **Mars Moon Sampler** (Fobos/Deimos), clase New Frontiers, retorno de muestras.
- **SLS** (lanzador pesado: más masa y volumen de carga, menos tiempo de misión) y **programa Artemis**.

## Referencias útiles (del documento)
1. NASA Systems Engineering Handbook SP-2016-6105 Rev 2 — https://www.nasa.gov/reference/systems-engineering-handbook/ · Apéndice S (ConOps) — https://www.nasa.gov/reference/appendix-s-concept-of-operations-annotated-outline/
2. NPR 7123.1D (procesos de ingeniería de sistemas)
3. NPR 7120.5F (gestión de programas y proyectos)
4. NPR 7120.8A (proyectos de I+D)
5. NPR 8705.4B (clasificación de riesgo de cargas útiles)
6. https://science.nasa.gov/learn/
7. System Engineering Curriculum Intro — https://ntrs.nasa.gov/citations/20210021839

## Qué nos aporta para el juego
- El **esqueleto del flujo de juego**: Objetivo → Concepto → Requisitos → Diseño → Construir/verificar → Operar.
- Los **4 segmentos** como "tableros" o áreas del juego (lanzamiento, nave, tierra, usuario).
- Mecánica "empieza por el final": el jugador fija qué datos necesita y de ahí salen requisitos numéricos verificables.
