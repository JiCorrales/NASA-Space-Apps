# NASA Mission Viz (Web-based Space Mission Visualization)

> Fuentes (leídas 2026-11-14): https://nasa.github.io/mission-viz/ · https://github.com/nasa/mission-viz · PDFs en [`../pdf/mission-viz/`](../pdf/mission-viz/).

## Qué es
Repositorio de NASA con **demos web de orrery (modelo del sistema solar) y tutoriales** para representar trayectorias orbitales en el navegador. No es un juego ni tiene misiones jugables: son escenas y tutoriales. Repo público (`nasa/mission-viz`), páginas estáticas servidas con GitHub Pages (sin build).

**Licencia: no confirmada** (el archivo LICENSE devolvió 404). Reutilizar ideas, no código, hasta verificarla (`gh repo view nasa/mission-viz --json licenseInfo`).

## Escenas / demos
| Demo | Tecnología | Qué muestra | URL |
|---|---|---|---|
| Ontology-based Orrery | Three.js | Planetas animados con propagador orbital; órbitas desde una ontología | https://nasa.github.io/mission-viz/OntologyDrivenOrrery/An_Orrery_in_ThreeJS.html |
| Orrery + tabla de parámetros | R/RMarkdown | Orrery y tabla de elementos orbitales planetarios | https://nasa.github.io/mission-viz/RMarkdown/ontology_based_orrery_generated_from_R_code.html |
| Inner Solar System | X3DOM | Planetas interiores + 50 asteroides potencialmente peligrosos (PHA). Propagador basado en Logsdon, *Orbital Mechanics* | https://nasa.github.io/mission-viz/X3Dom/InnerSolarSystem.html |
| Earth–Moon Mission | X3DOM | Nave pasando de órbita terrestre a lunar | https://nasa.github.io/mission-viz/X3Dom/20160129_Earth_MoonMission_X3D.html |
| Elliptical Orbit Design | R | Tutorial: de elipse 2D a órbita 3D e implementación de un propagador | https://nasa.github.io/mission-viz/RMarkdown/Elliptical_Orbit_Design.html |
| Tutorial series | X3DOM | Índice de la serie de 3 tutoriales (incluye una demo que **carga un archivo de coordenadas**) | https://nasa.github.io/mission-viz/X3Dom/WebMissionVisualizationTutorialSeries.html |

## Datos de órbita
Las órbitas se definen con **elementos keplerianos**: semieje mayor, excentricidad, inclinación, RAAN (longitud del nodo ascendente), argumento del perigeo, anomalía media y periodo. Flujo original: Excel → Protégé (ontología OWL `SSAO_Rovetto.owl`) → JSON-LD → visualización. Para un juego basta un **JSON plano con esos elementos** + un propagador kepleriano.

## Documentos descargados (en `../pdf/mission-viz/`)
| Archivo | Contenido |
|---|---|
| `20150611_WebBasedMissionVisualizationSystem.pdf` | Visión de un sistema web de visualización de misiones (D. O'Neil). Resumen abajo. |
| `20160830_Importing_the_SpaceSituationalAwarenessOntology_and_Exporting_JSONLD.pdf` | Tutorial: importar la ontología SSA en Protégé y exportar JSON-LD |
| `20180515_Generating_an_HTMLTable_and_3D_Plot_with_R_from_JSONLD.pdf` | Tutorial: tabla HTML y gráfico 3D con R a partir de JSON-LD |
| `NASA_TM_20210000030_Ontology_Based_Virtual_Orrery.pdf` | NASA TM "An Ontology-Based Virtual Orrery" (88 págs.) |

## Resumen del documento de visión (2015)
Propone un "Google Maps del sistema solar" ejecutado nativamente en el navegador (JavaScript + WebGL).
- **Casos de uso:** educación (línea de tiempo, acelerar el tiempo, medir distancias y tiempos de viaje), planificación de misiones (waypoints, maniobras, vista desde la cabina, guardar/compartir planes con la **justificación de cada maniobra**), industria espacial, y **juegos serios** (colonización, minería de asteroides, carreras por el cinturón de asteroides).
- **Funciones:** selección de cuerpos a mostrar, nivel de detalle (asteroides como partículas de lejos), línea de tiempo configurable (minutos → milenios), acelerador temporal, selección de waypoints (reinicia el propagador para no acumular error), cámaras seleccionables por nave.
- **Planificación:** vistas 2D para colocar waypoints en 3D, trazado de la trayectoria; el análisis detallado se hace antes con **GMAT** o STK; si no hay elementos orbitales, líneas rectas o curvas Bézier entre waypoints.
- **Biblioteca de modelos:** modelos 3D articulados (despliegue de paneles/antenas), texturas (COLLADA desde Blender).
- **API:** conexión con bases de datos de cuerpos celestes (JPL NEO, Asterank), construir sobre X3DOM o Three.js, escena del sistema solar como *scene graph*.
- **Futuro:** partículas (penachos), perturbaciones gravitatorias, aterrizajes en un globo digital (WorldWind, Cesium).

## Qué nos aporta
- Ideas para la **pantalla de simulación**: órbita animada, línea de tiempo con acelerador, waypoints con explicación de cada decisión, vista desde la nave.
- Esquema de datos de órbita (elementos keplerianos) sencillo de implementar.
