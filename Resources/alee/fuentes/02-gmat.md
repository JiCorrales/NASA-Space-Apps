# GMAT – General Mission Analysis Tool

> Fuentes (leídas 2026-11-14): https://software.nasa.gov/software/GSC-19468-1 · https://sourceforge.net/projects/gmat/ · https://gmat.atlassian.net/wiki/spaces/GW/overview · https://gmat.atlassian.net/wiki/spaces/GW/pages/380273375/For+Users
> `gmat.gsfc.nasa.gov` no resolvía DNS al consultarlo. El ejecutable/código (~322 MB) **no** se ha descargado; aquí solo están los enlaces.

## Qué es
Software **open source** de NASA para el diseño, optimización y navegación (determinación de órbita) de misiones espaciales. Lo desarrollan NASA, industria privada y otros colaboradores. Cubre desde órbita baja (LEO) hasta misiones lunares, puntos de libración y espacio profundo. Se usa en misiones reales, estudios de ingeniería, educación y divulgación.

Flujo de trabajo: se crean **recursos** (naves, propagadores, optimizadores, estimadores…), se configuran y se ordenan en una **secuencia de misión** (script o GUI).

## Versión, licencia, plataformas
| Dato | Valor |
|---|---|
| Última versión | **R2026a** (SourceForge, actualizado 2026-04-03) |
| Ficha NASA GSC-19468-1 | titulada "Version R2025a" |
| Descarga | `GMAT-src_and_data-R2026a.zip` (322 MB) |
| Licencia | **Apache 2.0** (requiere atribución y aviso de licencia) |
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
