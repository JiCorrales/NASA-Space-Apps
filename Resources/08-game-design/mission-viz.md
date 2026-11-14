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
| Earth–Moon Mission | X3DOM **[DISCREPANCIA]** | Nave pasando de órbita terrestre a lunar | https://nasa.github.io/mission-viz/X3Dom/20160129_Earth_MoonMission_X3D.html |
| Elliptical Orbit Design | R | Tutorial: de elipse 2D a órbita 3D e implementación de un propagador | https://nasa.github.io/mission-viz/RMarkdown/Elliptical_Orbit_Design.html |
| Tutorial series | X3DOM | Índice de la serie de 3 tutoriales (incluye una demo que **carga un archivo de coordenadas**) | https://nasa.github.io/mission-viz/X3Dom/WebMissionVisualizationTutorialSeries.html |

## Datos de órbita
Las órbitas se definen con **elementos keplerianos**: semieje mayor, excentricidad, inclinación, RAAN (longitud del nodo ascendente), argumento del perigeo, anomalía media y periodo. Flujo original: Excel → Protégé (ontología OWL `SSAO_Rovetto.owl`) **[DISCREPANCIA]** → JSON-LD → visualización. Para un juego basta un **JSON plano con esos elementos** + un propagador kepleriano.

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

---

## Ficha anterior del equipo (antes Resources/04-nasa-mission-viz.md, fusionada)

Esta fuente tenía dos fichas. Lo de arriba es la ficha de alee, la más nueva. Lo de abajo es la ficha del equipo, copiada sin cambios salvo el nivel de los títulos, para no perder ningún dato, etiqueta ni pendiente. Título original: "NASA Mission Viz (Web-based Space Mission Visualization, WSMV)".

### Discrepancias entre las dos fichas

Cada **[DISCREPANCIA]** de arriba remite a esta lista. No se eligió ninguna versión: confirmar en la fuente.

- **Ontología OWL.** Esta ficha: "ontología OWL `SSAO_Rovetto.owl`". Ficha del equipo: "Ontologías: SSAO y Protégé. [OWL: SIN VERIFICAR]".
- **Demo Tierra-Luna.** Esta ficha: la demo publicada es X3DOM. Ficha del equipo (sección 5, [SIN VERIFICAR]): un documento de NASA de 2016 describe una "Misión Tierra-Luna en Cesium" con datos de un tutorial de GMAT.
- **Repositorio.** Esta ficha leyó `github.com/nasa/mission-viz` (el LICENSE da 404). Ficha del equipo: "el README del repositorio (no se abrió)". Las dos coinciden en que la licencia no está confirmada.

**Enlace fuente:** https://nasa.github.io/mission-viz/
**Repositorio citado en la página:** github.com/nasa/mission-viz
**Agencia:** NASA
**Estado de la fuente:** página oficial leída el 14 de noviembre de 2026. Verificado: demostraciones, tutoriales, tecnologías y ausencia de licencia en la página. **Sin verificar:** el README del repositorio (no se abrió), y las secciones 1, 5 y 7, que vienen de documentos de 2015 y 2016 y de otras fuentes.
**Fecha de consulta:** 14 de noviembre de 2026

---

### 1. Qué es

La página describe el proyecto como un repositorio con aplicaciones de demostración tipo "orrery" (modelo orbital en 3D) y tutoriales para representar trayectorias orbitales. Es un proyecto de NASA alojado en GitHub.

[SIN VERIFICAR] Un documento técnico de 2015 de Daniel O'Neil, del NASA Goddard, lo presenta como un sistema de visualización de misiones en la web. Su visión era construir un sistema que sirviera a planificadores de misión y a emprendedores espaciales para presentar planes de misión con puntos de paso, vistas de mapa y vistas de cabina desde la nave.

### 2. Demostraciones disponibles (según la página oficial)

