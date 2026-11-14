# GMAT – General Mission Analysis Tool

> Fuentes (leídas 2026-11-14): https://software.nasa.gov/software/GSC-19468-1 · https://sourceforge.net/projects/gmat/ · https://gmat.atlassian.net/wiki/spaces/GW/overview · https://gmat.atlassian.net/wiki/spaces/GW/pages/380273375/For+Users
> `gmat.gsfc.nasa.gov` no resolvía DNS al consultarlo. El ejecutable/código (~322 MB) **no** se ha descargado; aquí solo están los enlaces.

## Qué es
Software **open source** de NASA para el diseño, optimización y navegación (determinación de órbita) de misiones espaciales. Lo desarrollan NASA, industria privada y otros colaboradores. Cubre desde órbita baja (LEO) hasta misiones lunares, puntos de libración y espacio profundo. Se usa en misiones reales, estudios de ingeniería, educación y divulgación.

Flujo de trabajo: se crean **recursos** (naves, propagadores, optimizadores, estimadores…), se configuran y se ordenan en una **secuencia de misión** (script o GUI).

## Versión, licencia, plataformas
| Dato | Valor |
|---|---|
| Última versión | **R2026a** (SourceForge, actualizado 2026-04-03) **[DISCREPANCIA]** |
| Ficha NASA GSC-19468-1 | titulada "Version R2025a" |
| Descarga | `GMAT-src_and_data-R2026a.zip` (322 MB) |
| Licencia | **Apache 2.0** (requiere atribución y aviso de licencia) **[DISCREPANCIA]** |
| Plataformas | Windows, Linux, macOS (soporte Mac limitado según usuarios) |
| Lenguajes | C++, MATLAB, Python; interfaz wxWidgets y línea de comandos |

Novedades R2026a: arrastre atmosférico exponencial en cualquier cuerpo, nuevo groundtrack 2D, modelo atmosférico MSISE-00, visualización 3D OpenFrames (OFI) por defecto, mejor cálculo de tránsitos/ocultaciones.

## Capacidades
- Propagación de órbitas con modelos físicos de alta fidelidad.
- Maniobras **impulsivas** (Δv) y de **empuje continuo** (bajo, medio y alto).
- Optimización de trayectorias y maniobras; correctores diferenciales.
- Determinación de órbita (mínimos cuadrados por lotes, filtro de Kalman extendido/suavizador EKFS) y simulación de medidas.
- Análisis de ventanas de lanzamiento, planificación de maniobras, comparación de escenarios.
- Salidas: gráficos XY, informes, archivos de efemérides, vista 3D.
- Uso operativo: Fermi usa el EKFS de GMAT desde julio de 2021.

### Tipos de misión soportados
LEO · GEO y transferencias a GEO · órbitas altamente elípticas · Luna (incl. landers y CubeSats lunares) · puntos de libración (L1, L2) · interplanetarias (p. ej. Marte) · vuelo en formación.

### Recursos (objetos) del modelo
- **Físicos:** Spacecraft, Thruster, Tank, GroundStation, Formation, ImpulsiveBurn, FiniteBurn, Planet, Comet, Asteroid, Moon, Barycenter, LibrationPoint.
- **De análisis:** DifferentialCorrector, Propagator, Optimizer, Estimator, gráficos 3D, XY plot, ReportFile, EphemerisFile, variables/arrays/strings, CoordinateSystem, subrutinas, funciones MATLAB.
- *(No verificado en las páginas leídas: ForceModel, ContactLocator, EclipseLocator; consultar la Reference Guide.)*

### Misiones de ejemplo (carpeta `samples`)
Vistas en SourceForge: LCROSS y LRO, campos de visión de sensores, transferencia a Marte, transferencia lunar, vuelo en formación, transferencia a órbita geosíncrona.

## Cómo aprender (ruta oficial)
1. Leer "Using GMAT" de la User Guide (instalación, configuración, interfaz).
2. Ejecutar las misiones de `samples`.
3. Hacer los tutoriales de la User Guide.
4. Hojear la Reference Guide (sintaxis de script, tipos, unidades, snippets).

