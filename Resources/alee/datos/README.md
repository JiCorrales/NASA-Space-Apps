# Datos descargados (2026-11-14)

Datos reales de NASA listos para convertir en los archivos de datos del juego (`Assets/_Project/Data/`, según `CONTRIBUTING.md`). **Cada valor que pase al juego debe llevar al lado su fuente**: el archivo y la fila de aquí, y la URL de la ficha correspondiente.

| Archivo | Fuente | Contenido | Ficha |
|---|---|---|---|
| `lsp-launch-vehicle-performance.csv` | NASA LSP Launch Vehicle Performance | Capacidad (kg) de cada lanzador NLS II para LEO 28,5° y 51,6°, heliosíncrona 500/700 km, GTO y C3 −2/0/10/20/80 | [`../fuentes/11`](../fuentes/11-lsp-launch-vehicle-performance.md) |
| `trajectory-browser-transfers-2026-2036.csv` | NASA Ames Trajectory Browser | 40 trayectorias a Venus, Marte, Júpiter, Saturno, Bennu y Didymos: fechas, duración y Δv | [`../fuentes/12`](../fuentes/12-trajectory-browser.md) |
| `nssdca-reference-missions.csv` | NSSDCA Master Catalog | 29 misiones reales: lanzador, fecha, masa, disciplinas | [`../fuentes/16`](../fuentes/16-nssdca-master-catalog.md) |
| `donki/` | NASA CCMC DONKI | Llamaradas, SEP, tormentas geomagnéticas y CME de 2024–2025, más un resumen de frecuencias | [`../fuentes/17`](../fuentes/17-donki-space-weather.md) |
| `horizons-elements-2026-11-14.csv` | JPL Horizons | Elementos orbitales de los 8 planetas y la Luna | [`../fuentes/19`](../fuentes/19-jpl-horizons.md) |
| `exoplanet-archive-pscomppars.csv` | NASA Exoplanet Archive | 6470 exoplanetas confirmados con método e instalación de descubrimiento | [`../fuentes/21`](../fuentes/21-exoplanet-archive.md) |

## Cómo se obtuvieron
- **LSP**: formulario web consultado con el navegador; resultados copiados de la tabla de cada consulta.
- **Trajectory Browser**: consultas por URL; los resultados vienen como datos JSON dentro de la página y se convirtieron a CSV.
- **NSSDCA**: fichas por ID COSPAR, procesadas con un script (sin datos personales).
- **DONKI**: API `https://ccmc.gsfc.nasa.gov/DONKI/WS/get/<tipo>` en tramos de 60 días.
- **Horizons**: API oficial (`ssd.jpl.nasa.gov/api/horizons.api`).
- **Exoplanet Archive**: servicio TAP oficial.

Las URL exactas de cada consulta están en la ficha correspondiente, para poder repetirlas.
