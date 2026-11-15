# Mars dust, solar power and RTGs

> Webs: NASA and JPL pages listed per row. Accessed 2026-11-15.
> Data: rows `D01` to `D36` and `P01` to `P07` of [`data/mars-surface-numbers.csv`](data/mars-surface-numbers.csv)

## How often, how long
- NASA, "The Fact and Fiction of Martian Dust Storms": "Once every three Mars years (about 5 1/2 Earth years), on average, normal storms grow into planet-encircling dust storms." "Once started, bigger storms can last weeks to months."
- NASA, "10 Things: Massive Dust Storm on Mars": "we've seen global dust storms in 1971, 1977, 1982, 1994, 2001 and 2007." The 2018 storm followed.
- **[DISCREPANCIA]** The Fact and Fiction page (text from 2015, page updated 2026) says storms were observed "most recently in 2007". The 2018 storm was declared global on 2018-06-20 (NASA, "Martian Dust Storm Grows Global"). Not a real conflict, an out-of-date sentence.
- JPL, 2016, "NASA Mars Orbiters Reveal Seasonal Dust Storm Pattern": "Three large regional storms, dubbed types A, B and C, all appeared in each of the six Martian years investigated", in southern spring and summer; regional storms affect "up to a third of the planet and persisting up to three weeks"; most storms are "smaller than about 1,200 miles (about 2,000 kilometers)".
- Winds: see [`mars-basics.md`](mars-basics.md).

Player: the average gap of three Mars years is only an average (gaps between the listed years run from 5 to 12 calendar years, our count). A game event table should say "team's probability" if it picks a per-sol chance.

## Opacity (tau) and sunlight
- JPL, "Six Things About Opportunity's Recovery Efforts" (2018-08-16): "The higher the tau, the less sunlight is available; the last tau measured by Opportunity was 10.8 on June 10." "JPL engineers predict that Opportunity will need a tau of less than 2.0".
- NASA, 2018-06-20: Curiosity's tau "is now above 8.0 at Gale Crater"; Opportunity's "last measured near 11". **[DISCREPANCIA]** minor: 10.8 versus "near 11".
- JPL, "Opportunity Hunkers Down During Dust Storm": the previous storm had "a tau somewhere above 5.5"; the 2018 storm spanned 18 million km2, later 35 million km2.
- JPL, 2009, "Mars Spacecraft Teams on Alert for Dust-Storm Season": haze "reduced Spirit's daily energy supply by about 20 percent and Opportunity's by about 30 percent"; the July 2007 storms "blocked more than 99 percent of direct sunlight".
- **[NOT FOUND]** average tau at Opportunity's site (a figure of 0.5 was seen in a search summary but is on no NASA page read).

Player: NASA gives three anchor points, not a power curve: tau below 2.0 for Opportunity to recover, above 5.5 in 2007, about 11 in 2018 when Opportunity went silent. Any tau-to-power conversion in the game is the team's own.

## What storms and dust did to missions
| Mission | Fact | Source |
|---|---|---|
| Spirit and Opportunity | "about 900 watt-hours per day for each rover" just after landing (Jan 2004) | JPL 2004-10-21 |
| Opportunity | 128 Wh on 2007-07-18 (storms); about 300 Wh per day Aug 2007 | NASA Opportunity page; JPL 2007-08-24 |
| Opportunity | below 300 Wh per day for more than two months in the first Endeavour winter; more than 460 Wh in Jan 2016; more than 615 Wh in Mar 2014 after cleaning | JPL 2016-01-25, 2014-03-27 |
| Opportunity | last contact 2018-06-10; more than a thousand commands; declared over 2019-02-13 | JPL 2019-02-13 |
| InSight | about 5,000 Wh per sol after landing, about 500 by spring 2022 | NASA Science 2022-05-17 |
| InSight | about 2,700 Wh per sol in May 2019 against about 1,500 needed | JPL 2019-05-06 |
| InSight | 425 to 275 Wh per sol in a 2022 storm 3,500 km away; haze up nearly 40 percent | JPL 2022-10-07 |
| InSight | last contact 2022-12-15; ended 2022-12-21; 1,319 marsquakes | NASA 2022-12-21 |

## Cleaning events and dust devils
- JPL 2019: winds "far more often ... cleared off the rover's solar panels and gave it an energy boost"; boosts of "as much as 10%"; dust-devil activity "usually seen between about noon and 3 p.m.".
- InSight team (JPL 2022-05-17): "If just 25% of InSight's panels were swept clean by the wind, the lander would gain about 1,000 watt-hours per sol"; "We've been hoping for a dust cleaning like we saw happen several times to the Spirit and Opportunity rovers". Dropping dirt from the scoop on windy days did not clear enough.
- Perseverance (JPL 2022-06-01): "hundreds of dust-bearing whirlwinds" in its first couple of hundred sols; "Sand carried in whirlwinds damaged MEDA's two wind sensors".

Player: cleaning is rare luck (about +10 percent a time), not a repair action.

## Power sources
- Perseverance power page: "About 110 watts at launch, declining a few percent per year", 4.8 kg plutonium dioxide, "14-year operational lifetime", two lithium-ion batteries "to meet peak demands". Press kit: "identical to the one that the Curiosity rover has been using", "free of limitations associated with solar panels". **[VERIFICADO-NASA]**
- NASA 2024 Architecture Concept Review: radioisotope systems "only offer a few hundred watts"; nuclear fission was chosen for crewed Mars because it works "around the clock, and during global dust storms". **[PLAN]**
- NASA Fission Surface Power: "up to 10 kilowatts"; "Four 10-kilowatt units could provide enough juice to power robust operations on the Moon and Mars"; Moon first, "late 2020s". Kilopower: test "November 2017 to March 2018". **[PLAN]**
- **[NOT FOUND]** peak array power of Spirit and Opportunity (the NASA page for "140 W for up to four hours" returned 404).

Player: the RTG gives roughly a light bulb of steady power and ignores night and storms; arrays gave about 900 Wh per sol just after landing and far less once dust built up (table above).
