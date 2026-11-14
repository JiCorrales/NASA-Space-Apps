# DONKI – Space Weather Database Of Notifications, Knowledge, Information

> Web: https://ccmc.gsfc.nasa.gov/tools/DONKI/ (Community Coordinated Modeling Center, NASA Goddard). API en https://api.nasa.gov/.
> Descargado el 2026-11-14 desde `https://ccmc.gsfc.nasa.gov/DONKI/WS/get/<TIPO>?startDate=…&endDate=…` en tramos de 60 días (límite de la API).
> Datos: [`data/donki/`](data/donki/)

## Qué es
Base de datos de NASA con los **eventos reales de clima espacial**: llamaradas solares, eyecciones de masa coronal, eventos de partículas energéticas y tormentas geomagnéticas.

## Archivos (2024-01-01 a 2025-12-31)
| Archivo | Contenido | Registros |
|---|---|---|
| `FLR_2024-2025.json` | Llamaradas solares (clase, inicio, pico, fin, región activa) | 1592 |
| `SEP_2024-2025.json` | Eventos de partículas solares energéticas | 179 |
| `GST_2024-2025.json` | Tormentas geomagnéticas con su índice Kp | 44 |
| `CME_2024-2025.csv` | Eyecciones de masa coronal, versión reducida: velocidad, ángulo y tipo del análisis más preciso (el JSON original pesa 6,5 MB) | 3167 |
| `summary_2024-2025.json` | Recuento por año y categoría | — |

## Frecuencias (resumen)
| Evento | 2024 | 2025 |
|---|---|---|
| Llamaradas clase X | 54 | 18 |
| Llamaradas clase M | 982 | 350 |
| Eventos SEP | 119 | 60 |
| Tormentas geomagnéticas G1 / G2 / G3 / G4 / G5 | 3 / 8 / 5 / 3 / 1 | 6 / 12 / 3 / 3 / 0 |
| CME (total / velocidad ≥ 1000 km/s) | 1512 / 121 | 1655 / 137 |

Escala G según el Kp máximo de cada tormenta: G1 = 5, G2 = 6, G3 = 7, G4 = 8, G5 = 9. La G5 de 2024 es la tormenta de mayo de 2024.

**Ojo:** el catálogo de llamaradas de DONKI recoge sobre todo las de clase M y X; las de clase C están muy incompletas, así que no hay que usarlas para calcular frecuencias. 2024–2025 fue el máximo del ciclo solar 25, así que estas frecuencias son de **actividad alta**.

## Uso en el juego
- **Eventos aleatorios con base real**: probabilidad por mes de misión = eventos al año / 12. Por ejemplo, unas 4 llamaradas X al mes en 2024 y unas 10 eventos SEP al mes.
- **Efectos**: las SEP afectan a la electrónica (fallos o reinicios) y a la tripulación (radiación); las tormentas geomagnéticas, al arrastre en LEO y a las comunicaciones.
- Encaja con el módulo de salud del equipo (`../09-future-work/modulo-salud.md`) y con el mazo de eventos (`eventos-aleatorios.md`).
