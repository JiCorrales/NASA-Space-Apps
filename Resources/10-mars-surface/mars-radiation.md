# Radiation on the way to Mars and on its surface

> Webs: NASA and JPL pages listed per row. Accessed 2026-11-15.
> Data: rows `R01` to `R14` of [`data/mars-surface-numbers.csv`](data/mars-surface-numbers.csv)

## Measured by Curiosity RAD
- NASA Science, "Radiation Measurements on Mars" (2013-12-09): galactic cosmic rays "contribute a slowly varying dose rate of about 210 micrograys per day". "Only one solar particle event has been observed by RAD on the surface of Mars, and it was rather weak." (true when written; superseded by 2017 and 2024.)
- NASA, 2013-12-09: Curiosity "bombarded the surface at Gale Crater with an average of 0.67 millisieverts per day from August 2012 to June 2013"; "radiation exposure from a typical chest X-ray is about 0.02 millisievert"; a round-trip human mission dose "on the order of 1,000 millisieverts".
- JPL, 2013-05-30, cruise: "an average of 1.8 milliSieverts of GCR per day", about 3 percent of it from solar particles.

Player: the surface dose rate (0.67 mSv/day) is about 40 percent of the cruise rate (1.8). Absorbed dose (microgray) and dose equivalent (millisievert) are different units: do not mix R01 and R02.

## Solar storms at the surface
| Event | Fact | Source |
|---|---|---|
| 2017-09-11 | "produced radiation levels on the surface more than double any previously measured" by RAD; the high readings lasted more than two days; aurora "more than 25 times brighter" than any MAVEN had seen. No number on the page. | JPL 2017-09-29 |
| 2024-05-20 | Dose next to Curiosity "8,100 micrograys - equivalent to 30 chest X-rays", the largest surge RAD had measured since landing, "not deadly"; flare "later estimated to be an X12"; "the largest solar energetic particle event that MAVEN has ever seen"; auroras 14 to 20 May | JPL 2024-06-10 |

RAD's principal investigator on the 2017 event: "you would definitely want to take shelter" if outdoors and warned. **[VERIFICADO-NASA]**

Player: a storm day is a spike of a few days, not a new baseline. The 2024 spike is about 38 times the 210 microgray daily background (our division).

## NASA limits for astronauts
- NASA-STD-3001 technical brief OCHMO-TB-020: career effective dose "not to exceed 600 millisieverts (mSv)", "short-term radiation exposure to solar particle events is limited to an effective dose of 250 mSv per event". The standard states it is "universal for all ages and sexes" and tied to a 3 percent mean risk of cancer mortality. **[PLAN]** (a limit, not a measurement)
- Same brief: habitable systems for more than 60 days must keep galactic cosmic ray dose under 1.3 mSv/day in free space and 0.9 mSv/day on a planetary surface; crew dose from RTGs or reactors under 20 mSv per mission year.
- JPL 2013: "NASA has established a three percent increased risk of fatal cancer as an acceptable career limit" (older wording of the same idea).

Player: 600 mSv at 0.67 mSv per day on the surface is about 900 sols of surface dose alone, ignoring cruise (our arithmetic **[DERIVADO]**, not a NASA claim).

## Not found
A numeric dose for the 2017 event on a NASA page (row `R14`).