## Enlaces
- Ficha NASA: https://software.nasa.gov/software/GSC-19468-1 (versión 2018: https://software.nasa.gov/software/GSC-18094-1)
- SourceForge: https://sourceforge.net/projects/gmat/ · binarios R2026a: https://sourceforge.net/projects/gmat/files/GMAT/GMAT-R2026a/
- Wiki: https://gmat.atlassian.net/wiki/spaces/GW/overview
  - User Documentation: https://gmat.atlassian.net/wiki/spaces/GW/pages/380273265/User+Documentation
  - Getting Started: https://gmat.atlassian.net/wiki/spaces/GW/pages/1563885590/Getting+Started+Quick+Guide
  - Training and Videos: https://gmat.atlassian.net/wiki/spaces/GW/pages/380273242/Training+and+Videos
- Notas de versión R2026a (Jira): https://gmat.atlassian.net/projects/GMT/versions/11504/
- Canal YouTube: https://www.youtube.com/channel/UCt-REODJNr2mB3t-xH6kbjg
- SmallSat Institute – Space Mission Design Tools: https://www.nasa.gov/smallsat-institute/space-mission-design-tools

## Cómo usarlo en el juego
GMAT es una aplicación de escritorio pesada: **no encaja ejecutándose dentro de un juego web**. Uso recomendado:
1. **Precalcular offline** las órbitas/trayectorias de cada opción del juego (LEO, SSO, GEO, Luna, L2, Marte…).
2. Exportar efemérides/informes → convertir a JSON/CSV → reproducir en el navegador (Three.js, etc.).
3. Obtener **Δv y propelente realistas** (ImpulsiveBurn + Tank/Thruster) para balancear el juego.
4. Usarlo como **"verdad de referencia"** para validar un modelo simplificado propio (Kepler + Hohmann).
5. Acreditar GMAT/NASA en los créditos (Apache 2.0).

---

## Ficha anterior del equipo (antes Resources/01-gmat-general-mission-analysis-tool.md, fusionada)

Esta fuente tenía dos fichas. Lo de arriba es la ficha de alee, la más nueva. Lo de abajo es la ficha del equipo, copiada sin cambios salvo el nivel de los títulos, para no perder ningún dato, etiqueta ni pendiente. Título original: "GMAT: General Mission Analysis Tool".

### Discrepancias entre las dos fichas

Cada **[DISCREPANCIA]** de arriba remite a esta lista. No se eligió ninguna versión: confirmar en la fuente.

- **Versión.** Esta ficha: "Última versión **R2026a** (SourceForge)". Ficha del equipo: "versión R2025a" (la de la página de NASA), y deja pendiente "Confirmar la versión de la documentación (R2025a o la más reciente)".
- **Licencia.** Esta ficha: "**Apache 2.0**" (según SourceForge). Ficha del equipo: "la página indica 'Open Source', pero no nombra la licencia ni sus términos", con el pendiente "Confirmar la licencia exacta en SourceForge".

**Enlace fuente:** https://software.nasa.gov/software/GSC-19468-1
**Agencia:** NASA (Programa de Transferencia Tecnológica, catálogo de software)
**Tipo:** software de escritorio, código abierto
**Estado de la fuente:** página oficial leída de nuevo el 14 de noviembre de 2026. Lo que está en las secciones 2 a 4 está marcado como verificado o sin verificar en cada sección.
**Fecha de consulta:** 14 de noviembre de 2026

---

### 1. Qué es

Según la página oficial del catálogo de software de NASA, GMAT es un sistema de software de código abierto para diseño, optimización y navegación de misiones espaciales. Funciona desde misiones en órbita terrestre baja hasta misiones lunares, de puntos de libración y de espacio profundo. La página lo describe como un sistema "empresarial, multimisión y de código abierto". Las páginas de GMAT lo describen con la misma idea: sirve para modelar naves, sistemas de propulsión, trayectorias y maniobras con modelos físicos de alta fidelidad.

### 2. Datos de la ficha oficial

**Verificados hoy** [VERIFICADO-NASA]: nombre, versión R2025a, número de referencia GSC-19468-1, tipo "Open Source", sistemas operativos Windows, Linux y Mac OS, descripción como sistema de diseño, optimización y navegación, y desarrollo por NASA, industria y colaboradores.

**Sin verificar** [SIN VERIFICAR]: categoría "Herramientas de diseño e integración", enlace a SourceForge, persona de contacto, correos de contacto y mantenimiento por el Programa de Transferencia Tecnológica. Revisar la ficha antes de citarlos.

