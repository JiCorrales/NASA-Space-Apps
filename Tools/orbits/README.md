# Orbit and ground-contact numbers

`orbits.py` computes the orbit and ground-station numbers used by
`Assets/_Project/Data/Resources/MissionCatalog.json` from stated physics, so anyone can rerun and audit
them. Python 3 standard library only.

```sh
python3 Tools/orbits/orbits.py > Tools/orbits/orbit_table.txt
```

It takes about 15 seconds. It ends with self-checks (`assert`) and stops with an error if one fails: an
ISS-like period between 92 and 93 min, an ISS maximum eclipse between 35.5 and 36.5 min, the analytic
eclipse matching a step-by-step shadow test, the SSO inclination for 550 km near 97.6 deg, no pass longer
than the geometric limit, and no more passes per day than revolutions per day.

## Constants

| Symbol | Value | Meaning |
|---|---|---|
| mu | 398600.4418 km^3/s^2 | Earth gravitational parameter (WGS-84) |
| Re | 6378.137 km | Earth equatorial radius (WGS-84) |
| J2 | 1.08262668e-3 | Earth oblateness coefficient (WGS-84) |
| wE | 7.2921159e-5 rad/s | Earth rotation rate |
| year | 365.2422 days | tropical year |
| eps | 23.44 deg | obliquity of the ecliptic |

## Equations

Circular orbit of radius `a = Re + h`, mean motion `n = sqrt(mu / a^3)`.

1. **Period** (Kepler's third law): `T = 2 pi sqrt(a^3 / mu)`.
2. **J2 nodal drift**: `dOmega/dt = -1.5 n J2 (Re / a)^2 cos i`.
   **Sun-synchronous inclination**: the `i` for which `dOmega/dt = 2 pi / year`, so
   `cos i = -(2 pi / year) / (1.5 n J2 (Re / a)^2)`.
3. **Eclipse** (cylindrical Earth shadow): with the Sun beta angle `beta` (angle between the Sun and the
   orbit plane), the fraction of the orbit in shadow is
   `f = acos( sqrt(1 - (Re / a)^2) / cos beta ) / pi` when `|beta| < asin(Re / a)`, otherwise 0.
   The longest possible eclipse is at `beta = 0`: `T asin(Re / a) / pi`.
   `beta = asin(h . s)`, with orbit normal `h = (sin Omega sin i, -cos Omega sin i, cos i)` and Sun unit
   vector `s` on a circular Earth orbit tilted by `eps`. `Omega` drifts with the J2 rate, and `beta` is
   sampled daily for one year.
4. **Ground passes**: the orbit is propagated in 10 s steps for 30 days (two-body circular orbit, J2 nodal
   drift, Earth rotating at `wE`, spherical Earth). A station sees the satellite when its elevation, from
   `sin el = (r_sat - r_stn) . up / |r_sat - r_stn|`, is above the mask. Each unbroken run of visible
   steps is one pass.
   Geometric check: the visibility cap has Earth central angle `lambda = acos(Re cos el / a) - el`, so no
   pass can last longer than `2 lambda / (n - wE)`.

## Assumptions

- Circular orbits at the catalog altitude and inclination. No perturbations other than J2 nodal drift.
- Sun-synchronous orbit: 10:30 local time at the descending node (22:30 at the ascending node), common
  for Earth observation. A dawn-dusk orbit would have almost no eclipse; a noon orbit the longest one.
- Eclipse uses a cylindrical shadow (no penumbra, no atmosphere), which is slightly longer than the
  umbra, so it is on the safe side for sizing a battery.
- Ground station: elevation mask 10 deg, reference latitude 40 deg (mid-latitude, where most university
  stations are). The table shows the effect of latitude from 0 to 80 deg.
- Commercial network: three stations at 40 deg, 120 deg apart in longitude. The network size is a game
  design choice; the per-station geometry is computed.
- Amateur and university stations share the same geometry; the difference between them is the band, not
  the passes.

## Which case each catalog field holds

- `eclipseMinutes`: the longest eclipse the orbit meets in a year. The battery must carry the load
  through the worst eclipse, not the average one. For orbits whose beta crosses 0 (ISS-like, 45 deg) this
  is the `beta = 0` value; for the 10:30 SSO, beta stays between about 16 and 26 deg, so it is a little
  shorter.
- `sunlitFraction`: the worst-case (lowest) value, `1 - eclipseMinutes / T`. The game checks
  `panelW * sunlitFraction` against the average load; a battery stores energy for a few orbits, not for
  weeks, so the power budget must close in the worst season, not on the yearly average. The yearly average
  is printed for reference; it is only 0.005 to 0.05 higher.

## Not computed

- **Orbital lifetime** (`lifetimeMonths`). Drag decay depends on atmospheric density, which changes about
  tenfold with solar activity, and on the satellite's mass and area. A number without an atmosphere model
  would be invented. Use NASA's Debris Assessment Software (DAS) for a sourced value.
- Data volume per pass (depends on the radio link budget), antenna pointing, and penumbra.
