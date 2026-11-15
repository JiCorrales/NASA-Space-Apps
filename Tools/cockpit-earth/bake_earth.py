"""Bake the flight screen's Earth from the NASA Blue Marble images.

The cockpit window (web/src/cockpit/scene) shows the top of a globe seen from the side: the limb
is a great circle, a column of the window is a step of 1 / RS radians along it and a row below the
limb is a step towards the viewer (depth d = RD * (1 - cos(beta)), so the land is foreshortened
towards the horizon as on a real globe). RD is larger than RS on purpose: a true sphere squashes
the land to a third of its height at the target, which no longer reads as a map in pixel art. For each of the three mission regions this
script samples the NASA image along such a band, with the target region a fixed depth below the
limb, classifies every pixel into a small palette index and writes the three bands, run-length
encoded, to web/src/cockpit/scene/earthData.ts. The page never loads the NASA images.

Sources (credited in CREDITS.md):
  Assets/ThirdParty/NASA/BlueMarbleNextGeneration/world.200407.3x5400x2700.jpg  (land mask, land colours)
  Assets/ThirdParty/NASA/BlueMarble-2048.png                                    (cross-check of the land mask)

Neither image shows sea ice. The Arctic pack ice is therefore NOT NASA data: it is an illustrative
summer ice edge (ICE_EDGE below) drawn over the ocean of the NASA land mask.

Usage (from the repo root; needs Pillow and numpy):
  python Tools/cockpit-earth/bake_earth.py [--preview <folder>]
"""
import base64
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
BMNG = ROOT / "Assets/ThirdParty/NASA/BlueMarbleNextGeneration/world.200407.3x5400x2700.jpg"
BM = ROOT / "Assets/ThirdParty/NASA/BlueMarble-2048.png"
OUT = ROOT / "web/src/cockpit/scene/earthData.ts"

RS = 450         # along the limb: 1 canvas pixel is 1 / RS radians, about 14 km
RD = 1100        # depth below the limb: d = RD * (1 - cos(beta))
DEPTH = 84       # rows baked below the limb
PERIOD = 1280    # columns: 2.84 radians of the limb circle, centred on the target
TARGET_D = 40    # the target sits this many rows below the limb
SEAM = 120       # columns at each end that fade to open ocean, so the band can repeat
SS = 3           # samples per pixel side
FOREST_MAX = 42  # mean brightness below which green land counts as forest

DEEP, SHALLOW, FOREST, GRASS, DRY, ROCK, ICE, SEAICE = range(8)
WATER = [DEEP, SHALLOW, SEAICE]
LAND = [FOREST, GRASS, DRY, ROCK, ICE]
PALETTE = {  # preview only; the page has its own copy in earth.ts
    DEEP: (16, 52, 110), SHALLOW: (38, 100, 170), FOREST: (30, 110, 62), GRASS: (96, 160, 80),
    DRY: (200, 172, 104), ROCK: (136, 120, 96), ICE: (255, 255, 255), SEAICE: (196, 224, 240),
}

# id, target (lat, lon), bearing of "up the window" at the target (degrees from north), ground station (lat, lon)
REGIONS = [
    ("costaRica", (9.9, -84.1), 0.0, (9.3, -74.2)),     # station drawn in northern Colombia
    ("amazon", (-3.5, -62.0), 0.0, (-1.0, -52.0)),      # station drawn near the mouth of the Amazon
    ("arctic", (81.2, -4.0), 20.0, (76.5, -68.7)),      # Fram Strait ice; station at Pituffik, Greenland
]

# Illustrative summer sea-ice edge: (longitude, latitude north of which the ocean is ice).
ICE_EDGE = [(-180, 72.5), (-150, 73), (-125, 71), (-95, 69), (-80, 73), (-62, 76.5), (-45, 79), (-30, 68.5), (-20, 71),
            (-12, 76), (-4, 79.6), (5, 80.4), (20, 80.6), (40, 80.2), (60, 79.5), (80, 79), (100, 78), (120, 76.5),
            (150, 75), (180, 72.5)]


def vec(lat, lon):
    la, lo = math.radians(lat), math.radians(lon)
    return np.array([math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)])


def frame(target, bearing):
    """Unit vectors of a band: A (limb point above the target), E (along the limb, to the right), N (towards the viewer)."""
    t = vec(*target)
    north = np.array([0.0, 0.0, 1.0]) - t[2] * t
    north /= np.linalg.norm(north)
    east = np.cross(np.array([0.0, 0.0, 1.0]), t)
    east /= np.linalg.norm(east)
    b = math.radians(bearing)
    up = math.cos(b) * north + math.sin(b) * east
    right = math.cos(b) * east - math.sin(b) * north
    beta0 = math.acos(1 - (TARGET_D + 0.5) / RD)
    a = math.cos(beta0) * t + math.sin(beta0) * up
    n = np.cross(right, a)
    return a, right, n / np.linalg.norm(n)


