# NASA Exoplanet Archive

> Web: https://exoplanetarchive.ipac.caltech.edu/ (operado por IPAC/Caltech para NASA). Consultado el 2026-11-14.
> Datos: [`data/exoplanet-archive-pscomppars.csv`](data/exoplanet-archive-pscomppars.csv) (6470 planetas confirmados, 752 KB)

## Qué es
El archivo oficial de NASA de exoplanetas confirmados, con sus parámetros y la misión u observatorio que los descubrió.

## Consulta usada (TAP)
`https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+pl_name,hostname,discoverymethod,disc_year,disc_facility,pl_orbper,pl_rade,pl_bmasse,pl_eqt,sy_dist+from+pscomppars+order+by+disc_year&format=csv`

Tabla `pscomppars`: una fila por planeta, combinando los mejores parámetros publicados.

| Columna | Significado |
|---|---|
| `pl_name`, `hostname` | Planeta y estrella |
| `discoverymethod` | Tránsito, velocidad radial, imagen directa, microlente… |
| `disc_year`, `disc_facility` | Año e instalación del descubrimiento (p. ej. Kepler, TESS) |
| `pl_orbper` | Periodo orbital (días) |
| `pl_rade`, `pl_bmasse` | Radio y masa (en radios y masas terrestres) |
| `pl_eqt` | Temperatura de equilibrio (K) |
| `sy_dist` | Distancia al sistema (pársecs) |

## Uso en el juego
- **Resultados reales** para misiones de exoplanetas: si el jugador construye un telescopio de tránsitos, mostrar planetas que descubrieron misiones parecidas (`disc_facility` = Kepler, TESS…).
- **Relación instrumento ↔ método**: tránsito necesita fotometría precisa (cámara óptica); imagen directa necesita coronógrafo o IR. Encaja con el árbol de decisiones del juego de Webb ([`../01-mission-objective/webb-build-it-yourself.md`](../01-mission-objective/webb-build-it-yourself.md)).
