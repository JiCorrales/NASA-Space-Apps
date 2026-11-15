# Crew health on Mars: hazards, radiation, gravity, work outside, life support, sleep, medicine, dust

> Webs: NASA Human Research Program and OCHMO (Office of the Chief Health and Medical Officer) pages listed per row. Accessed 2026-11-15.
> Data: rows `HL01` to `HL41` of [`data/mars-surface-numbers.csv`](data/mars-surface-numbers.csv)

Kinds: **[MEDIDO]** measured, **[PLAN]** a NASA requirement, study or design basis, **[DERIVADO]** our arithmetic, **[NOT FOUND]**. Almost every life-support and EVA figure below is a design requirement, not a measurement on Mars.

## 1. The five hazards
NASA, "5 Hazards of Human Spaceflight" (updated 2026-06-12), official wording:
1. Space Radiation: "considered one of the most hazardous aspects of spaceflight."
2. Isolation and Confinement: "Behavioral responses occur among groups of people far from Earth." Sleep loss, disrupted body clocks and heavy workloads "may lead to decreased performance, adverse health outcomes, and compromised mission objectives" (isolation page).
3. Distance from Earth: supplies, instructions and medical care "become increasingly challenging to receive from Earth."
4. Gravity Fields: "muscles, bones, inner ear, and organs" must adjust to changing gravity.
5. Hostile/Closed Environments: "Maintaining a safe ecosystem inside a spacecraft presents unique challenges" (immune responses, microbial communities).

NASA's page lists no body effects for hazards 1 and 3. Which matter on the Mars surface is our reading **[DERIVADO]**: all five apply; gravity (0.38 g) and dust are the surface-specific parts. The radiation and gravity detail pages (`hrp/hazard-radiation`, `hrp/hazard-altered-gravity`) returned 404, so the radiation effects below come from the OCHMO brief.

## 2. Radiation and health
- Surface dose 0.67 mSv per day (Curiosity RAD, **[MEDIDO]**); our conversion 0.69 mSv per sol **[DERIVADO]**. See [`mars-radiation.md`](mars-radiation.md) for cruise, round trip (about 1,000 mSv, NASA 2013 projection) and the 2017 and 2024 events.
- Limits **[PLAN]**: career 600 mSv; 250 mSv per solar particle event; habitat design 0.9 mSv per day on a planetary surface (OCHMO-TB-020).
- What a solar particle event does: "Acute radiation syndromes, such as nausea, vomiting, and fatigue ... as well as skin injuries and depletion of blood-forming organs."
- Shelter: "Shielding (5-20 g/cm2 aluminum and polyethylene) IS effective" against solar particle events; shielding is "NOT effective" against galactic cosmic rays because of secondary radiation. The table lists Mars at 42 g/cm2 (atmosphere), the Apollo lunar module at 4 and an Apollo suit at 2. NASA gives no percentage of dose avoided.

## 3. Gravity
- Mars gravity is 0.380 of Earth's (Fact Sheet).
- Microgravity, ISS **[MEDIDO]**: "For every month in space, astronauts' weight-bearing bones become roughly 1% less dense if they don't take precautions"; "Crews exercise for an average of two hours a day" (NASA ISS Research, 2023-12-01). Past requirement: "2 hours per workday", 6 to 7 sessions per week; 45 days of reconditioning after return (bone loss brief, 2026).
- Partial gravity: "At present we know little about the effects of intermediate G levels, for example the 0.38G of Mars or the 0.17G of the Moon ... do not know if intermediate G levels will have beneficial effects or if fields of 1G or greater will be required" (Gravity as a Continuum). **[NOT FOUND]**: any measured loss rate at 0.38 g. Do not scale the ISS number by 0.38.

## 4. Work outside (EVA)
| Quantity | Value | Kind |
|---|---|---|
| Typical ISS spacewalk | 6 to 8 h, plus 2 to 3 h of suit preparation and re-pressurization | measured |
| Apollo 17 surface EVAs | three, 22 h 4 min in total, 7 h 12 min and 7 h 37 min for the first two; 75 h on the surface | measured |
| Suit pressure (ISS EMU) | 4.3 psid (29.6 kPa) | measured |
| Prebreathe-related oxygen cap | 6 h in 24 h or 9 h in 48 h | plan |
| EVA drinking water | at least 240 mL per hour | plan |
| Metabolic rate of Apollo lunar surface EVA | average 1,030 kJ/h (517 to 2,607) | measured |
| Lunar habitat EVA design (Moon, not Mars) | 24 h per week per crew, one two-person 8 h EVA per 24 h, 8 EVAs from the habitat | plan |
| Mars EVA hours per week | **[NOT FOUND]** | |