def classify(rgb, lat, lon):
    r, g, b = (rgb[..., i].astype(np.int32) for i in range(3))
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    mean = (r + g + b) // 3
    out = np.full(r.shape, GRASS, np.uint8)
    out[(g >= r) & (mean < FOREST_MAX)] = FOREST
    out[(r > g + 4) & (mean >= 70)] = DRY
    out[(mx - mn < 26) & (mean >= 62) & (mean < 150)] = ROCK
    out[(r > g) & (mean < 70)] = ROCK
    out[(mn > 150) | ((mean > 135) & (mx - mn < 40))] = ICE
    water = (b > r + 6) & (b >= g - 3) & (r < 70) & (mean < 110)
    out[water] = DEEP
    out[water & (mean > 34)] = SHALLOW
    # Illustrative pack ice over the ocean (not in the NASA images).
    lons = np.array([p[0] for p in ICE_EDGE], float)
    lats = np.array([p[1] for p in ICE_EDGE], float)
    edge = np.interp(lon, lons, lats) + 0.5 * np.sin(np.radians(lon * 9)) + 0.3 * np.sin(np.radians(lon * 23 + 40))
    out[water & (lat > edge)] = SEAICE
    return out


def sample(img, lat, lon):
    h, w = img.shape[:2]
    y = np.clip(((90 - lat) / 180 * h).astype(np.int32), 0, h - 1)
    x = ((lon + 180) / 360 * w).astype(np.int32) % w
    return img[y, x]


def bake(img, target, bearing):
    a, e, n = frame(target, bearing)
    votes = np.zeros((DEPTH, PERIOD, 8), np.int32)
    us = np.arange(PERIOD)
    ds = np.arange(DEPTH)
    for sy in range(SS):
        for sx in range(SS):
            alpha = (us + (sx + 0.5) / SS - PERIOD / 2) / RS
            beta = np.arccos(1 - (ds + (sy + 0.5) / SS) / RD)
            ca, sa = np.cos(alpha)[None, :], np.sin(alpha)[None, :]
            cb, sb = np.cos(beta)[:, None], np.sin(beta)[:, None]
            p = [cb * (ca * a[i] + sa * e[i]) + sb * n[i] for i in range(3)]
            lat = np.degrees(np.arcsin(np.clip(p[2], -1, 1)))
            lon = np.degrees(np.arctan2(p[1], p[0]))
            cls = classify(sample(img, lat, lon), lat, lon)
            for k in range(8):
                votes[..., k] += cls == k
    # Land or water first (so thin coasts survive), then the commonest class of the winner.
    water = votes[..., WATER].sum(-1) * 2 > SS * SS
    wv = votes.copy()
    wv[..., LAND] = -1
    lv = votes.copy()
    lv[..., WATER] = -1
    out = np.where(water, wv.argmax(-1), lv.argmax(-1)).astype(np.uint8)
    out = smooth(out)
    out = despeckle(out)
    out = coast(out)
    out = floes(out)
    return seam(out), (a, e, n)


def neighbours(m):
    p = np.pad(m, 1, mode="edge")
    return [p[:-2, 1:-1], p[2:, 1:-1], p[1:-1, :-2], p[1:-1, 2:]]


def is_land(m):
    return (m >= FOREST) & (m <= ICE)


def smooth(m):
    """3 x 3 majority among land types (the land/water mask is kept): large flat areas, as in pixel art."""
    p = np.pad(m, 1, mode="edge")
    counts = np.zeros(m.shape + (8,), np.int32)
    for dy in range(3):
        for dx in range(3):
            q = p[dy:dy + m.shape[0], dx:dx + m.shape[1]]
            for k in LAND:
                counts[..., k] += q == k
    return np.where(is_land(m), counts.argmax(-1), m).astype(np.uint8)


def despeckle(m):
    """A single land pixel of one type inside another type takes its neighbour's type. Coasts are untouched."""
    for _ in range(2):
        nb = neighbours(m)
        lonely = is_land(m) & np.all([(x != m) & is_land(x) for x in nb], axis=0)
        m = np.where(lonely, nb[2], m)
    return m


def coast(m):
    """One pixel of lighter water along every coast: the classic pixel-art shoreline."""
    nb = neighbours(m)
    near = np.any([is_land(x) for x in nb], axis=0)
    return np.where((m == DEEP) & near, SHALLOW, m).astype(np.uint8)


def floes(m):
    """Break the ice edge into loose floes: checkerboard the pack ice that touches open water."""
    nb = neighbours(m)
    edge = (m == SEAICE) & np.any([(x == DEEP) | (x == SHALLOW) for x in nb], axis=0)
    yy, xx = np.indices(m.shape)
    return np.where(edge & ((xx + yy) % 2 == 0), DEEP, m).astype(np.uint8)


BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]])


def seam(m):
    """Fade both ends to open ocean through an ordered dither, so the band repeats without a visible cut."""
    yy, xx = np.indices(m.shape)
    dist = np.minimum(xx, PERIOD - 1 - xx)
    keep = (dist / SEAM) * 17 > BAYER[yy % 4, xx % 4] + 1
    return np.where(keep | (dist >= SEAM), m, DEEP).astype(np.uint8)


def rle(m):
    """Runs of (class, length). Byte = class << 5 | n: n < 31 is a run of n + 1; n = 31 is followed by a 16-bit length."""
    flat = m.ravel()
    out = bytearray()
    cuts = np.flatnonzero(np.diff(flat)) + 1
    starts = np.concatenate(([0], cuts))
    ends = np.concatenate((cuts, [flat.size]))
    for s, t in zip(starts, ends):
        c, length = int(flat[s]), int(t - s)
        while length > 0:
            if length <= 31:
                out.append(c << 5 | (length - 1))
                length = 0
            else:
                take = min(length, 65535)
                out += bytes([c << 5 | 31, take >> 8, take & 255])
                length -= take
    return base64.b64encode(bytes(out)).decode("ascii")


def class_at(img, lat, lon):
    return int(classify(sample(img, np.array([lat]), np.array([lon])), np.array([lat]), np.array([lon]))[0])


def main():
    Image.MAX_IMAGE_PIXELS = None
    img = np.asarray(Image.open(BMNG).convert("RGB"))
    check = np.asarray(Image.open(BM).convert("RGB"))
    preview = Path(sys.argv[sys.argv.index("--preview") + 1]) if "--preview" in sys.argv else None

    def fmt(v):
        return "[" + ", ".join(f"{x:.6f}" for x in v) + "]"

    lines = [
        "// GENERATED by Tools/cockpit-earth/bake_earth.py. Do not edit by hand.",
        "// Land, water and land colour classes derived from NASA Blue Marble Next Generation (July 2004),",
        "// credited in CREDITS.md. The Arctic pack ice is illustrative: the NASA images do not show sea ice.",
        "",
        f"export const EARTH_RS = {RS};",
        f"export const EARTH_RD = {RD};",
        f"export const EARTH_DEPTH = {DEPTH};",
        f"export const EARTH_PERIOD = {PERIOD};",
        f"export const EARTH_TARGET_D = {TARGET_D};",
        "",
        "export interface EarthBand {",
        "  /** Target region, degrees: [latitude, longitude]. */",
        "  target: [number, number];",
        "  /** Ground station drawn on the band, degrees. */",
        "  station: [number, number];",
        "  /** Unit vectors (z through the north pole): limb point above the target, along the limb, towards the viewer. */",
        "  a: [number, number, number];",
        "  e: [number, number, number];",
        "  n: [number, number, number];",
        "  /** EARTH_DEPTH rows of EARTH_PERIOD palette indices, run-length encoded, base64. */",
        "  rle: string;",
        "}",
        "",
        "export const EARTH_BANDS = {",
    ]
    for name, target, bearing, station in REGIONS:
        m, (a, e, n) = bake(img, target, bearing)
        code = rle(m)
        # Cross-check the land mask against the second NASA image at the target and the station.
        for label, (la, lo) in (("target", target), ("station", station)):
            print(f"{name} {label}: class {class_at(img, la, lo)} (BMNG), {class_at(check, la, lo)} (Blue Marble 2048)")
        sv = vec(*station)
        su = PERIOD / 2 + math.atan2(sv @ e, sv @ a) * RS
        sd = RD * (1 - math.cos(math.asin(sv @ n)))
        print(f"{name} station at column {su:.1f} (target {PERIOD / 2}), depth {sd:.1f}")
        print(f"{name}: {len(code)} base64 characters; classes {np.bincount(m.ravel(), minlength=8).tolist()}")
        lines += [
            f"  {name}: {{",
            f"    target: [{target[0]}, {target[1]}],",
            f"    station: [{station[0]}, {station[1]}],",
            f"    a: {fmt(a)},",
            f"    e: {fmt(e)},",
            f"    n: {fmt(n)},",
            f'    rle: "{code}",',
            "  },",
        ]
        if preview:
            preview.mkdir(parents=True, exist_ok=True)
            rgb = np.zeros(m.shape + (3,), np.uint8)
            for k, col in PALETTE.items():
                rgb[m == k] = col
            Image.fromarray(rgb).resize((PERIOD * 2, DEPTH * 2), Image.NEAREST).save(preview / f"{name}.png")
    lines += ["} satisfies Record<string, EarthBand>;", ""]
    OUT.write_text("\n".join(lines), encoding="ascii", newline="\n")
    print("wrote", OUT, OUT.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
