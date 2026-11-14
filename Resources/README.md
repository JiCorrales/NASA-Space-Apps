# Resources: research index

Research for the NASA Space Apps Challenge 2026 "Space Mission Design Game", arranged by the objectives
of the challenge statement ([00-challenge/Enunciado.md](00-challenge/Enunciado.md), section
"Objetivos"). Each objective has a folder with the source notes whose main use is that objective and a
`<objective>/data/` subfolder with the extracts that belong to it. A source that serves several objectives lives
under its main one and is listed again in the rows of the others.

**Language:** this index is in English. The notes themselves are still in Spanish and will be translated
separately.

This index describes the research, not the game: it says nothing about what is or is not built.

## Verification labels

Every fact in the notes carries one of these labels:

- **[VERIFICADO-NASA]**: read on an official NASA page or PDF during the review of 14 November 2026.
- **[VERIFICADO-ENUNCIADO]**: comes from the challenge statement the team received.
- **[VERIFICADO-GUÍA]**: read in the submission or judging guides on spaceappschallenge.org. Their dates
  are from 2024 and 2025.
- **[SIN VERIFICAR]**: the source could not be opened, it comes from a third party (for example
  Athlone), or it comes from an earlier reading that was not reconfirmed.
- **[DERIVADO]**: our own calculation or proposal from verified data. Review it before presenting it.
- **[POR DEFINIR]**: a value the team must decide. No source fixes it.
- **[DISCREPANCIA]**: two notes on the same source disagree. Both statements are kept side by side in
  that note; neither has been chosen.

Nothing labelled [SIN VERIFICAR] may be presented as NASA data in the demo or the documentation.

## The challenge

| Note | What it holds |
|---|---|
| [Enunciado.md](00-challenge/Enunciado.md) | The challenge statement, in Spanish |
| [reto.md](00-challenge/reto.md) | Summary of the challenge: goal, considerations, judging criteria, awards, dates, citation rules |
| [sintesis-reto.md](00-challenge/sintesis-reto.md) | Synthesis: what the challenge asks, what each resource gives, the trade-off chain, a proposed game structure |
| [pestana-recursos-oficial.md](00-challenge/pestana-recursos-oficial.md) | Copy of the official "Resources" tab of the challenge |
| [recursos-nasa.md](00-challenge/recursos-nasa.md) | The nine official resources and the state of the information on each |
| [requerimientos-proyecto.md](00-challenge/requerimientos-proyecto.md) | What the project must meet to be judged and eligible for awards, with origin and status |
| [referencias.md](00-challenge/referencias.md) | Bibliography with links and access status, and a citation template |
| [pendientes.md](00-challenge/pendientes.md) | What could not be confirmed and must be checked before it is presented |
| [base-de-conocimiento.md](00-challenge/base-de-conocimiento.md) | The previous index of this folder (team notes), kept as written |
| [investigacion-alee.md](00-challenge/investigacion-alee.md) | alee's research overview: which open checks it resolved and what is still missing. Its folder tree shows the layout before this reorganization |
| [datos-descargados.md](00-challenge/datos-descargados.md) | Catalogue of every data extract: source, contents and how it was obtained |

## Objectives

