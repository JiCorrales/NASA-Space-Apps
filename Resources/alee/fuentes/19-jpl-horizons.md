# JPL Horizons (efemérides de planetas)

> Web: https://ssd.jpl.nasa.gov/horizons/ · API: `https://ssd.jpl.nasa.gov/api/horizons.api` (JPL Solar System Dynamics). Consultada el 2026-11-14.
> Datos: [`../datos/horizons-elements-2026-11-14.csv`](../datos/horizons-elements-2026-11-14.csv)

## Qué es
Servicio de JPL que da posiciones, velocidades y elementos orbitales de cualquier cuerpo del sistema solar en cualquier fecha (efemérides DE441).

## Datos descargados
**Elementos orbitales osculantes** a fecha 2026-11-14 (TDB), plano de la eclíptica J2000:
- Mercurio, Venus, Tierra, Marte, Júpiter, Saturno, Urano y Neptuno, respecto al Sol.
- La Luna, respecto a la Tierra.

Columnas: excentricidad, inclinación, longitud del nodo ascendente (RAAN), argumento del periapsis, anomalías media y verdadera, semieje mayor (en UA y km) y periodo (días).
Comprobación: Marte, a = 1,5237 UA y periodo de 687 días; la Luna, a ≈ 382.600 km y 27,1 días.

## Uso en el juego
- Colocar los planetas en su **posición real** en la vista del sistema solar (orrery) y propagarlos con un modelo kepleriano simple. Es el mismo esquema de elementos que usa Mission Viz ([`05-mission-viz.md`](05-mission-viz.md)).
- Para otras fechas o cuerpos, repetir la consulta. Ejemplo:
  `https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND='499'&EPHEM_TYPE='ELEMENTS'&CENTER='500@10'&START_TIME='2026-11-14'&STOP_TIME='2026-11-15'&STEP_SIZE='1 d'&REF_PLANE='ECLIPTIC'&OUT_UNITS='AU-D'`
