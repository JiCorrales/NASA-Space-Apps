# Datos descargados (2026-11-14)

Datos reales de NASA listos para convertir en los archivos de datos del juego (`Assets/_Project/Data/`, según `CONTRIBUTING.md`). **Cada valor que pase al juego debe llevar al lado su fuente**: el archivo y la fila de aquí, y la URL de la ficha correspondiente.

| Archivo | Fuente | Contenido | Ficha |
|---|---|---|---|
| `../05-launch-and-orbit/data/lsp-launch-vehicle-performance.csv` | NASA LSP Launch Vehicle Performance | Capacidad (kg) de cada lanzador NLS II para LEO 28,5° y 51,6°, heliosíncrona 500/700 km, GTO y C3 −2/0/10/20/80 | [`../05-launch-and-orbit/lsp-launch-vehicle-performance.md`](../05-launch-and-orbit/lsp-launch-vehicle-performance.md) |
| `../09-future-work/data/trajectory-browser-transfers-2026-2036.csv` | NASA Ames Trajectory Browser | 40 trayectorias a Venus, Marte, Júpiter, Saturno, Bennu y Didymos: fechas, duración y Δv | [`../09-future-work/trajectory-browser.md`](../09-future-work/trajectory-browser.md) |
| `../01-mission-objective/data/nssdca-reference-missions.csv` | NSSDCA Master Catalog | 29 misiones reales: lanzador, fecha, masa, disciplinas | [`../01-mission-objective/nssdca-master-catalog.md`](../01-mission-objective/nssdca-master-catalog.md) |
| `../07-simulation-and-events/data/donki/` | NASA CCMC DONKI | Llamaradas, SEP, tormentas geomagnéticas y CME de 2024–2025, más un resumen de frecuencias | [`../07-simulation-and-events/donki-space-weather.md`](../07-simulation-and-events/donki-space-weather.md) |
| `../09-future-work/data/horizons-elements-2026-11-14.csv` | JPL Horizons | Elementos orbitales de los 8 planetas y la Luna | [`../09-future-work/jpl-horizons.md`](../09-future-work/jpl-horizons.md) |
| `../09-future-work/data/exoplanet-archive-pscomppars.csv` | NASA Exoplanet Archive | 6470 exoplanetas confirmados con método e instalación de descubrimiento | [`../09-future-work/exoplanet-archive.md`](../09-future-work/exoplanet-archive.md) |
| `../06-constraints/data/nasa-launch-service-awards.csv` | Notas de prensa de NASA | 13 lanzamientos de NASA con lanzador y coste total (69–255 M$), 2014–2025 | [`../06-constraints/costes-nasa.md`](../06-constraints/costes-nasa.md) |
| `../06-constraints/data/launch-cost-per-kg-leo-ntrs.csv` | NASA Ames (NTRS 20200001093) | Coste por kg a LEO de 36 lanzadores, 1957–2018, en k$ de 2018 | [`../06-constraints/costes-nasa.md`](../06-constraints/costes-nasa.md) |
| `../06-constraints/data/nasa-mission-cost-caps.csv` | MOCET 2024 de NASA y convocatorias (AO) | Topes de coste por clase de misión (Pioneers 20 M$ … New Frontiers 900 M$) | [`../06-constraints/costes-nasa.md`](../06-constraints/costes-nasa.md) |
| `../04-instruments/data/wmo-oscar-nasa-instruments.csv` | WMO OSCAR/Space | 323 instrumentos aportados por NASA: tipo, masa, potencia, tasa de datos y satélites | [`../04-instruments/instrumentos-wmo-oscar.md`](../04-instruments/instrumentos-wmo-oscar.md) |
| `../04-instruments/data/wmo-oscar-instrument-type-summary.csv` | WMO OSCAR/Space (calculado) | Mediana, mínimo y máximo de masa, potencia y tasa de datos por tipo de instrumento | [`../04-instruments/instrumentos-wmo-oscar.md`](../04-instruments/instrumentos-wmo-oscar.md) |
| `../10-mars-surface/data/mars-surface-numbers.csv` | NASA, JPL and NSSDCA pages on Mars | 201 cifras sobre la superficie de Marte (temperatura, polvo, radiación, comunicaciones, energía, salud de la tripulación), cada una con fuente, URL y `kind` (measured, derived, plan, not-found) | [`../10-mars-surface/README.md`](../10-mars-surface/README.md) |

## Cómo se obtuvieron
- **LSP**: formulario web consultado con el navegador; resultados copiados de la tabla de cada consulta.
- **Trajectory Browser**: consultas por URL; los resultados vienen como datos JSON dentro de la página y se convirtieron a CSV.
- **NSSDCA**: fichas por ID COSPAR, procesadas con un script (sin datos personales).
- **DONKI**: API `https://ccmc.gsfc.nasa.gov/DONKI/WS/get/<tipo>` en tramos de 60 días.
- **Horizons**: API oficial (`ssd.jpl.nasa.gov/api/horizons.api`).
- **Exoplanet Archive**: servicio TAP oficial.
- **Lanzamientos de NASA**: cifra copiada literalmente de cada nota de prensa (URL en la última columna).
- **Coste por kg**: tabla A1 del PDF de NTRS, transcrita.
- **Topes por clase**: tabla de la presentación MOCET 2024 y convocatorias (URL por fila).
- **Marte (superficie)**: páginas de NASA, JPL y NSSDCA y PDF de NTRS leídos uno a uno; cada fila cita la frase y la URL (ver `10-mars-surface/`).
- **WMO OSCAR**: lista de instrumentos desde su API (`/api/v1/instruments`); masa, potencia y tasa de datos leídas de la ficha web de cada instrumento.

Las URL exactas de cada consulta están en la ficha correspondiente, para poder repetirlas.
