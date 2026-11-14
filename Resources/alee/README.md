# Investigación de alee

Investigación de los 9 recursos oficiales del reto, hecha el 2026-11-14, con los PDFs originales descargados. Complementa la base de conocimiento de `Resources/` (archivos `01`–`09` de la carpeta superior) sin modificarla.

Empieza por **[00-sintesis-reto.md](00-sintesis-reto.md)**: qué pide el reto, qué aporta cada recurso, la cadena de compromisos que hay que modelar y una propuesta de estructura de juego.

## Estructura
```
alee/
├── README.md                    este índice
├── 00-sintesis-reto.md          síntesis para el reto
├── 01-pestana-recursos-oficial.md  copia del texto de la pestaña "Resources" del reto
├── fuentes/                     un resumen por recurso, en el orden de la pestaña oficial
│   ├── 01-design-and-develop-science-missions.md
│   ├── 02-gmat.md
│   ├── 03-concept-maturity-levels.md
│   ├── 04-mission-design-lab.md
│   ├── 05-mission-viz.md
│   ├── 06-webb-build-it-yourself.md
│   ├── 07-cubesat-101.md
│   ├── 08-space-apps-2023-vr-challenge.md
│   └── 09-csa-digital-games.md
└── pdf/                         documentos originales (NASA / JPL)
    ├── 250323-design-and-develop-science-mission.pdf
    ├── 13-3547_A1b.pdf          paper CML (JPL, 2013)
    ├── nasa_csli_cubesat_101_508.pdf
    ├── mission-viz/             4 PDFs de tutoriales y visión de Mission Viz
    └── webb-build-it-yourself/  transcripción oficial del juego (flujo + resultados de los 3 niveles)
```

## Pendientes de `../09-pendientes.md` que esta investigación resuelve
| Pendiente | Resuelto en |
|---|---|
| Confirmar la lista de 9 recursos en la pestaña oficial | `01-pestana-recursos-oficial.md` |
| PDF "Design and Develop Science Missions" no abierto (segmentos y fases sin verificar) | `fuentes/01` + PDF |
| CML: escala de 5 o 9 niveles, definiciones oficiales | `fuentes/03` + PDF (son 9 niveles; el paper se centra en 1–4) |
| Licencia de GMAT | `fuentes/02`: Apache 2.0 (según SourceForge) |
| README de Mission Viz | `fuentes/05` (la licencia sigue sin confirmar: el LICENSE da 404) |
| Reto VR 2023 "sin contenido" | `fuentes/08`: texto completo y lista de recursos (leído con navegador) |
| CSA sin leer | `fuentes/09` |
| PDFs de resultados del juego Webb | `fuentes/06` + PDFs: tabla completa combinación → misión real de los 3 niveles. La contradicción del nivel 3 (4 objetivos pero 3 longitudes de onda "una por objetivo") **sigue**: la transcripción lo dice así |
| CubeSat 101: 437/140 MHz, 6,5 mm, ETU + FlatSat + 2 unidades de vuelo, LightSail-2 1,24 M$, NPSCul-Lite, entrega de 4 semanas a 6 meses | `fuentes/07` + PDF (aparecen en el documento completo) |

## Notas
- La sección 6 de la síntesis (datos de referencia de órbitas, Δv, potencia y comunicaciones) es **conocimiento general, no procede de los recursos**. Verificarla antes de presentarla como dato de NASA.
- En el PDF CML, la matriz de 24 filas y la checklist CML 4 son imágenes; no hay transcripción.
