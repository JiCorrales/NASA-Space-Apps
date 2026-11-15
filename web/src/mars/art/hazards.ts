/**
 * Hazards in three art directions: dust storm overlays (three strengths, tileable 32 x 32, 3 frames) and the
 * front of a storm, a dust devil, frost, dust settling on the array, the solar storm (sky and radiation
 * overlay, told by shape: jagged flares and a warning triangle, dashed particle streaks) and a fault spark.
 */
import { Grid, bayer, build, frames, hash, tnoise, versions, type Style, type Ver } from "./worldkit";

const TAU = Math.PI * 2;

/**
 * B: wind from the left. Long horizontal streaks, each with a dense head on the right and a tail that thins out
 * behind it; the three strengths differ in streak count, length and thickness. Rows move at one or two speeds, so
 * three frames loop on the 32-pixel torus.
 */
function streakStorm(g: Grid, strength: 1 | 2 | 3, f: number): void {
  const cfg = [null, { p: 0.22, lo: 8, hi: 13, n: 1 }, { p: 0.5, lo: 13, hi: 19, n: 2 }, { p: 0.85, lo: 18, hi: 27, n: 3 }][strength]!;
  const haze = [0, 0, 0.08, 0.22][strength]!;
  for (let y = 0; y < 32; y++) {
    const m = hash(y, 2, 31) > 0.5 ? 2 : 1;
    const shift = Math.round((f * 32 * m) / 3);
    for (let k = 0; k < cfg.n; k++) {
      if (hash(y, 10 + k, 31) > cfg.p * (k ? 0.85 : 1)) continue;
      const L = cfg.lo + Math.floor(hash(y, 30 + k, 31) * (cfg.hi - cfg.lo));
      const head = Math.floor(hash(y, 20 + k, 31) * 32) + shift;
      const thick = strength > 1 && hash(y, 40 + k, 31) > 0.6;
      for (let t = 0; t < L; t++) {
        if (hash(t, y * 7 + k, 5) > 1.1 - t / L) continue;
        const c = t < L * 0.35 ? "D" : "d";
        g.set(head - t, y, c);
        if (thick && t < L * 0.7) g.set(head - t, y + 1, "d");
      }
    }
    if (haze) for (let x = 0; x < 32; x++) if (bayer(x, y) < haze && hash(x, y, 8) > 0.5) g.under(x, y, "d");
  }
}

/** Streaky wind-blown dust on a 32 x 32 torus; `f` 0..2 shifts it by a third of its cycle. */
function storm(g: Grid, S: Style, strength: 1 | 2 | 3, f: number): void {
  if (S.v === "B") return streakStorm(g, strength, f);
  const cover = [0, 0.32, 0.55, 0.8][strength]!;
  const p = f / 3;
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const s1 = Math.sin(TAU * ((2 * x + y) / 32 + p)), s2 = Math.sin(TAU * ((x - 3 * y) / 32 + 2 * p));
      const n = tnoise(x, y, 32, 32, 8, 5);
      const v = 0.5 + 0.22 * s1 + 0.14 * s2 + (n - 0.5) * 0.5 + (S.dither ? (bayer(x, y) - 0.5) * 0.3 : 0);
      if (v > 1 - cover) g.set(x, y, v > 1 - cover * 0.45 && S.v !== "C" ? "D" : S.v === "C" && v > 1 - cover * 0.5 ? "D" : "d");
    }
}

/** B: a tall rolling wall, heavy on the left, with scalloped billows and a soft, dithered leading edge. */
function rollingFront(g: Grid, f: number): void {
  for (let y = 0; y < 32; y++) {
    const bill = 2.5 * Math.abs(Math.sin((Math.PI * y) / 8 + (TAU * f) / 3));
    const xe = 36 + 3 * Math.sin(TAU * (y / 32) + (TAU * f) / 3) + bill;
    for (let x = 0; x < 64; x++) {
      const dist = xe - x;
      if (dist > 20) {
        const streak = (x - 3 * f + y * 3) % 9 < 3;
        g.set(x, y, x < 10 && bayer(x, y) < 0.35 ? "x" : streak ? "d" : "D");
      } else if (dist > 0) {
        if (hash(x, y, 2) * 0.55 + bayer(x, y) * 0.45 < dist / 20) g.set(x, y, dist > 10 ? "D" : "d");
      } else if (hash(y, 5, 3) > 0.8 && -dist < 6 + hash(y, 6, 3) * 14 && hash(x, y, 7) > 0.35 - dist * 0.012) g.set(x, y, "d");
    }
  }
}