| Objective (statement) | Notes | Data | Open points named in the notes |
|---|---|---|---|
| **1. Define a mission objective** ([01-mission-objective/](01-mission-objective/)) | [webb-build-it-yourself.md](01-mission-objective/webb-build-it-yourself.md): NASA's Webb game, where the science goal decides wavelength, instrument and optics, with the comparable real mission for each choice. [nssdca-master-catalog.md](01-mission-objective/nssdca-master-catalog.md): real missions by type, for "your mission looks like..." and calibration. Also: [design-and-develop-science-missions.md](02-requirements/design-and-develop-science-missions.md) ("start with the end in mind"), CML 1 in [concept-maturity-levels.md](02-requirements/concept-maturity-levels.md) | [nssdca-reference-missions.csv](01-mission-objective/data/nssdca-reference-missions.csv): 29 missions with launcher, date, mass and disciplines | Some catalogue records have no mass, and Hubble, FUSE, Herschel, Suzaku, Europa Clipper and GRACE-FO were not found |
| **2. Set the mission requirements** ([02-requirements/](02-requirements/)) | [design-and-develop-science-missions.md](02-requirements/design-and-develop-science-missions.md): NASA webinar on the four mission segments and deriving verifiable requirements from the end product. [concept-maturity-levels.md](02-requirements/concept-maturity-levels.md): JPL's nine concept maturity levels, checklists and the 80 % rule. [systems-engineering-handbook.md](02-requirements/systems-engineering-handbook.md): NASA life cycle, reviews, TRL and verification | None | The CML matrix and CML 4 checklist are images in the PDF; CML 6 to 9 are marked [DISCREPANCIA] |
| **3. Design a spacecraft** ([03-spacecraft/](03-spacecraft/)) | [cubesat-101.md](03-spacecraft/cubesat-101.md): NASA CSLI guide on CubeSat sizes, dispensers, phase durations, costs, licences and tests. [small-spacecraft-soa-2026.md](03-spacecraft/small-spacecraft-soa-2026.md): NASA catalogue of real small-spacecraft components per subsystem. Also: subsystems and the equipment list in [mission-design-lab.md](08-game-design/mission-design-lab.md); formats and dispensers in [reglas-diseno.md](08-game-design/reglas-diseno.md) | None | NASA publishes no price per component; several CubeSat facts are marked [DISCREPANCIA] |
| **4. Select science instruments** ([04-instruments/](04-instruments/)) | [instrumentos-wmo-oscar.md](04-instruments/instrumentos-wmo-oscar.md): WMO OSCAR catalogue of NASA instruments with mass, power and data rate. Also: the instrument tree in [webb-build-it-yourself.md](01-mission-objective/webb-build-it-yourself.md); rule F in [reglas-diseno.md](08-game-design/reglas-diseno.md) | [wmo-oscar-nasa-instruments.csv](04-instruments/data/wmo-oscar-nasa-instruments.csv): 323 instruments. [wmo-oscar-instrument-type-summary.csv](04-instruments/data/wmo-oscar-instrument-type-summary.csv): median, minimum and maximum per instrument type | OSCAR covers mostly Earth observation and space weather; its terms of use are unconfirmed |
| **5. Choose a launch vehicle and an orbit** ([05-launch-and-orbit/](05-launch-and-orbit/)) | [lsp-launch-vehicle-performance.md](05-launch-and-orbit/lsp-launch-vehicle-performance.md): NASA Launch Services Program capacity per vehicle and orbit. [gmat.md](05-launch-and-orbit/gmat.md): NASA's mission analysis tool, for precomputing orbits and delta-v offline. [debris-assessment-software.md](05-launch-and-orbit/debris-assessment-software.md): NASA debris rules (25-year orbital life, 100 object-years). Also: launchers and dispensers in [cubesat-101.md](03-spacecraft/cubesat-101.md); launch prices in [costes-nasa.md](06-constraints/costes-nasa.md); orbit visualization in [mission-viz.md](08-game-design/mission-viz.md); rules D and E in [reglas-diseno.md](08-game-design/reglas-diseno.md) | [lsp-launch-vehicle-performance.csv](05-launch-and-orbit/data/lsp-launch-vehicle-performance.csv): capacity in kg per vehicle for LEO, sun-synchronous, GTO and C3 | NASA does not publish the price of each small launch order; GMAT binaries were not downloaded |
| **6. Manage the constraints** (budget, mass, power, communications, data, time) ([06-constraints/](06-constraints/)) | [costes-nasa.md](06-constraints/costes-nasa.md): real launch prices, cost per kg, cost caps per mission class and the PCEC parametric model. [cost-estimating-handbook.md](06-constraints/cost-estimating-handbook.md): how NASA estimates cost and reserves. Also: budget, reserve, phase durations and ground station in [cubesat-101.md](03-spacecraft/cubesat-101.md); power and communications components in [small-spacecraft-soa-2026.md](03-spacecraft/small-spacecraft-soa-2026.md); mass, power and data per instrument in [instrumentos-wmo-oscar.md](04-instruments/instrumentos-wmo-oscar.md); time in [fases-mision.md](08-game-design/fases-mision.md); rules G to L in [reglas-diseno.md](08-game-design/reglas-diseno.md) | [nasa-launch-service-awards.csv](06-constraints/data/nasa-launch-service-awards.csv): 13 NASA launches with total cost. [launch-cost-per-kg-leo-ntrs.csv](06-constraints/data/launch-cost-per-kg-leo-ntrs.csv): cost per kg to LEO, 1957 to 2018. [nasa-mission-cost-caps.csv](06-constraints/data/nasa-mission-cost-caps.csv): cost caps per mission class | Budget values per decision are a team decision ([pendientes.md](00-challenge/pendientes.md)) |
| **Simulation and evaluation** ([07-simulation-and-events/](07-simulation-and-events/)) | [eventos-aleatorios.md](07-simulation-and-events/eventos-aleatorios.md): the team's deck of random events. [donki-space-weather.md](07-simulation-and-events/donki-space-weather.md): real space weather events from NASA DONKI. [nasa-lessons-learned-llis.md](07-simulation-and-events/nasa-lessons-learned-llis.md): NASA lessons learned, for events with a real cause and for the post-mission analysis. Also: comparable real missions in [nssdca-master-catalog.md](01-mission-objective/nssdca-master-catalog.md) and [webb-build-it-yourself.md](01-mission-objective/webb-build-it-yourself.md); the "is it ready" checklist in [concept-maturity-levels.md](02-requirements/concept-maturity-levels.md); the simulation screen ideas in [mission-viz.md](08-game-design/mission-viz.md) | [data/donki/](07-simulation-and-events/data/donki/): flares, solar energetic particles, geomagnetic storms and CMEs of 2024 and 2025, with a frequency summary | The event deck is [SIN VERIFICAR] and the effect of each event is [POR DEFINIR] |
| **Collaboration (up to four players)** ([08-game-design/](08-game-design/)) | [mission-design-lab.md](08-game-design/mission-design-lab.md): Goddard's study levels and disciplines, the basis for player roles. Also: the four proposed roles in [sintesis-reto.md](00-challenge/sintesis-reto.md) (section 5) | None | The roles are a team proposal [DERIVADO]; no source defines game roles |
| **Feedback and educational value** ([08-game-design/](08-game-design/)) | [reglas-diseno.md](08-game-design/reglas-diseno.md): the team's design rules per decision, with sources. [fases-mision.md](08-game-design/fases-mision.md): mission life cycle and the proposed game phases. [mission-viz.md](08-game-design/mission-viz.md): NASA web orbit visualizations and tutorials. [space-apps-2023-vr-challenge.md](08-game-design/space-apps-2023-vr-challenge.md): an earlier Space Apps challenge on visualizing missions. [csa-digital-games.md](08-game-design/csa-digital-games.md): the Canadian Space Agency's educational games. [recursos-visuales.md](08-game-design/recursos-visuales.md): NASA 3D models, textures and images, with the repo rules for using them. Also: the concepts the game should teach in [sintesis-reto.md](00-challenge/sintesis-reto.md) (section 3) and the "why" explanations in [webb-build-it-yourself.md](01-mission-objective/webb-build-it-yourself.md) | None | The Mission Viz licence is unconfirmed; the visual resources were not downloaded |

