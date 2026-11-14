# NSSDCA Master Catalog (misiones reales de referencia)

> Web: https://nssdc.gsfc.nasa.gov/nmc/ (NASA Space Science Data Coordinated Archive, Goddard). Consultada el 2026-11-14.
> Datos extraídos: [`data/nssdca-reference-missions.csv`](data/nssdca-reference-missions.csv) (29 misiones)

## Qué es
El catálogo oficial de NASA con la ficha de cada nave lanzada: ID COSPAR, fecha, lanzador, sitio de lanzamiento, masa, potencia, agencia, disciplinas y descripción.

## Misiones incluidas
Elegidas por ser las que el juego de Webb usa como misión comparable, más ejemplos de cada tipo de misión (observación de la Tierra, Marte, planetas exteriores, asteroides, heliofísica):

James Webb · Chandra · Fermi · Swift · TESS · WISE · Spitzer · COBE · WMAP · GALEX · Kepler · RXTE · Compton (CGRO) · MAVEN · Juno · Landsat 9 · SMAP · LRO · DART · Dawn · OSIRIS-REx · Voyager 1 · Mars Reconnaissance Orbiter · New Horizons · Parker Solar Probe · ICESat-2 · Terra · Psyche · Mars 2020.

Columnas: `name, cospar_id, launch_date, launch_vehicle, launch_site, mass, nominal_power, funding_agency, disciplines, description (primeros 400 caracteres), source_url`. No se extrajeron los datos personales de la sección "Personnel" de cada ficha.

## Limitaciones
- No se encontraron por su ID COSPAR: Hubble (1990-037B), FUSE, Herschel, Suzaku, Europa Clipper y GRACE-FO. Habría que buscar su ID exacto en el catálogo.
- Algunas fichas no tienen masa (TESS, MAVEN, Landsat 9, SMAP) y casi ninguna tiene potencia nominal.
- La búsqueda por nombre de la web no devolvió resultados desde un script; se consultó cada ficha por su ID.

## Uso en el juego
- **"Tu misión se parece a…"** en la pantalla de resultados, como hace el juego de Webb.
- **Calibrar** los números del juego: un observatorio IR grande ronda varias toneladas (JWST 6500 kg); uno pequeño de UV, cientos de kg (GALEX 280 kg).
- Relación real **masa ↔ lanzador** (p. ej. GALEX en Pegasus XL, JWST en Ariane 5).
- Estimación de coste por analogía ([`../06-constraints/cost-estimating-handbook.md`](../06-constraints/cost-estimating-handbook.md)).