function front(g: Grid, S: Style, f: number): void {
  if (S.v === "B") return rollingFront(g, f);
  const p = f / 3;
  for (let y = 0; y < 32; y++) {
    const xe = 28 + 9 * Math.sin(TAU * (2 * y / 32 + p)) + 5 * Math.sin(TAU * (3 * y / 32 + 2 * p));
    for (let x = 0; x < 64; x++) {
      if (x < xe - 12) g.set(x, y, "D");
      else if (x < xe && (!S.dither || bayer(x, y) < (xe - x) / 12 + 0.15)) g.set(x, y, x < xe - 5 ? "D" : "d");
      else if (x < xe + 10 && hash(x, y, f + 3) > 0.93 + (x - xe) * 0.006) g.set(x, y, "d");
    }
    if (S.rich && y % 4 === f) for (let x = 3; x < xe - 14; x += 9) g.set(x, y, "d");
  }
}

/** B: a twisting column, narrow at the base and wide at the top, with slanted bands that turn and a dust skirt. */
function twister(g: Grid, f: number): void {
  g.ell(8, 22, 7, 2, "x");
  for (let y = 0; y < 20; y++) {
    const cx = 8 + 1.6 * Math.sin(TAU * (y / 21) * 1.2 + (TAU * f) / 3);
    const hw = 1.2 + (19 - y) * 0.29;
    for (let x = Math.ceil(cx - hw); x < cx + hw; x++) {
      const rel = (x + 0.5 - cx) / hw;
      let c = rel < -0.35 ? "5" : rel > 0.35 ? "1" : "3";
      if ((Math.floor(y / 2) + f + (x + 0.5 > cx ? 1 : 0)) % 3 === 0) c = c === "5" ? "3" : c === "3" ? "1" : "2"; // bands offset left and right: a twist
      g.set(x, y, c);
    }
  }
  g.ell(8, 21.5, 7, 2.2, "3").ell(8, 21, 5, 1.4, "5");
  for (let k = 0; k < 3; k++) {
    const a = (TAU * (f / 3 + k / 3));
    g.set(8 + Math.round(Math.cos(a) * 7), 21 + Math.round(Math.sin(a) * 2), "r");
    g.set(8 + Math.round(Math.cos(a + 1) * 6), 5 + k * 5, "d");
  }
}

function devil(g: Grid, S: Style, f: number): void {
  if (S.v === "B") return twister(g, f);
  if (S.v !== "A") g.ell(8, 22, 5, 1.6, "x");
  for (let y = 0; y < 22; y++) {
    const cx = 8 + 2.2 * Math.sin(TAU * (y / 22 + f / 3)) * (1 - y / 30);
    const hw = 1.2 + (21 - y) * 0.27;
    const stripe = (y + f * 2) % 4 < 2;
    for (let x = Math.ceil(cx - hw); x < cx + hw; x++) g.set(x, y, stripe ? "5" : "3");
    g.set(Math.floor(cx - hw), y, "1");
  }
  for (const [x, y] of [[2, 3], [13, 5], [4, 9]] as const) g.set(x + ((f * 2) % 3), y, "r");
}

function frostTile(g: Grid): void {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const h = hash(x, y, 2);
    if (h > 0.86) g.set(x, y, "i"); else if (h > 0.78) g.set(x, y, "I");
  }
  for (const [x, y] of [[3, 3], [11, 6], [6, 12]] as const) g.stamp([".i.", "iIi", ".i."], x - 1, y - 1);
}

/** Frost on a module: a rim along the roof, a few icicles and specks. */
function frostModule(g: Grid): void {
  for (let x = 3; x < 29; x++) {
    g.set(x, 9, "i");
    if (hash(x, 1, 3) > 0.55) g.set(x, 10, "i");
    if (x % 4 === 1) g.set(x, 11, "I").set(x, 12, hash(x, 2, 3) > 0.5 ? "I" : ".");
  }
  for (let y = 9; y < 25; y++) { g.set(3, y, "i"); g.set(28, y, "i"); }
  for (let y = 12; y < 24; y++) for (let x = 4; x < 28; x++) if (hash(x, y, 6) > 0.93) g.set(x, y, "i");
}

/** Dust over the panel: 1 sparse, 2 patchy, 3 almost covered. */
function dustOn(g: Grid, S: Style, level: 1 | 2 | 3): void {
  const cover = [0, 0.3, 0.55, 0.85][level]!;
  for (let y = 3; y < 22; y++) {
    const sh = Math.round((22 - y) * 0.3);
    for (let x = 3 + sh; x < 41 + sh; x++) {
      const n = tnoise(x, y, 48, 32, 4, 9) + (S.dither ? (bayer(x, y) - 0.5) * 0.3 : 0);
      if (n > 1 - cover) g.set(x, y, n > 1 - cover * 0.5 ? "5" : "3");
    }
  }
}

