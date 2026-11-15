# Mars basics: day, year, gravity, atmosphere, Sun

> Web: https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html (NSSDCA, last updated 19 May 2025) and https://science.nasa.gov/mars/facts/. Accessed 2026-11-15.
> Data: rows `B01` to `B31` of [`data/mars-surface-numbers.csv`](data/mars-surface-numbers.csv)

Labels as in [`../README.md`](../README.md). **[DISCREPANCIA]** marks two NASA pages that disagree; both are kept.

## Day and year
| Quantity | Value | Source |
|---|---|---|
| Solar day ("Length of day") | 24.6597 h (24 h 39 min 35 s) | Fact Sheet, row "Length of day (hrs)" **[VERIFICADO-NASA]** |
| Sidereal rotation | 24.6229 h | Fact Sheet **[VERIFICADO-NASA]** |
| Year | 686.980 Earth days | Fact Sheet "Sidereal orbit period (days)" **[VERIFICADO-NASA]** |
| Year in sols | 669.6 (Science Facts page) or 668 (Helio and You page) | **[DISCREPANCIA]**. Our division 686.980 / 24.6597 x 24 = 668.6 sols **[DERIVADO]** |
| Northern spring / fall | 194 / 142 sols | Helio and You: "Northern spring is 194 sols", "northern fall is only about 142 sols" **[VERIFICADO-NASA]** |
| Northern summer, winter | **[NOT FOUND]** on a NASA page read. Together they are 668 - 194 - 142 = 332 sols **[DERIVADO]** | row `B09` |
| Axial tilt | 25.19 deg | Fact Sheet **[VERIFICADO-NASA]** |

Player: one sol is about 39.6 minutes longer than an Earth day, so a mission clock in sols drifts from Earth time. Seasons are uneven because the orbit is elliptical.

## Gravity and atmosphere
Fact Sheet rows, quoted: "Surface gravity (mean) (m/s2) | 3.73 | 9.82 | 0.380". "Surface pressure: 6.36 mb at mean radius (variable from 4.0 to 8.7 mb depending on season)". "Surface density: ~0.016 +/- 0.006 kg/m3". "Scale height: 11.0 km". Composition: "Carbon Dioxide (CO2) - 95.1% ; Nitrogen (N2) - 2.59%", "Argon (Ar) - 1.94%; Oxygen (O2) - 0.16%; Carbon Monoxide (CO) - 0.06%". All **[VERIFICADO-NASA]**.

Curiosity REMS (JPL, 2016-05-11): "very un-Earthlike seasonal variations of about 25 percent in atmospheric pressure".

Player: gravity is 38 percent of Earth; the air is thin (6.36 mb) and 95 percent carbon dioxide, so it is not breathable, so suits and habitats are mandatory.

## Wind
Fact Sheet: "2-7 m/s (summer), 5-10 m/s (fall), 17-30 m/s (dust storm) (Viking Lander sites)". NASA, "The Fact and Fiction of Martian Dust Storms": "The winds in the strongest Martian storms top out at about 60 miles per hour", and the air is "about 1 percent as dense as Earth's atmosphere". **[VERIFICADO-NASA]**

Player: even storm winds push far less than the same speed on Earth; the danger of a storm is dust, not wind force.

## Distance from the Sun and sunlight
Fact Sheet: semi-major axis 227.956 million km, perihelion 206.650, aphelion 249.261.

**Solar irradiance: "Solar irradiance (W/m2) | 586.2 | 1361.0 | 0.431".** This confirms the 586 W/m2 the repo derives from 1361 W/m2 and the semi-major axis **[VERIFICADO-NASA]**. Our calculation at perihelion and aphelion is 713 and 490 W/m2 **[DERIVADO]** (1361 x (149.598/d)^2 with the Fact Sheet distances); NASA does not state those two.

NASA's 2024 Architecture Concept Review power paper: solar flux "at most 45 percent of typical Earth values and varies significantly by location and season", and "mid-latitude missions experiencing a 25-hour cycle and only illuminated for about 50 percent of that time" **[VERIFICADO-NASA]**.

Player: array output at the surface is at most about 586 W/m2 of sunlight before dust, night and angle are counted.

## Not found
No NASA page read gives the individual lengths of northern summer and winter (row `B09`).
