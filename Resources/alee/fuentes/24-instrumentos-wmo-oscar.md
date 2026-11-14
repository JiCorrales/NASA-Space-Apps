# Catálogo de instrumentos: WMO OSCAR/Space

> Web: https://space.oscar.wmo.int/ (Observing Systems Capability Analysis and Review Tool, Organización Meteorológica Mundial). Consultado el 2026-11-14.
> Datos: [`../datos/wmo-oscar-nasa-instruments.csv`](../datos/wmo-oscar-nasa-instruments.csv) (323 instrumentos aportados por NASA) · [`../datos/wmo-oscar-instrument-type-summary.csv`](../datos/wmo-oscar-instrument-type-summary.csv) (resumen por tipo)

## Qué es
Base de datos de la WMO con los satélites y los instrumentos de observación de las agencias espaciales: unos 1250 instrumentos en total. Para cada uno da tipo, agencia, satélites, resolución y, en muchos casos, **masa, potencia y tasa de datos**. No es de NASA, pero los instrumentos filtrados aquí sí son de NASA (campo `providing-agency`).

Cubre la **observación de la Tierra** y la **heliofísica y el clima espacial** (espectrómetros de partículas, magnetómetros, monitores solares). **No cubre** telescopios de astrofísica ni instrumentos de sondas planetarias.

## Cómo se obtuvo
1. API oficial `https://space.oscar.wmo.int/api/v1/instruments` (42 páginas, 1256 instrumentos) → filtrar los aportados por NASA (323).
2. Masa, potencia y tasa de datos no están en la API: se leyeron de la ficha web de cada instrumento (`/instruments/view/<slug>`, URL en la columna `source_url`).

Cobertura: masa en 167 instrumentos, potencia en 157 y tasa de datos en 150; **136 tienen los tres**.

## Ejemplos (tal como los da OSCAR)
| Instrumento | Tipo | Masa | Potencia | Tasa de datos | Misión |
|---|---|---|---|---|---|
| MODIS | Imager óptico de resolución moderada | 250 kg | 225 W | 6,2 Mbps | Terra, Aqua |
| OLI | Imager óptico de alta resolución | 450 kg | 375 W | 265 Mbps | Landsat 8 y 9 |
| AIRS | Sondeador infrarrojo | 177 kg | 220 W | 1,27 Mbps | Aqua |
| CERES | Radiómetro de banda ancha | 57 kg | 50 W | 10 kbps | (OSCAR no lo indica) |
| OCI | Imager óptico | 272 kg | 237 W | — | PACE |
| EPAM | Espectrómetro de partículas | 6,4 kg | 6,5 W | 160 bps | ACE |

## Resumen por tipo (medianas de los instrumentos de NASA)
| Tipo | Masa (kg) | Potencia (W) | Tasa de datos |
|---|---|---|---|
| Espectrómetro de partículas | 8 | 9 | ~1 kbps |
| Sensor de campos y radioondas | 2,6 | 4 | ~3,5 kbps |
| Imager óptico de resolución moderada | 35 | 29 | ~1,1 Mbps |
| Imager óptico de alta resolución | 225 | 332 | ~95 Mbps |
| Lidar | 298 | 426 | ~0,8 Mbps |
| Sondeador infrarrojo | 36 | 29 | ~11 kbps |
| Radiómetro de microondas (barrido cónico) | 62 | 55 | ~17 kbps |
| Radar altímetro | 230 | 237 | ~23 kbps |
| Radar de apertura sintética (SAR) | 374 | 908 | — |
| Monitor de irradiancia solar | 13 | 12 | ~0,6 kbps |
| Sondeador GNSS de radio-ocultación | 3,9 | 15,5 | ~17 kbps |

Mínimos, máximos y número de datos de cada tipo en el CSV de resumen.

## Avisos
- Algunos valores parecen dudosos (p. ej. ATLAS de ICESat-2 con 450 bps de tasa de datos). Los valores son los publicados por OSCAR: **comprobar en la página de la misión** antes de presentarlos como dato.
- Las tasas de datos de OSCAR no siempre distinguen entre tasa media y tasa de pico.
- **Condiciones de uso no confirmadas**: el aviso legal (https://space.oscar.wmo.int/pages/disclaimer) no se pudo leer sin navegador. Revisarlo antes de usar los valores en el juego, como pide `CONTRIBUTING.md`.

## Uso en el juego
- **Catálogo de instrumentos** por tipo, con masa, potencia y tasa de datos reales: cada instrumento elegido suma masa y consumo, y genera datos que hay que bajar a tierra ([`13-dsn-link-design-handbook.md`](13-dsn-link-design-handbook.md)).
- Compromiso visible: un imager de alta resolución da mucho valor científico, pero pide unas 85 veces más tasa de datos y unas 11 veces más potencia que uno moderado (medianas).
- Para telescopios y sondas planetarias, usar como analogía las misiones de [`16-nssdca-master-catalog.md`](16-nssdca-master-catalog.md) y el árbol del juego de Webb ([`06-webb-build-it-yourself.md`](06-webb-build-it-yourself.md)).
