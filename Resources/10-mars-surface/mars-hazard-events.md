# Dated hazard events for the game

> Webs: NASA and JPL pages listed in the CSV rows `E01` to `E10`, plus `D` and `R` rows. Accessed 2026-11-15.
> Data: [`data/mars-surface-numbers.csv`](data/mars-surface-numbers.csv)

| Date | Event | What it did | Source row |
|---|---|---|---|
| July 2007 | Global dust storms | More than 99 percent of direct sunlight blocked; Opportunity at 128 Wh on 2007-07-18 | `E01`, `D16`, `D25` |
| 2012-06-08 | Mars Odyssey standby safe mode (reaction wheel) | Recovery timeline set in the following days | `E09` |
| 2012-07-11 | Mars Odyssey safe mode | Weeks before the Curiosity landing; Odyssey repositioned to relay the landing data | `E10` |
| 2014-03-09 to 03-13 | Mars Reconnaissance Orbiter safe mode (computer swap) | Science and rover relay suspended about 4 days; rovers used Odyssey | `E07` |
| 2017-09-11 | Solar particle event | Surface radiation more than double any earlier RAD reading, for over two days; global aurora | `E04`, `R13` |
| 2018-06-10 | Opportunity last contact | Planet-encircling storm, tau 10.8; declared over 2019-02-13 | `D11`, `D18`, `E03` |
| 2018-06-20 | 2018 storm declared global | Curiosity tau above 8.0; Curiosity (RTG) unaffected | `E02`, `D12` |
| 2019-08-28 to 09-07 | Solar conjunction command moratorium | 11 days without commands | `C08` |
| 2022-12-15 / 12-21 | InSight last contact / end | Dust on panels: 5,000 Wh per sol at landing, about 500 in spring 2022 | `E06`, `D28`, `D29` |
| 2024-05-20 | Solar particle event, X12 flare | 8,100 microgray at Curiosity; MAVEN's largest solar energetic particle event | `E05`, `R11` |
| 2025-12-06 / 2026-06-03 | MAVEN lost / mission ended | Batteries drained after a fast spin; one relay orbiter fewer (MRO, Odyssey, TGO remain) | `E08` |

Quotes: MAVEN, NASA 2026-06-03: "the batteries on the spacecraft had drained, causing the communications system to lose power"; "an instrumental player in NASA's Mars Relay Network". MRO 2014: "put itself into a precautionary safe standby mode March 9 after an unscheduled swap from one main computer to another"; "The rovers continue to use NASA's Mars Odyssey orbiter as a communications relay."

Player: relay outages of a few days to months are real events; the game can drop one orbiter and show the data per day falling (table in [`mars-communications.md`](mars-communications.md)).

## Not found
The next solar conjunction dates (not read on a NASA page), and any single list of all orbiter safe modes. The events above are the ones found, not a complete history.
