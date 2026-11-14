# Investigación de alee

Investigación de los 9 recursos oficiales del reto y de fuentes de datos adicionales de NASA para los números del juego (componentes, lanzadores, trayectorias, comunicaciones, costes, clima espacial, misiones reales). Hecha el 2026-11-14, con los documentos y datos originales descargados. Complementa la base de conocimiento de `Resources/` (archivos `01`–`09` de la carpeta superior) sin modificarla.

Empieza por **[sintesis-reto.md](sintesis-reto.md)**: qué pide el reto, qué aporta cada recurso, la cadena de compromisos que hay que modelar y una propuesta de estructura de juego. Los datos listos para usar están en **[datos-descargados.md](datos-descargados.md)**.

## Estructura
```
alee/
├── README.md                       este índice
├── 00-sintesis-reto.md             síntesis para el reto
├── 01-pestana-recursos-oficial.md  copia del texto de la pestaña "Resources" del reto
├── fuentes/                        una ficha por fuente
│   │  Recursos oficiales del reto (orden de la pestaña)
│   ├── 01-design-and-develop-science-missions.md
│   ├── 02-gmat.md
│   ├── 03-concept-maturity-levels.md
│   ├── 04-mission-design-lab.md
│   ├── 05-mission-viz.md
│   ├── 06-webb-build-it-yourself.md
│   ├── 07-cubesat-101.md
│   ├── 08-space-apps-2023-vr-challenge.md
│   ├── 09-csa-digital-games.md
│   │  Fuentes adicionales de NASA para los datos del juego
│   ├── 10-small-spacecraft-soa-2026.md     catálogo de componentes por subsistema
│   ├── 11-lsp-launch-vehicle-performance.md capacidad de lanzadores por órbita
│   ├── 12-trajectory-browser.md            Δv y ventanas a planetas y asteroides
│   ├── 13-dsn-link-design-handbook.md      comunicaciones de espacio profundo
│   ├── 14-cost-estimating-handbook.md      cómo estima NASA los costes
│   ├── 15-systems-engineering-handbook.md  fases, revisiones y TRL
│   ├── 16-nssdca-master-catalog.md         misiones reales de referencia
│   ├── 17-donki-space-weather.md           clima espacial real (eventos aleatorios)
│   ├── 18-debris-assessment-software.md    basura orbital y regla de 25 años
│   ├── 19-jpl-horizons.md                  posiciones de los planetas
│   ├── 20-nasa-lessons-learned-llis.md     fallos reales (sin descarga)
│   ├── 21-exoplanet-archive.md             exoplanetas como resultados científicos
│   ├── 22-recursos-visuales.md             modelos 3D, texturas e imágenes (sin descarga)
│   ├── 23-costes-nasa.md                   precios de lanzamiento, $/kg, topes por clase, PCEC
│   └── 24-instrumentos-wmo-oscar.md        catálogo de instrumentos (masa, potencia, datos)
├── datos/                          CSV/JSON listos para el juego (ver datos/README.md)
│   ├── lsp-launch-vehicle-performance.csv
│   ├── trajectory-browser-transfers-2026-2036.csv
│   ├── nssdca-reference-missions.csv
│   ├── horizons-elements-2026-11-14.csv
│   ├── exoplanet-archive-pscomppars.csv
│   ├── nasa-launch-service-awards.csv        precio real de 13 lanzamientos de NASA
│   ├── launch-cost-per-kg-leo-ntrs.csv       coste por kg a LEO, 1957–2018
│   ├── nasa-mission-cost-caps.csv            topes de coste por clase de misión
│   ├── wmo-oscar-nasa-instruments.csv        instrumentos de NASA con masa, potencia y datos
│   └── donki/                      llamaradas, SEP, tormentas, CME y resumen
└── pdf/                            documentos originales (NASA / JPL)
    ├── 250323-design-and-develop-science-mission.pdf
    ├── 13-3547_A1b.pdf                       paper CML (JPL, 2013)
    ├── nasa_csli_cubesat_101_508.pdf
    ├── small-spacecraft-soa-2026.pdf         State-of-the-Art (NASA/TP-20260003140)
    ├── nasa-systems-engineering-handbook-rev2.pdf
    ├── nasa-cost-estimating-handbook-v4-main-body.pdf
    ├── das-3.2-users-guide.pdf
    ├── dsn-810-005/                          10 módulos del manual de enlaces de la DSN
    ├── costes/                               coste por kg, topes MOCET, NF5, PCEC y apéndice E del CEH
    ├── mission-viz/                          4 PDFs de tutoriales y visión de Mission Viz
    └── webb-build-it-yourself/               transcripción oficial del juego
```