NASA: "The duration of surface (i.e., lunar, Mars) EVAs may be similar to those at 0g in terms of consumables, but activities will likely require much greater energy expenditure". EVA duration is "typically limited by suit consumables, such as O2". Surface suits for EVAs over 4 hours need a nutrition means.

## 5. Life support per person per day (design basis, plan)
OCHMO-TB-002: oxygen 0.771 kg at rest, +0.376 kg per exercise session (1.083 kg with 120 min exercise; 75 kg person); water minimum 2.5 L (drinking); food average 3,035 kcal; 3.870 kg of water leaves by breath and sweat; CO2 produced about 350 L at 2,000 kcal; cabin CO2 average under 3 mmHg over one hour; oxygen 145 to 155 mmHg. **[NOT FOUND]** food mass per person: the NASA baseline-values document was not found. MOXIE: 122 g in total, peak 12 g/h **[MEDIDO]**; 122 g is about 3.8 hours of one person at rest (our division **[DERIVADO]**).

## 6. Sleep, workload, isolation
- Sleep: adults need "7-9 hours" (reference quoted by NASA); "astronauts sleep an average of about six hours while in space" (OCHMO-TB-041); shuttle crews about 6.5 h (STS-90 and STS-95 study).
- The sol is about 24 h 39 m: the Curiosity team worked on Mars time for three months, which "often resulted in the team working overnight hours, Pacific Time", then returned to regular hours; planning went from over 16 h to 12 h (JPL 2012-11-06). The MER Mars-time paper was not read beyond its abstract.
- Analogs: CHAPEA mission 1, 4 crew, 378 days (2023-06-25 to 2024-07-06), delays up to 44 minutes round trip, no health findings published in the release; HERA, 4 crew, up to 45 days, delays up to 5 minutes each way; HI-SEAS 2015, **6** crew, 8 months, social dynamics. Crews of four are the NASA norm in HERA, CHAPEA and the Mars medical concept; HI-SEAS and DRA 5.0 used six. **[DISCREPANCIA]** between sources on crew size, not an error.

## 7. Medical
- NASA, "Hazard: Distance From Earth": "Facing a communication delay of up to 20 minutes one way" and "planning and self-sufficiency will be essential".
- Mars medical concept (HRP-48021): about 22 minutes one way, "about 44 minutes round trip"; blackouts of 2 weeks every 2 years; maximum four crew, "at least one crewmember will have physician-level medical training", plus an assistant medical officer; no emergency evacuation, definitive care "on the order of days, weeks, or months". **[PLAN]**
- **[NOT FOUND]** a Mars medical kit list. A real-time doctor on Earth is impossible by NASA's own numbers; the game should rely on the crew's physician role.

## 8. Dust and health
- Dust risk narrative: "Dust exposure can lead to Eye Injury, Lung Injury and Skin Irritation", ingestion toxicity "especially in the case of Martian dust with perchlorates"; "Most evidence suggests that the medical issues are likely to be minor in mission"; long-term effects "speculative".
- Martian Dust Exposure Limits (July 2026): proposed limit 0.1 mg/m3 for particles under 10 micrometres, up to 30 days, from the lunar 30-day limit of 0.4 mg/m3 reduced 3 times; Curiosity SAM found about 0.3 to 0.5 weight percent perchlorate in Rocknest soil; the panel considered perchlorate low risk when inhaled if the limit holds. **[PLAN]**
- **[NOT FOUND]** a NASA sentence on Apollo crew dust effects (seen only in search summaries).

## Gauges for a turn-based game
See the report to the project owner; the numbers are rows `R02`, `HL10`, `HL11`, `HL19`, `HL20`, `HL21`, `HL23`, `HL38`. Convert days to sols with 1.0275 (our factor).
