"""Orbit and ground-contact numbers for MissionCatalog.json, computed from stated physics.

Python 3 standard library only. Run: python3 Tools/orbits/orbits.py
See README.md in this folder for the equations, constants and assumptions.
"""
import math

# Constants (WGS-84 / IERS values; see README).
MU = 398600.4418            # km^3/s^2, Earth gravitational parameter
RE = 6378.137               # km, Earth equatorial radius
J2 = 1.08262668e-3          # Earth oblateness coefficient
W_EARTH = 7.2921159e-5      # rad/s, Earth rotation rate (sidereal)
YEAR_S = 365.2422 * 86400   # s, tropical year
OBLIQUITY = math.radians(23.44)

# Catalog orbits: id, altitude km, inclination deg (inputs read from MissionCatalog.json).
ORBITS = [("leo-iss", 400.0, 51.6), ("leo-500", 500.0, 45.0), ("sso-550", 550.0, 97.6)]
SSO_LTAN_H = 22.5           # local time of ascending node (10:30 descending node), sso-550 only
MIN_ELEV_DEG = 10.0         # ground-station elevation mask
NEUTRAL_LAT = 40.0          # reference station latitude, deg
LATITUDES = [0, 10, 20, 30, 40, 50, 60, 70, 80]
NETWORK_LONS = [0.0, 120.0, 240.0]  # commercial network: 3 stations at NEUTRAL_LAT
PASS_DAYS = 30
STEP_S = 10.0


def period_s(a):
    """Kepler's third law, circular orbit."""
    return 2 * math.pi * math.sqrt(a ** 3 / MU)


def nodal_rate(a, inc):
    """J2 secular RAAN drift, rad/s, circular orbit."""
    n = math.sqrt(MU / a ** 3)
    return -1.5 * n * J2 * (RE / a) ** 2 * math.cos(inc)


def sso_inclination_deg(a):
    """Inclination whose J2 nodal drift equals +360 deg per tropical year."""
    n = math.sqrt(MU / a ** 3)
    return math.degrees(math.acos(-(2 * math.pi / YEAR_S) / (1.5 * n * J2 * (RE / a) ** 2)))


def eclipse_fraction(a, beta):
    """Fraction of a circular orbit in a cylindrical Earth shadow, for Sun beta angle beta (rad)."""
    x = math.sqrt(1 - (RE / a) ** 2) / math.cos(beta) if abs(beta) < math.pi / 2 else 2.0
    return math.acos(x) / math.pi if x < 1 else 0.0


def sun_vec(t):
    """Unit vector to the Sun in ECI, circular Earth orbit, t seconds after the March equinox."""
    lam = 2 * math.pi * t / YEAR_S
    return (math.cos(lam), math.sin(lam) * math.cos(OBLIQUITY), math.sin(lam) * math.sin(OBLIQUITY))


def raan0(orbit_id):
    """Initial RAAN. For the SSO: node at LTAN relative to the Sun (Sun RA is 0 at t=0)."""
    return math.radians((SSO_LTAN_H - 12) * 15) if orbit_id.startswith("sso") else 0.0


def beta_angle(raan, inc, s):
    h = (math.sin(raan) * math.sin(inc), -math.cos(raan) * math.sin(inc), math.cos(inc))
    return math.asin(sum(p * q for p, q in zip(h, s)))


def sat_pos(a, inc, raan, u):
    cr, sr, cu, su, ci, si = math.cos(raan), math.sin(raan), math.cos(u), math.sin(u), math.cos(inc), math.sin(inc)
    return (a * (cr * cu - sr * su * ci), a * (sr * cu + cr * su * ci), a * su * si)


def numeric_eclipse_min(a, inc):
    """Shadow time over one orbit with the Sun in the orbit plane (beta = 0), by stepping the orbit."""
    s = (1.0, 0.0, 0.0)  # Sun along +x; RAAN 0 puts +x on the orbit plane, so beta = 0
    T, dt, dark = period_s(a), 1.0, 0
    for k in range(int(T / dt)):
        r = sat_pos(a, inc, 0.0, 2 * math.pi * k * dt / T)
        along = sum(p * q for p, q in zip(r, s))
        perp = math.sqrt(sum((p - along * q) ** 2 for p, q in zip(r, s)))
        dark += along < 0 and perp < RE
    return dark * dt / 60


def year_power(orbit_id, a, inc):
    """Beta range, worst-case and year-average sunlit fraction, sampled daily over one year."""
    betas, fracs = [], []
    for d in range(366):
        t = d * 86400.0
        b = beta_angle(raan0(orbit_id) + nodal_rate(a, inc) * t, inc, sun_vec(t))
        betas.append(math.degrees(b))
        fracs.append(1 - eclipse_fraction(a, b))
    return min(betas), max(betas), min(fracs), sum(fracs) / len(fracs)


def passes(a, inc, lat_deg, lons_deg, days=PASS_DAYS, dt=STEP_S):
    """List of pass durations (s) above MIN_ELEV_DEG, seen by any station in lons_deg at lat_deg.

    Two-body circular orbit + J2 nodal drift, spherical rotating Earth.
    """
    n, rdot = math.sqrt(MU / a ** 3), nodal_rate(a, inc)
    lat, sin_mask = math.radians(lat_deg), math.sin(math.radians(MIN_ELEV_DEG))
    lons = [math.radians(x) for x in lons_deg]
    out, cur = [], 0.0
    for k in range(int(days * 86400 / dt)):
        t = k * dt
        r = sat_pos(a, inc, rdot * t, n * t)
        visible = False
        for lon in lons:
            th = lon + W_EARTH * t
            up = (math.cos(lat) * math.cos(th), math.cos(lat) * math.sin(th), math.sin(lat))
            rho = [r[i] - RE * up[i] for i in range(3)]
            if sum(rho[i] * up[i] for i in range(3)) > sin_mask * math.sqrt(sum(x * x for x in rho)):
                visible = True
                break
        if visible:
            cur += dt
        elif cur:
            out.append(cur)
            cur = 0.0
    return out


