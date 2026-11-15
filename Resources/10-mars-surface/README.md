# Mars surface research (second act)

Sourced facts for a game act in which four astronauts work on the surface of Mars, helped by the satellite
the team designs. Rule of the project owner: NASA data where it exists; a number NASA does not give is
labelled as the team's, never passed off as real. Researched on 2026-11-15; everything in English.

**Data:** [`data/mars-surface-numbers.csv`](data/mars-surface-numbers.csv), one row per number, columns
`id, quantity, value, low, high, unit, conditions, source_title, source_url, accessed, kind`. `kind` is
`measured`, `derived` (our arithmetic), `plan` (a NASA study, requirement or design basis) or `not-found`
(looked for, no NASA page states it: do not invent it). Count: 142 measured, 6 derived, 37 plan, 16 not-found.

Labels in the notes: those of [`../README.md`](../README.md), plus **[FUENTE-NO-NASA]** (a university press
release or paper, used only where NASA has no page), **[MEDIDO]**, **[PLAN]** and **[NOT FOUND]**. Every URL was
fetched and the quoted sentence read on the page or in the downloaded PDF. Nothing was copied into the repo:
sources are linked, so `CREDITS.md` is untouched.

## Notes
| Note | What it holds | CSV rows |
|---|---|---|
| [mars-basics.md](mars-basics.md) | Sol, year, seasons, gravity, atmosphere, wind, distance and sunlight (586.2 W/m2 confirmed) | `B` |
| [mars-temperature.md](mars-temperature.md) | Gale, Jezero and InSight air temperatures | `T` |
| [mars-dust-and-power.md](mars-dust-and-power.md) | Dust storms, tau, what dust did to Spirit, Opportunity and InSight, RTG and fission power | `D`, `P` |
| [mars-radiation.md](mars-radiation.md) | Curiosity RAD, cruise dose, 2017 and 2024 solar storms, NASA limits | `R` |
| [mars-communications.md](mars-communications.md) | Light time, conjunction, relay passes, data per day, direct-to-Earth rates | `C` |
| [mars-orbiter-support.md](mars-orbiter-support.md) | HiRISE, CTX, MARCI, MCS and storm warning practice | `O` |
| [mars-human-exploration.md](mars-human-exploration.md) | Published crewed-Mars plans and MOXIE | `H`, `P` |
| [mars-crew-health.md](mars-crew-health.md) | The five hazards, radiation, gravity, EVA, life support, sleep, medical, dust | `HL` |
| [mars-hazard-events.md](mars-hazard-events.md) | Dated events usable as game events | `E` |

## Numbers most useful for gameplay
1. Sunlight at Mars: 586.2 W/m2 (Earth 1361.0). Mars Fact Sheet. `B24`
2. A sol is 24.6597 h; gravity 3.73 m/s2 (0.380 g). Mars Fact Sheet. `B01`, `B11`
3. Opacity (tau): Opportunity needed tau below 2.0; was at 10.8 on 2018-06-10 and went silent. JPL. `D11`, `D14`
4. Surface radiation 0.67 mSv per day; career limit 600 mSv; 250 mSv per solar particle event; 8,100 microgray at Curiosity on 2024-05-20. `R02`, `R07`, `R08`, `R11`
5. Delay: 3.0 to 22.3 minutes one way (our division of the Fact Sheet distances); relay up to 2 Mbps against 160 to 500 bits per second direct; a pass averages 10 to 17 minutes, 2 to 4 per sol. `C03`, `C04`, `C14`, `C16` to `C18`, `C25`
6. Power: an RTG gives about 110 W day and night; InSight's array fell from 5,000 to 500 Wh per sol under dust. `P01`, `D28`, `D29`

Health gauges are in [mars-crew-health.md](mars-crew-health.md).

## Disagreements between sources (kept side by side)
Year in sols 669.6 vs 668 (`B05`, `B06`); last global storm "2007" on an old sentence vs 2018 (`D03`);
tau 10.8 vs "near 11" (`D11`); relay share 99 vs 99.9 percent (`C12`, `C13`); orbiter pass 8 minutes vs 10 to 17
(`C16` to `C19`); crew size four vs six in analogs and plans (`HL31` to `HL33`, `H01`).
