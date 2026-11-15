# Mars communications: delay, blackouts and orbiter relay

> Webs: NASA pages listed per row. Accessed 2026-11-15.
> Data: rows `C01` to `C28` of [`data/mars-surface-numbers.csv`](data/mars-surface-numbers.csv)

## Distance and light time
Fact Sheet "Distance from Earth": minimum 54.6 million km, maximum 401.4 million km. The Fact Sheet has no light-time row. Divided by 299,792.458 km/s: **3.03 minutes at minimum and 22.3 minutes at maximum one-way [DERIVADO]**. NASA statements: "about 5 to 20 minutes ... depending on planet positions" (NASA SCaN slide on Perseverance); "upward of 21-23 minutes" for a crewed mission (2023 Moon to Mars Architecture white paper).

Player: a command from Earth cannot get an answer in less than about 6 minutes (round trip, our doubling of C03), so the surface crew must act on their own.

## Solar conjunction
- White paper "Mars Communications Disruption and Delay": "Approximately every 26 months, Earth and Mars are on exact opposite sides of the Sun"; NASA assumed a Sun-Earth-probe angle of 2 degrees; blackout "of about 21 days" (850-day short-stay example) and "about 13 days" (1,000-day long-stay example). Both are mission studies **[PLAN]**.
- JPL 2019, "What's Mars Solar Conjunction": "Solar conjunction occurs every two years"; the command moratorium ran "from Aug. 28 to Sept. 7, 2019" (11 days) **[VERIFICADO-NASA]**.

## Relay through orbiters
- Mars Relay Network page (updated 2026-06-05): four orbiters; rover-orbiter links "at data rates up to 2 Mbps"; "The rovers lack line-of-sight to the Earth for about 12 hours per day"; returns "about a dozen times a week".
- MRN Handbook, Release 4 (2026-04-27): "Since 2004, the MRN has returned over 99% of the data from NASA's rovers and landers ... using these UHF relay links". Odyssey sessions average "roughly 14 minutes", 2 to 4 contacts per sol near the equator, clustered at 6:11 AM and 6:11 PM local time; MRO "average pass duration of 10 minutes"; TGO "17 minutes". Odyssey downlink to Earth 3.95 to 142 kbps.
- **[DISCREPANCIA]** NASA SCaN slide on Perseverance: "99.9% of science data" by UHF relay and "Orbiters will only be viewable for around 8 minutes per day". The handbook says over 99 percent and passes of 10 to 17 minutes. Use the handbook (newer, 2026) and record both.
- Direct to Earth, Perseverance: "160-500 bits per second" through the X-band high-gain antenna, also used for the morning command upload (SCaN slide). Compare 2 Mbps by relay: about 4,000 to 12,500 times faster at the peak (our division **[DERIVADO]**).

Average data per day per orbiter (MRN page table; it does not say which rovers the averages cover):

| Orbiter | Passes per day (used for MRN) | Average Mb/day through 2025 | Average Mb/day Feb-May 2026 |
|---|---|---|---|
| Mars Odyssey | 2-4 (0-1) | 170.4 | 107.3 |
| Mars Reconnaissance Orbiter | 2-4 (1-3) | 447.5 | 850.6 |
| MAVEN | 2-4 | 897.5 | 0 (lost 2025-12-06) |
| ExoMars Trace Gas Orbiter | 2-4 (2-4) | 1,562.7 | 2,228.1 |
| Mars Express | 1-3 (0) | backup only | backup only |

Player: the satellite the team designs would join this table. For scale, one NASA orbiter returns hundreds of megabits per day, shared across rovers.

## Not found
Data per single pass and Curiosity's own direct-to-Earth and relay volumes (rows `C27`, `C28`): only search summaries, no NASA page read. Divide the per-day figures by passes only if the game labels the result as the team's.