def max_pass_bound_s(a):
    """Upper bound on one pass: visibility cap diameter over the slowest relative angular rate."""
    el = math.radians(MIN_ELEV_DEG)
    lam = math.acos(RE * math.cos(el) / a) - el  # Earth central angle of the visibility cap
    return 2 * lam / (math.sqrt(MU / a ** 3) - W_EARTH)


def main():
    print(f"Constants: mu={MU} km^3/s^2, Re={RE} km, J2={J2}, wE={W_EARTH} rad/s, year={YEAR_S / 86400} d")
    print(f"Ground: elevation mask {MIN_ELEV_DEG} deg, {PASS_DAYS} days, step {STEP_S} s, "
          f"SSO LTAN {SSO_LTAN_H} h (10:30 descending node)\n")

    print("1-2. Period, J2 drift, eclipse and sunlit fraction")
    hdr = ("orbit", "alt_km", "inc", "T_min", "dRAAN_deg/d", "sso_inc", "eclBeta0_min", "eclWorst_min",
           "sunlitWorst", "sunlitYearAvg", "beta_min", "beta_max")
    print(("{:<9}" + "{:>14}" * (len(hdr) - 1)).format(*hdr))
    results = {}
    for oid, alt, inc_deg in ORBITS:
        a, inc = RE + alt, math.radians(inc_deg)
        T = period_s(a) / 60
        bmin, bmax, worst, avg = year_power(oid, a, inc)
        ecl_max = eclipse_fraction(a, 0.0) * T  # longest possible eclipse (Sun in the orbit plane)
        ecl_worst = (1 - worst) * T            # longest eclipse this orbit actually meets in a year
        results[oid] = dict(a=a, inc=inc, T=T, ecl_max=ecl_max, ecl_worst=ecl_worst, worst=worst, avg=avg)
        print(("{:<9}" + "{:>14.4g}" * 11).format(
            oid, alt, inc_deg, T, math.degrees(nodal_rate(a, inc)) * 86400, sso_inclination_deg(a),
            ecl_max, ecl_worst, worst, avg, bmin, bmax))

    print(f"\n3. Single station at latitude L: passes/day and mean minutes/pass above {MIN_ELEV_DEG} deg")
    print("{:<9}".format("lat_deg") + "".join("{:>28}".format(o[0]) for o in ORBITS))
    table = {}
    for lat in LATITUDES:
        row = "{:<9}".format(lat)
        for oid, *_ in ORBITS:
            r = results[oid]
            p = passes(r["a"], r["inc"], lat, [0.0])
            ppd = len(p) / PASS_DAYS
            mpp = sum(p) / len(p) / 60 if p else 0.0
            table[(oid, lat)] = (ppd, mpp, max(p, default=0.0))
            row += "{:>28}".format(f"{ppd:5.2f}/d x {mpp:4.1f} min = {ppd * mpp:5.1f}")
        print(row)

    print(f"\nCommercial network: 3 stations at {NEUTRAL_LAT} deg N, longitudes {NETWORK_LONS}")
    net = {}
    for oid, *_ in ORBITS:
        r = results[oid]
        p = passes(r["a"], r["inc"], NEUTRAL_LAT, NETWORK_LONS)
        net[oid] = (len(p) / PASS_DAYS, sum(p) / len(p) / 60)
        print(f"{oid:<9} {net[oid][0]:5.2f}/d x {net[oid][1]:4.1f} min = {net[oid][0] * net[oid][1]:5.1f} min/day")

    single = [table[(o[0], NEUTRAL_LAT)] for o in ORBITS]
    print(f"\nMean over the three orbits at {NEUTRAL_LAT} deg: single station "
          f"{sum(s[0] for s in single) / 3:.2f} passes/day x {sum(s[1] for s in single) / 3:.2f} min; network "
          f"{sum(v[0] for v in net.values()) / 3:.2f} passes/day x {sum(v[1] for v in net.values()) / 3:.2f} min")

    # Self-checks: fail loudly if the physics or the code is broken.
    iss = results["leo-iss"]
    assert 92.0 < iss["T"] < 93.0, iss["T"]
    assert 35.5 < iss["ecl_max"] < 36.5, iss["ecl_max"]
    for oid, r in results.items():
        assert abs(numeric_eclipse_min(r["a"], r["inc"]) - r["ecl_max"]) < 0.1, oid
        assert r["ecl_worst"] <= r["ecl_max"] + 1e-9, oid
        assert abs(r["ecl_worst"] - r["ecl_max"]) < 0.2 or oid.startswith("sso"), oid  # beta crosses 0
        assert r["worst"] <= r["avg"] <= 1.0, oid
    assert abs(sso_inclination_deg(RE + 550) - 97.6) < 0.1
    revs_per_day = {oid: 1440 / r["T"] for oid, r in results.items()}
    for (oid, lat), (ppd, mpp, longest) in table.items():
        assert longest <= max_pass_bound_s(results[oid]["a"]) + STEP_S, (oid, lat, longest)
        assert ppd <= revs_per_day[oid] + 1, (oid, lat, ppd)
    assert table[("leo-iss", 70)][0] == 0.0  # 51.6 deg orbit never rises 10 deg above a 70 deg station
    print("\nAll self-checks passed.")


if __name__ == "__main__":
    main()