## Future work

The first version is a single uncrewed CubeSat mission in low Earth orbit. These notes have no objective
in it and are kept for later versions ([09-future-work/](09-future-work/)):

| Note | What it holds | Data |
|---|---|---|
| [modulo-salud.md](09-future-work/modulo-salud.md) | The crew health module idea: NASA hazards, related risks and proposed rules | None |
| [nasa-hrp-hazards-risks-research.md](09-future-work/nasa-hrp-hazards-risks-research.md) | NASA Human Research Program hazards, risks and ongoing research | None |
| [datos-externos.md](09-future-work/datos-externos.md) | Data outside the official list (NOAA, NASA OSDR, communication delays); mostly [SIN VERIFICAR] | None |
| [trajectory-browser.md](09-future-work/trajectory-browser.md) | NASA Ames transfers to planets and asteroids: dates, duration and delta-v | [trajectory-browser-transfers-2026-2036.csv](09-future-work/data/trajectory-browser-transfers-2026-2036.csv) |
| [jpl-horizons.md](09-future-work/jpl-horizons.md) | JPL orbital elements of the planets | [horizons-elements-2026-11-14.csv](09-future-work/data/horizons-elements-2026-11-14.csv) |
| [exoplanet-archive.md](09-future-work/exoplanet-archive.md) | Confirmed exoplanets as possible science results | [exoplanet-archive-pscomppars.csv](09-future-work/data/exoplanet-archive-pscomppars.csv) |
| [dsn-link-design-handbook.md](09-future-work/dsn-link-design-handbook.md) | Deep Space Network link design modules | PDFs in [pdf/dsn-810-005/](pdf/dsn-810-005/) |

## Source documents

All downloaded PDFs are in [pdf/](pdf/), in their original subfolders. The note for each source links to
its PDF.

## Where to add a new note

1. Put it in the folder of the objective it mainly serves, with a plain name and no number prefix.
   If it serves none of the first version's objectives, put it in `09-future-work/`.
2. Put its data extract in `<objective>/data/` and its PDF in `pdf/`.
3. Label every fact with the tags above, add the source to [CREDITS.md](../CREDITS.md) if the game uses
   it, and add a row (or an "Also" mention) to the table here.
4. If a note on the same source already exists, add to it instead of starting a second one.
