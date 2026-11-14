# Recursos visuales de NASA (modelos 3D, texturas e imágenes)

> Revisados el 2026-11-14. **No se descargaron**: son colecciones grandes (modelos de cientos de MB, texturas TIFF enormes) y lo que haga falta depende de lo que decida el equipo de arte. Aquí están las fuentes y las reglas para usarlas.

## Fuentes
| Fuente | URL | Qué tiene | Uso en el juego |
|---|---|---|---|
| NASA 3D Resources | https://science.nasa.gov/3d-resources/ · repositorio: https://github.com/nasa/NASA-3D-Resources | Modelos 3D de naves, planetas y lunas; texturas | Modelos de referencia para la nave y los cuerpos celestes |
| Scientific Visualization Studio (SVS) | https://svs.gsfc.nasa.gov/ | Texturas de alta resolución (p. ej. *CGI Moon Kit*, Blue Marble), animaciones y vídeos | Texturas de la Tierra y la Luna para Unity |
| NASA Worldview / Earthdata | https://worldview.earthdata.nasa.gov/ | Imágenes de satélite diarias de toda la Tierra | "Datos obtenidos" en misiones de observación de la Tierra |
| NASA Image and Video Library | https://images.nasa.gov/ | Fotos y vídeos de NASA | Imágenes de apoyo en pantallas y tutoriales |

## Reglas del repo que aplican (`CONTRIBUTING.md`)
- **Sin logos, banderas ni identificadores de misión de NASA.** Muchos modelos 3D de naves reales llevan la insignia en las texturas: revisarlas y quitarla antes de importar.
- **Sin imágenes, vídeo ni audio de menores de 18 años.**
- **Cada recurso importado va a `CREDITS.md`** (nombre, autor, enlace y licencia) en el mismo commit. Los recursos descargados van en `Assets/ThirdParty/<fuente>/` y no se editan en su sitio.
- **Ningún archivo de más de 100 MB** (GitHub lo rechaza). Las texturas de SVS suelen ser enormes: descargar resoluciones de 2K–4K.

## Recomendación
Cuando el equipo de arte decida qué hace falta (Tierra, Luna, Marte, un modelo base de nave), descargar solo eso, con su licencia y comprobando que no lleva insignias.