- **Nombre completo:** General Mission Analysis Tool (GMAT), versión R2025a.
- **Número de referencia:** GSC-19468-1.
- **Categoría en el catálogo:** Herramientas de diseño e integración.
- **Tipo de publicación:** "Open Source".
- **Sistemas operativos:** Windows, Linux y Mac OS. La página no indica requisitos de hardware ni de software.
- **Descarga:** enlace "Download Now" a SourceForge (sourceforge.net/projects/gmat/). La página no da otros términos de uso.
- **Desarrollo:** la página dice que lo desarrollan NASA, la industria privada y otros colaboradores públicos y privados.
- **Mantenimiento:** el listado lo mantiene el Programa de Transferencia Tecnológica de NASA. Figura como oficial de NASA Dan Lockney.
- **Contactos:** hq-dl-t2-ops-center@mail.nasa.gov (contacto del producto) y NHQ-DL-T2-Support@mail.nasa.gov (soporte del sitio).
- **Usos declarados en la página:** diseño de misiones reales, estudios de ingeniería, educación y divulgación.
- **Licencia:** la página indica "Open Source", pero no nombra la licencia ni sus términos. Antes de integrar código o resultados en el proyecto, hay que revisar la licencia en el repositorio de SourceForge.

### 3. Capacidades (según documentación de GMAT) [SIN VERIFICAR en la lista detallada; la página oficial solo declara órbitas de LEO a espacio profundo]

Estas capacidades vienen de la descripción general del software y de su documentación:

- Propagación de órbitas.
- Optimización de trayectorias.
- Determinación de órbitas.
- Simulación de datos de navegación.
- Análisis de ventanas de lanzamiento.
- Planificación de maniobras, incluidas maniobras con propulsión de empuje finito.
- Modelado de sistemas de propulsión, incluida propulsión eléctrica.
- Visualización de parámetros de misión y generación de gráficos y reportes.
- Evaluación de escenarios y compensaciones de ingeniería.

Esto indica que GMAT puede resolver casi toda la parte orbital del juego, pero su nivel de detalle está pensado para ingenieros de misión, no para un juego.

### 4. Documentación y tutoriales [SIN VERIFICAR: no se abrió la documentación]

- La guía del usuario es extensa. Una presentación del Centro Goddard de 2017 la describe como una guía de unas 1000 páginas, con un manual de referencia y unas 100 páginas de tutoriales paso a paso. Es una cifra de 2017, así que puede haber cambiado en versiones recientes.
- La documentación de GMAT recomienda empezar por el tutorial **"Simulating an Orbit"**. Enseña a especificar una órbita y propagarla hasta el periapsis. Es el mejor punto de partida para el equipo.
- Otros tutoriales mencionados en la documentación:
  - **Mars B-Plane Targeting Using GMAT Functions:** diseño de una trayectoria de transferencia a Marte mediante objetivos en el plano B.
  - **Target Finite Burn to Raise Apogee:** elevar el apogeo de una órbita con maniobras de empuje finito.
  - **Electric Propulsion:** configurar la propulsión eléctrica.
- Los tutoriales de la documentación indican dificultad y duración al inicio de cada uno. En la versión leída, estos datos no aparecían en el texto.
- Hay una guía de usuario con edición R2018a publicada en un sitio de documentación de terceros. Úsenla solo como referencia de respaldo; la versión oficial es la de NASA.

### 5. Uso propuesto en el juego

- **Precálculo, no tiempo real.** GMAT es de escritorio y pesado para una aplicación web en tiempo real. El flujo recomendado es: diseñar unas pocas trayectorias en GMAT, exportar los resultados (posición, Δv, tiempo de vuelo) y guardarlos como tablas en el juego.
- **Tabla de trayectorias.** Por ejemplo: órbita baja, transferencia a órbita lunar, transferencia a Marte. Cada entrada incluye Δv aproximado, tiempo de vuelo y masa de combustible requerida. Estos valores deben salir de GMAT, no inventarse.
- **Validación de decisiones.** Si el jugador elige una órbita, el juego busca en la tabla el costo de llegar a ella.
- **Tutorial propio.** El equipo puede usar "Simulating an Orbit" para aprender lo básico antes de programar la tabla.

### 6. Riesgos y pendientes

- [ ] Confirmar la licencia exacta en SourceForge.
- [ ] Confirmar la versión de la documentación (R2025a o la más reciente).
- [ ] Verificar que los resultados precalculados coincidan con los del tutorial.
- [ ] No mezclar datos de GMAT con datos de otros simuladores sin indicarlo.

### 7. Cómo citar

NASA. General Mission Analysis Tool (GMAT), versión R2025a, número de referencia GSC-19468-1. https://software.nasa.gov/software/GSC-19468-1