/** B: jagged bolts radiating from the Sun at the top, and the warning triangle. */
function radiatingSky(g: Grid, S: Style, f: number): void {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 64; x++) g.set(x, y, y < 7 ? "V" : y < 11 ? (S.dither && (x + y) % 2 ? "V" : "U") : "U");
  g.ell(34, -1, 10, 6, "W").ell(34, -2, 6, 4, "Y");
  [18, 40, 62, 90, 118, 140, 162].forEach((deg, k) => {
    const a = (deg * Math.PI) / 180, cs = Math.cos(a), sn = Math.sin(a);
    const L = 11 + Math.floor(hash(k, 1, 6) * 5);
    for (let i = 3; i < L; i++) {
      const j = (i + f + k) % 3 === 0 ? 1 : (i + f + k) % 3 === 1 ? -1 : 0; // zigzag off the ray
      const x = 34 + cs * i - sn * j, y = 1 + sn * i + cs * j;
      g.set(x, y, i < L * 0.65 ? "Y" : "y").set(x + 1, y, "y");
    }
  });
  g.stamp(["...y...", "..y.y..", "..yyy..", ".y.y.y.", ".y...y.", "yyyyyyy"], 3, 3);
  g.stamp(["...y...", "...y...", ".......", "...y..."], 3, 5);
  g.rect(3, 3, 7, 1, ".").set(6, 3, "y");
}

function solarSky(g: Grid, S: Style, f: number): void {
  if (S.v === "B") return radiatingSky(g, S, f);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 64; x++) g.set(x, y, y < 7 ? "V" : y < 11 ? (S.dither && (x + y) % 2 ? "V" : "U") : "U");
  // jagged flares from the top, the Sun's burst
  for (const x0 of [22, 34, 47]) {
    let x = x0 + (f ? 2 : 0);
    for (let y = 0; y < 12; y++) { g.set(x, y, y < 6 ? "Y" : "y"); x += y % 2 ? (x0 % 2 ? 2 : -2) : 0; if (y % 3 === 0) g.set(x + 1, y, "y"); }
  }
  // warning triangle
  g.stamp(["...y...", "..y.y..", "..yyy..", ".y.y.y.", ".y...y.", "yyyyyyy"], 3, 3);
  g.stamp(["...y...", "...y...", ".......", "...y..."], 3, 5);
  g.rect(3, 3, 7, 1, ".").set(6, 3, "y");
}

function radiation(g: Grid, f: number): void {
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(hash(i, 1, 4) * 32) + f * 5, y = Math.floor(hash(i, 2, 4) * 32) + f * 5;
    g.set(x, y, "Y").set(x - 1, y - 1, "y").set(x - 2, y - 2, "y");
    if (i % 3 === 0) g.set(x - 3, y - 3, "y");
  }
}

function spark(g: Grid, S: Style, f: number): void {
  g.rect(7, 7, 2, 2, "Y");
  const arms = f === 0 ? [[8, 3, 0, -1], [8, 12, 0, 1], [3, 8, -1, 0], [12, 8, 1, 0]] : [[4, 4, -1, -1], [11, 4, 1, -1], [4, 11, -1, 1], [11, 11, 1, 1]];
  for (const [x, y, dx, dy] of arms as number[][]) { g.set(x!, y!, "y"); g.set(x! + dx!, y! + dy!, S.v === "C" ? "y" : "f"); }
  g.stamp(f === 0 ? ["...y", "..y.", ".yy.", "y..."] : ["y...", ".yy.", "..y.", "...y"], 2, 1);
  g.set(7, 6, "y").set(8, 9, "y");
}

const stormKeys = Object.fromEntries(
  ([1, 2, 3] as const).map((n) => [`dustStorm${n}`, (v: Ver) => frames(v, 3, 32, 32, (g, S, f) => storm(g, S, n, f), { wrap: true, flat: true })]),
);
const defs = {
  ...stormKeys,
  stormFront: (v: Ver) => frames(v, 3, 64, 32, front, { flat: true }),
  dustDevil: (v: Ver) => frames(v, 3, 16, 24, devil),
  frostTile: (v: Ver) => build(v, 16, 16, (g) => frostTile(g), { flat: true }),
  frostModule: (v: Ver) => build(v, 32, 32, (g) => frostModule(g), { flat: true }),
  dustLevel1: (v: Ver) => build(v, 48, 32, (g, S) => dustOn(g, S, 1), { flat: true }),
  dustLevel2: (v: Ver) => build(v, 48, 32, (g, S) => dustOn(g, S, 2), { flat: true }),
  dustLevel3: (v: Ver) => build(v, 48, 32, (g, S) => dustOn(g, S, 3), { flat: true }),
  solarStormSky: (v: Ver) => frames(v, 2, 64, 16, solarSky, { flat: true }),
  radiationOverlay: (v: Ver) => frames(v, 2, 32, 32, (g, _S, f) => radiation(g, f), { flat: true, wrap: true }),
  faultSpark: (v: Ver) => frames(v, 2, 16, 16, spark, { flat: true }),
};
export const { A, B, C } = versions(defs);
export type HazardKey = keyof typeof defs;
