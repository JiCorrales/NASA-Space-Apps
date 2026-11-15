# Human exploration of Mars: published plans and the one measurement

> Webs: NASA pages and reports listed per row. Accessed 2026-11-15.
> Data: rows `H01` to `H12`, `P04` to `P07` of [`data/mars-surface-numbers.csv`](data/mars-surface-numbers.csv)

Everything here is **[PLAN]** (a study, a requirement or a concept) unless marked **[MEDIDO]** (a measurement). No human has been to Mars.

| Item | Value | Kind | Source |
|---|---|---|---|
| Crew size, Design Reference Architecture 5.0 (2007 study) | six | plan | DRA 5.0 summary paper: "sending six crewmembers to Mars on a minimum of three consecutive opportunities" |
| Surface stay and total mission, DRA 5.0 | 539 days stay, 914 days total; 174 days out, 201 back | plan | same |
| Surface EVA team, DRA 5.0 | "a minimum of two people and a maximum of four", at least two stay in the habitat | plan | same |
| Pressurized rover, DRA 5.0 | crew of two, 100 km in 15 days | plan | same |
| Surface power, DRA 5.0 | a 30 kWe version of a 40 kWe lunar fission design | plan | same |
| Moon to Mars transit habitat | crew of four, about 850-day round trip, 30-day surface stay, two crew on the surface | plan | NASA/TM-20220000524 (January 2022) |
| Surface power for a modest crew | two crew, up to 30 days, pressurized rover: "at least 10 kilowatts" | plan | 2024 Architecture Concept Review |
| Surface power decision | nuclear fission as primary technology | plan | same |
| Fission Surface Power module | up to 10 kW, four units for "robust operations"; Moon first, late 2020s | plan | NASA Fission Surface Power page |
| Oxygen from the Mars atmosphere, MOXIE | 122 g in 16 runs, peak 12 g per hour at 98 percent purity or better, last run 9.8 g on 2023-08-07 | **medido** | NASA, 2023-09-06 |
| Mars suit EVA limit, power of MOXIE, oxygen per astronaut | **[NOT FOUND]** as NASA statements | not-found | rows `H10` to `H12` |

DRA 5.0 ISRU concept: plants convert CO2 to O2; 400 kg of hydrogen come from Earth; the plant is driven "by a nuclear fission power source" (the paper says solar would need a far higher power level). For crew-health figures (EVA hours, oxygen, water) see [`mars-crew-health.md`](mars-crew-health.md).

Player: MOXIE proved oxygen can be made on Mars at a few grams per hour; a person at rest needs 771 g per day (HL19), so one MOXIE-sized unit at peak covers about 0.4 person (12 g/h x 24 h = 288 g/day against 771 g, our arithmetic **[DERIVADO]**, MOXIE ran only in short runs).