## Pendientes de `pendientes.md` que esta investigación resuelve
| Pendiente | Resuelto en |
|---|---|
| Confirmar la lista de 9 recursos en la pestaña oficial | `pestana-recursos-oficial.md`. Comprobado de nuevo en la web oficial de 2026 el 2026-11-14: mismos 9 recursos |
| PDF "Design and Develop Science Missions" no abierto (segmentos y fases sin verificar) | `../02-requirements/design-and-develop-science-missions.md` + PDF |
| Fases del ciclo de vida de una misión [SIN VERIFICAR] | `../02-requirements/systems-engineering-handbook.md` (Systems Engineering Handbook: Pre-Fase A a Fase F) |
| CML: escala de 5 o 9 niveles, definiciones oficiales | `../02-requirements/concept-maturity-levels.md` + PDF (son 9 niveles; el paper se centra en 1–4) |
| Licencia de GMAT | `../05-launch-and-orbit/gmat.md`: Apache 2.0 (según SourceForge) |
| README de Mission Viz | `../08-game-design/mission-viz.md` (la licencia sigue sin confirmar: el LICENSE da 404) |
| Reto VR 2023 "sin contenido" | `../08-game-design/space-apps-2023-vr-challenge.md`: texto completo y lista de recursos (leído con navegador) |
| CSA sin leer | `../08-game-design/csa-digital-games.md` |
| PDFs de resultados del juego Webb | `../01-mission-objective/webb-build-it-yourself.md` + PDFs: tabla completa combinación → misión real de los 3 niveles. La contradicción del nivel 3 (4 objetivos pero 3 longitudes de onda "una por objetivo") **sigue**: la transcripción lo dice así |
| CubeSat 101: 437/140 MHz, 6,5 mm, ETU + FlatSat + 2 unidades de vuelo, LightSail-2 1,24 M$, NPSCul-Lite, entrega de 4 semanas a 6 meses | `../03-spacecraft/cubesat-101.md` + PDF (aparecen en el documento completo) |
| Regla de 25 años de desorbitado y límite de 100 objetos-año | `../05-launch-and-orbit/debris-assessment-software.md`: requisito 4.3-1 de NASA, citado en la guía de DAS |
| Lanzadores y capacidades actuales (la lista de CubeSat 101 es de 2017) | `../05-launch-and-orbit/lsp-launch-vehicle-performance.md` + `../05-launch-and-orbit/data/lsp-launch-vehicle-performance.csv`; lanzadores pequeños en `../03-spacecraft/small-spacecraft-soa-2026.md` (tabla 10-1) |
| Valores de presupuesto por decisión (decisión del equipo, sin fuente) | `../06-constraints/costes-nasa.md`: precios reales de lanzamiento, coste por kg, topes por clase de misión y modelo PCEC como base |
| Mecánica de masa, potencia y datos por instrumento (sin fuente) | `../04-instruments/instrumentos-wmo-oscar.md` + `../04-instruments/data/wmo-oscar-nasa-instruments.csv` |

## Lo que sigue faltando
- **Precio de cada componente** (un panel o una radio concretos): NASA no lo publica. Usar un modelo paramétrico inspirado en PCEC (`../06-constraints/costes-nasa.md`) o rangos [POR DEFINIR].
- **Precio de cada lanzamiento pequeño** (VADR, p. ej. Electron): NASA no publica el de cada orden.
- **Instrumentos de astrofísica y ciencia planetaria**: WMO OSCAR (`../04-instruments/instrumentos-wmo-oscar.md`) cubre sobre todo la observación de la Tierra y el clima espacial. Para telescopios y sondas planetarias, usar las misiones de `../01-mission-objective/data/nssdca-reference-missions.csv` como analogía.
- Licencia de Mission Viz.

## Notas
- La sección 6 de la síntesis (datos de referencia de órbitas, Δv, potencia y comunicaciones) es **conocimiento general, no procede de los recursos**. Ahora puede sustituirse por los datos de `datos-descargados.md` (lanzadores, Δv, misiones reales).
- En el PDF CML, la matriz de 24 filas y la checklist CML 4 son imágenes; no hay transcripción.
