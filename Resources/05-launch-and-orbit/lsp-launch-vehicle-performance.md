# NASA LSP – Launch Vehicle Performance Website

> Web: https://elvperf.ksc.nasa.gov/ (Launch Services Program, Kennedy Space Center). Consultada con el navegador el 2026-11-14.
> Datos extraídos: [`data/lsp-launch-vehicle-performance.csv`](data/lsp-launch-vehicle-performance.csv)

## Qué es
Herramienta de NASA LSP con las **capacidades de carga de los lanzadores del contrato NLS II** (el que usa NASA para sus misiones científicas). Para cada tipo de órbita devuelve cuántos kg puede llevar cada lanzador, el diámetro de cofia y el adaptador.

Aviso de la propia web: los valores son los del contrato NLS II y pueden diferir de lo que anuncian los fabricantes. Sirven para planificación general.

## Tipos de consulta
| Tipo | Parámetros | Rango |
|---|---|---|
| LEO circular | Inclinación (0, 5, 10, 20, 28.5, 38, 45, 51.6, 60, 70, polar 90, heliosíncrona 98) y altitud | 200–2000 km |
| Elíptica | Inclinación y altitud de apogeo | 0–28.5°, 5000–100000 km |
| Alta energía | C3 (energía característica, km²/s²) | — |

**C3** = cuadrado de la velocidad hiperbólica de exceso; mide la energía para escapar de la Tierra. Referencias aproximadas (conocimiento general, no vienen de esta web): Luna ≈ −2, escape justo = 0, Marte/Venus ≈ 8–20, Júpiter ≈ 80.

## Consultas guardadas en el CSV
LEO 28,5°/400 km · LEO 51,6°/400 km (ISS) · heliosíncrona 500 y 700 km · GTO (apogeo 35786 km, 27°) · C3 = −2, 0, 10, 20, 80.

Ejemplos (kg):
| Órbita | Falcon 9 (ASDS) | Vulcan VC4 | Falcon Heavy (expendable) | Pegasus XL |
|---|---|---|---|---|
| LEO 28,5°/400 km | 15520 | 22310 | — | 400 |
| Heliosíncrona 500 km | 11740 | — | — | 260 |
| GTO | 5450 | 10740 | — | — |
| C3 = 10 (≈ Marte) | 2220 | 7140 | 12345 | — |
| C3 = 80 (≈ Júpiter) | — | 830 | 2195 | — |

## Lanzadores del contrato (página Vehicle Information, actualizada 2025-04-07)
Falcon 9 · Falcon Heavy · New Glenn · Pegasus · Starship · Vulcan. Falcon 9 aparece con dos niveles de rendimiento: **RTLS** (la primera etapa vuelve al sitio de lanzamiento, menos carga) y **ASDS** (aterriza en un barco, más carga).

## Uso en el juego
- Comprobar si la nave cabe: `masa_nave ≤ capacidad(lanzador, órbita)`, algo que el enunciado pide explícitamente.
- Para misiones interplanetarias, combinar con el C3 o el Δv de inyección de [`../09-future-work/trajectory-browser.md`](../09-future-work/trajectory-browser.md).
- **Faltan los precios**: la web no los publica. Hay que buscar otra fuente de NASA o marcarlos como [POR DEFINIR].
