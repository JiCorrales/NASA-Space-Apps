# NASA Mission Viz (Web-based Space Mission Visualization, WSMV)

**Enlace fuente:** https://nasa.github.io/mission-viz/
**Repositorio citado en la página:** github.com/nasa/mission-viz
**Agencia:** NASA
**Estado de la fuente:** página oficial leída el 14 de noviembre de 2026. Verificado: demostraciones, tutoriales, tecnologías y ausencia de licencia en la página. **Sin verificar:** el README del repositorio (no se abrió), y las secciones 1, 5 y 7, que vienen de documentos de 2015 y 2016 y de otras fuentes.
**Fecha de consulta:** 14 de noviembre de 2026

---

## 1. Qué es

La página describe el proyecto como un repositorio con aplicaciones de demostración tipo "orrery" (modelo orbital en 3D) y tutoriales para representar trayectorias orbitales. Es un proyecto de NASA alojado en GitHub.

[SIN VERIFICAR] Un documento técnico de 2015 de Daniel O'Neil, del NASA Goddard, lo presenta como un sistema de visualización de misiones en la web. Su visión era construir un sistema que sirviera a planificadores de misión y a emprendedores espaciales para presentar planes de misión con puntos de paso, vistas de mapa y vistas de cabina desde la nave.

## 2. Demostraciones disponibles (según la página oficial)

1. **Orrery ontológico:** modelo 3D del sistema solar con parámetros orbitales keplerianos, construido sobre una ontología de conciencia situacional espacial (SSAO).
2. **Orrery con tabla de parámetros orbitales:** modelo 3D del sistema solar con una tabla de parámetros orbitales de los planetas, generada con R.
3. **Orrery con asteroides potencialmente peligrosos:** modelo 3D animado de los planetas interiores y 50 asteroides, con un propagador orbital basado en el libro *Orbital Mechanics* de Tom Logsdon.
4. **Visualización de misión Tierra-Luna:** modelo 3D animado de una nave que viaja desde una órbita terrestre hasta una órbita lunar.

## 3. Tutoriales disponibles

- Cómo diseñar una órbita elíptica 3D (HTML con modelos interactivos generados en R).
- Serie de tutoriales en HTML y PDF que enlaza las demostraciones.
- Importar datos de Excel a una ontología en Protégé y exportarlos en JSON-LD.
- Generar una tabla y un gráfico 3D en R a partir de JSON-LD.
- Una visión de un orrery web creado por la comunidad (PDF).

## 4. Tecnologías

- **Render 3D:** X3DOM y JavaScript.
- **Lenguaje de datos:** HTML, R con RMarkdown.
- **Ontologías:** SSAO y Protégé. [OWL: SIN VERIFICAR]
- **Formato de datos:** JSON-LD.

## 5. Antecedentes técnicos (documentos de NASA) [SIN VERIFICAR]

Un documento técnico de NASA de 2016 sobre tutoriales de X3DOM describe varias demostraciones:

- **Misión Tierra-Luna en Cesium:** trayectoria de una sonda lunar y la órbita de la Luna. Los datos de trayectoria se generaron con un tutorial de GMAT y se convirtieron a una cadena JavaScript.
- **Desechos orbitales con satellite-js y Cesium:** datos TLE de Celestrak y el modelo SGP para propagar órbitas.
- **Asteroides potencialmente peligrosos:** datos de la Oficina de Programa de Objetos Cercanos a la Tierra del JPL, con un propagador orbital basado en el modelo de Logsdon.

Esto muestra un patrón útil: **GMAT genera la trayectoria y Mission Viz la visualiza**. Esa cadena es la que el equipo puede seguir.

## 6. Licencia

La página **no indica licencia**. Antes de reutilizar código o materiales, hay que revisar el repositorio en GitHub. Si no hay licencia, el código no se puede copiar; solo se puede usar como referencia visual y citarlo.

## 7. Otras entradas relacionadas (no verificadas en detalle)

- Existe un listado en el software de NASA (MFS-34033-1) con el mismo nombre, bajo "herramientas de diseño e integración". No leí su contenido.
- NASA publica una herramienta de visualización del sistema solar llamada "Eyes on the Solar System", que puede servir de referencia visual, pero no es un recurso del reto.
- OpenSpace es un proyecto de visualización de astronomía de código abierto que no es de NASA. Si se usa, debe citarse como fuente externa.

## 8. Uso propuesto en el juego

- **Vista de trayectoria.** La demostración Tierra-Luna sirve de modelo para mostrar la nave en su viaje después del lanzamiento.
- **Vista de misión.** Un orrery simple muestra la posición de la nave respecto a planetas y cuerpos relevantes.
- **Pipeline de datos.** Las trayectorias precalculadas en GMAT se exportan a formato JSON y se cargan en la visualización.
- **Presentación.** Las demostraciones son útiles para la presentación del proyecto, pero la vista del juego debe ser propia.

## 9. Pendientes

- [ ] Leer el README del repositorio en GitHub y confirmar la licencia.
- [ ] Confirmar si la demo Tierra-Luna se puede embeber en una página propia.
- [ ] Leer el contenido de MFS-34033-1.

## 10. Cómo citar

NASA. Web-based Space Mission Visualization (Mission Viz). https://nasa.github.io/mission-viz/
