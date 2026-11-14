# NASA Ames Trajectory Browser

> Web: https://trajbrowser.arc.nasa.gov/ (Mission Design Division, NASA Ames). Consultada el 2026-11-14.
> Datos extraídos: [`data/trajectory-browser-transfers-2026-2036.csv`](data/trajectory-browser-transfers-2026-2036.csv) (40 trayectorias)

## Qué es
Buscador de trayectorias **precalculadas** de la Tierra a planetas y asteroides cercanos (NEO). Para cada destino da fechas de salida y llegada, duración y Δv. Sirve para un estudio preliminar, no para un diseño de alta fidelidad.

## Supuestos (de la guía de usuario)
- **Δv de inyección**: desde una **LEO circular de 200 km**, calculado a partir del C3.
- **Δv de llegada a un planeta**: frenar hasta velocidad de escape (C3 = 0) a una distancia segura de la atmósfera. Quedarse en una órbita concreta requiere Δv adicional, que no está incluido.
- **Δv de llegada a un asteroide**: igualar su velocidad (se asume masa cero).
- **Δv total** = inyección + todas las maniobras posteriores.
- Problema de Lambert con aproximación de cónicas enlazadas: solo la gravedad del Sol en la fase heliocéntrica; sin perturbaciones, presión de radiación ni pérdidas por gravedad.
- Base de datos: lanzamientos de 2010 a 2040; Δv total máximo de 10 km/s en encuentros; duración máxima de 5 años solo ida y 10 años ida y vuelta; efemérides planetarias DE-421.

## Consultas guardadas (lanzamiento 2026–2036; la mejor solución de Δv por año)
| Destino | Tipo | Resultados | Δv total típico | Duración típica |
|---|---|---|---|---|
| Venus | solo ida, encuentro | 6 | 4,0–4,7 km/s | 112–192 días |
| Marte | solo ida, encuentro | 6 | 4,3–4,8 km/s (directas) | 176–304 días |
| Marte | ida y vuelta, encuentro | 5 | 5,1–7,0 km/s | 816–912 días |
| Júpiter | solo ida, encuentro | 5 | 8,3–9,8 km/s | 448–512 días |
| Saturno | solo ida, encuentro | 10 | 9,9–10,0 km/s | 1008–1088 días |
| Venus | ida y vuelta, sobrevuelo | 2 | 5,9 km/s | 304–352 días |
| Bennu (asteroide) | solo ida, encuentro | 2 | 7,1 km/s | 560–576 días |
| Didymos (asteroide) | solo ida, encuentro | 4 | 5,8–9,8 km/s | 528–1376 días |

Ejemplo: la ventana a Marte de **2026-10-23** necesita 3,62 km/s de inyección y 0,82 km/s de llegada (4,44 km/s en total), con 288 días de viaje.

## Columnas del CSV
`destination, mission_class, mission_type, traj_id, launch_date, end_date, duration_days, injection_dv_kms, post_injection_dv_kms, total_dv_kms, route`.
Las fechas se calculan a partir de los segundos desde J2000 que devuelve la web, así que pueden variar ±1 día. `route` incluye asistencias gravitatorias (p. ej. `Earth > Venus > Mars`).

## Limitaciones encontradas
- Mercurio no devolvió trayectorias dentro de los límites de la base de datos (necesita más de 10 km/s).
- Con duraciones máximas altas, la web devuelve 0 resultados; hubo que limitarlas por destino (1 año para Venus y Marte, 5 para los planetas exteriores).
- No cubre la Luna ni los puntos de Lagrange; para eso, GMAT ([`../05-launch-and-orbit/gmat.md`](../05-launch-and-orbit/gmat.md)).

## Uso en el juego
- Tabla de **destinos interplanetarios**: Δv, duración y **ventanas de lanzamiento reales** (por ejemplo, Marte cada ~26 meses).
- Con la ecuación del cohete, el Δv da la masa de propelente necesaria.
- El Δv de inyección se traduce en C3, que se puede cruzar con la capacidad del lanzador ([`../05-launch-and-orbit/lsp-launch-vehicle-performance.md`](../05-launch-and-orbit/lsp-launch-vehicle-performance.md)).

Ejemplo de consulta (URL reproducible):
`https://trajbrowser.arc.nasa.gov/traj_browser.php?NEAs=on&NECs=on&chk_maxMag=on&maxMag=25&chk_maxOCC=on&maxOCC=4&chk_target_list=on&target_list=Mars&mission_class=oneway&mission_type=rendezvous&LD1=2026&LD2=2036&maxDT=1&DTunit=yrs&maxDV=10&min=DV&wdw_width=365&submit=Search`