1. **Orrery ontológico:** modelo 3D del sistema solar con parámetros orbitales keplerianos, construido sobre una ontología de conciencia situacional espacial (SSAO).
2. **Orrery con tabla de parámetros orbitales:** modelo 3D del sistema solar con una tabla de parámetros orbitales de los planetas, generada con R.
3. **Orrery con asteroides potencialmente peligrosos:** modelo 3D animado de los planetas interiores y 50 asteroides, con un propagador orbital basado en el libro *Orbital Mechanics* de Tom Logsdon.
4. **Visualización de misión Tierra-Luna:** modelo 3D animado de una nave que viaja desde una órbita terrestre hasta una órbita lunar.

### 3. Tutoriales disponibles

- Cómo diseñar una órbita elíptica 3D (HTML con modelos interactivos generados en R).
- Serie de tutoriales en HTML y PDF que enlaza las demostraciones.
- Importar datos de Excel a una ontología en Protégé y exportarlos en JSON-LD.
- Generar una tabla y un gráfico 3D en R a partir de JSON-LD.
- Una visión de un orrery web creado por la comunidad (PDF).

### 4. Tecnologías

- **Render 3D:** X3DOM y JavaScript.
- **Lenguaje de datos:** HTML, R con RMarkdown.
- **Ontologías:** SSAO y Protégé. [OWL: SIN VERIFICAR]
- **Formato de datos:** JSON-LD.

### 5. Antecedentes técnicos (documentos de NASA) [SIN VERIFICAR]

Un documento técnico de NASA de 2016 sobre tutoriales de X3DOM describe varias demostraciones:

- **Misión Tierra-Luna en Cesium:** trayectoria de una sonda lunar y la órbita de la Luna. Los datos de trayectoria se generaron con un tutorial de GMAT y se convirtieron a una cadena JavaScript.
- **Desechos orbitales con satellite-js y Cesium:** datos TLE de Celestrak y el modelo SGP para propagar órbitas.
- **Asteroides potencialmente peligrosos:** datos de la Oficina de Programa de Objetos Cercanos a la Tierra del JPL, con un propagador orbital basado en el modelo de Logsdon.

Esto muestra un patrón útil: **GMAT genera la trayectoria y Mission Viz la visualiza**. Esa cadena es la que el equipo puede seguir.

### 6. Licencia

La página **no indica licencia**. Antes de reutilizar código o materiales, hay que revisar el repositorio en GitHub. Si no hay licencia, el código no se puede copiar; solo se puede usar como referencia visual y citarlo.

### 7. Otras entradas relacionadas (no verificadas en detalle)

- Existe un listado en el software de NASA (MFS-34033-1) con el mismo nombre, bajo "herramientas de diseño e integración". No leí su contenido.
- NASA publica una herramienta de visualización del sistema solar llamada "Eyes on the Solar System", que puede servir de referencia visual, pero no es un recurso del reto.
- OpenSpace es un proyecto de visualización de astronomía de código abierto que no es de NASA. Si se usa, debe citarse como fuente externa.

### 8. Uso propuesto en el juego

- **Vista de trayectoria.** La demostración Tierra-Luna sirve de modelo para mostrar la nave en su viaje después del lanzamiento.
- **Vista de misión.** Un orrery simple muestra la posición de la nave respecto a planetas y cuerpos relevantes.
- **Pipeline de datos.** Las trayectorias precalculadas en GMAT se exportan a formato JSON y se cargan en la visualización.
- **Presentación.** Las demostraciones son útiles para la presentación del proyecto, pero la vista del juego debe ser propia.

### 9. Pendientes

- [ ] Leer el README del repositorio en GitHub y confirmar la licencia.
- [ ] Confirmar si la demo Tierra-Luna se puede embeber en una página propia.
- [ ] Leer el contenido de MFS-34033-1.

### 10. Cómo citar

NASA. Web-based Space Mission Visualization (Mission Viz). https://nasa.github.io/mission-viz/
