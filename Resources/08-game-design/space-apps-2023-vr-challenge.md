# Visualize a Space Mission Using Virtual Reality (NASA Space Apps 2023)

> Fuente: https://www.spaceappschallenge.org/2023/challenges/visualize-a-space-mission-using-virtual-reality/ (pestañas *Details* y *Resources*, leídas el 2026-11-14).
> Traducción/condensación al español. Es un reto **previo** que aparece en los recursos del nuestro: sirve de referencia para la parte de **visualización de órbitas/trayectorias y línea de tiempo**.

## Ficha
- **Evento:** 2023 NASA Space Apps Challenge
- **Dificultad:** Avanzado, Intermedio, Principiante/Juvenil
- **Temas:** Juegos, Planetas y lunas, Software, Exploración espacial

## Resumen
Un satélite en órbita terrestre, una misión Tierra-Luna con maniobra de transferencia, una nave en órbita cíclica Tierra-Marte o una sonda que cruza el cinturón de asteroides: entender y visualizar misiones así es difícil. El reto pedía una **aplicación interactiva de realidad virtual** (en navegador) que mostrara **el concepto de misión, las trayectorias orbitales y la línea de tiempo**.

## Contexto
- Antes, las misiones se presentaban con diapositivas e imágenes 2D de la trayectoria; hoy se usan animaciones 3D.
- Propuesta: un modelo VR embebido en una web donde el usuario pueda rotar, desplazar y hacer zoom sobre la nave; en versiones avanzadas, **cambiar velocidad/dirección para realizar maniobras orbitales**.
- Un **globo digital** da contexto a órbitas alrededor de un planeta/luna; un **orrery virtual** (modelo del sistema solar) da contexto a misiones de espacio profundo.
- Hay globos digitales libres (p. ej. **NASA Web WorldWind**) y **GMAT** puede generar series temporales de coordenadas cartesianas. **No existe un orrery virtual reutilizable** equivalente.

## Objetivos
Crear una app VR interactiva en navegador que muestre concepto, trayectorias y línea de tiempo de una misión, **embebida en una página web desplegada en hosting gratuito** para que sea accesible a todos (y a los jueces).

## Consideraciones / niveles propuestos
| Nivel | Propuesta |
|---|---|
| Principiante | Aprender GMAT o diseñar una **órbita elíptica 3D**. Hay un tutorial de 3 partes: usar GMAT para generar coordenadas cartesianas 3D y dibujar la trayectoria con **X3D**. |
| Intermedio | Visualizar trayectorias en un **globo digital** (Web WorldWind tiene API para añadir formas a capas). |
| Intermedio | Crear un **orrery** y visualizar un **ciclador Tierra-Marte** (nave que orbita entre ambos planetas, como "transporte público"; puede haber una segunda nave desfasada 180°). Puede ser interactivo sin animar, o animado con planetas orbitando. |
| Avanzado | Orrery con **cinturón de asteroides** (hay uno con asteroides potencialmente peligrosos, PHA) y misiones con **asistencia gravitatoria** (Marte/Venus). Posible función para **subir un archivo con la serie temporal de coordenadas** de la trayectoria. |

## Recursos que listaba
### NASA
| Recurso | Descripción | URL |
|---|---|---|
| NASA Eyes | Ejemplos excelentes de orrery | https://eyes.nasa.gov/ |
| NASA Software Catalog | Ficha del software de visualización web de misiones | https://software.nasa.gov/software/MFS-34033-1 |
| GMAT (versión 2018) | Herramienta de análisis de misiones | https://software.nasa.gov/software/GSC-18094-1 |
| Space Mission Design Tools | Página del SmallSat Institute; buscar GMAT R2020a | https://www.nasa.gov/smallsat-institute/space-mission-design-tools |
| Web WorldWind | Globo digital de NASA | https://worldwind.arc.nasa.gov/web/ |

### Otros
| Recurso | Descripción | URL |
|---|---|---|
| Web-based Space Mission Visualization (índice) | Demos y tutoriales | https://nasa.github.io/mission-viz/ |
| Repositorio mission-viz | README con demos de orrery y tutoriales | https://github.com/nasa/mission-viz |
| Serie de tutoriales (3 partes) | Cómo crear webs que visualizan una trayectoria | https://nasa.github.io/mission-viz/X3Dom/WebMissionVisualizationTutorialSeries.html |
| Elliptical Orbit Simulator | Tutorial de diseño de órbita elíptica | https://nasa.github.io/mission-viz/RMarkdown/Elliptical_Orbit_Design.html |
| Ontology-driven Orrery | Orrery del sistema solar interior en Three.js (arrastrar para cambiar vista) | https://nasa.github.io/mission-viz/OntologyDrivenOrrery/An_Orrery_in_ThreeJS.html |
| Interactive Orrery (R) | Orrery interactivo generado con R | https://nasa.github.io/mission-viz/RMarkdown/ontology_based_orrery_generated_from_R_code.html |
| Web-Based Space Mission Visualization System | Visión de un orrery virtual (PDF, copia en `../pdf/mission-viz/`) | https://nasa.github.io/mission-viz/X3Dom/20150611_WebBasedMissionVisualizationSystem.pdf |
| Inner Solar System | Orrery animado con PHAs | https://nasa.github.io/mission-viz/X3Dom/InnerSolarSystem.html |
| pykep – Orbit Plotting Module (ESA) | Librería Python para visualizar trayectorias | https://esa.github.io/pykep/documentation/orbitplots.html |

### Agencia socia (CSA)
- The Vection Virtual Reality Experiment: https://www.asc-csa.gc.ca/eng/sciences/vection.asp
- Inversión canadiense en cámaras VR inmersivas (Felix & Paul Studios): https://www.canada.ca/en/space-agency/news/2021/08/canadian-firm-developing-immersive-virtual-reality-camera-systems-for-space-exploration.html

### Palabras clave sugeridas para buscar
- Librerías 3D: *free 3d graphics libraries*, *web-browser-based high level 3D API*, *JavaScript-based engines*
- Motores de juego: *cross platform game engine*, *video game developer tools*
- Globos digitales: *world-class 3D globes*, *earth engine*
- Hosting: *code repositories*, *cloud platforms*, *free web hosting*
- Trayectorias: *ellipse*, *parabolic trajectory*, *hyperbolic trajectory*
- Optimización multidisciplinar: *Hohmann transfer example – Optimizing a Spacecraft Maneuver*, *Dymos – Two-burn Orbit Raise*, *Dymos Python package*
- VR: *Mário Schenberg spaceship*

## Qué nos aporta para nuestro reto
- Patrón técnico probado: **precalcular trayectorias (GMAT/pykep) → exportar coordenadas → reproducir en el navegador** (Three.js/X3DOM/globo).
- Ideas de visualización para la fase de "simulación" de nuestro juego: línea de tiempo, maniobras, globo para LEO/GEO, orrery para espacio profundo.
- Recordatorio práctico: **desplegar en hosting gratuito** para que los jueces puedan probarlo.
