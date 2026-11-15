/**
 * Terrain of Mars in three art directions: 16 x 16 tiles that tile seamlessly (regolith, rocky ground,
 * sand ripples, dry channel, cliff, crater pieces, night variants), overlays (boulder, dust drift, sample
 * site markers, route marker, tracks) and 64 x 16 horizon strips for panel headers.
 * Light comes from the top left everywhere.
 */
import { Grid, bayer, build, hash, pick, tnoise, versions, type Style, type Ver } from "./worldkit";

interface Ramp { hi: string; base: string; lo: string; deep: string }
const DAY: Record<"light" | "mid" | "dark", Ramp> = {
  light: { hi: "5", base: "3", lo: "1", deep: "2" },
  mid: { hi: "3", base: "1", lo: "2", deep: "4" },
  dark: { hi: "1", base: "2", lo: "4", deep: "4" },
};
const NIGHT: Record<"light" | "mid" | "dark", Ramp> = {
  light: { hi: "J", base: "K", lo: "L", deep: "M" },
  mid: { hi: "K", base: "L", lo: "M", deep: "N" },
  dark: { hi: "L", base: "M", lo: "N", deep: "N" },
};

/** Mottled ground on a 16 x 16 torus. */
function ground(g: Grid, S: Style, r: Ramp, seed: number): void {
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      // A: big hard patches, few single specks. B: fine two-scale mottling with dither and highlights.
      // C: two or three large flat patches and almost no texture.
      const coarse = tnoise(x, y, 16, 16, 4, seed);
      const n = S.rich ? coarse * 0.7 + tnoise(x, y, 16, 16, 2, seed + 9) * 0.3 : coarse;
      const t = S.dither ? (bayer(x, y) - 0.5) * (S.rich ? 0.18 : 0.1) : 0;
      let c = r.base;
      if (S.v === "C") c = n > 0.62 ? r.hi : n < 0.3 ? r.lo : r.base;
      else if (n + t > (S.rich ? 0.6 : 0.58)) c = r.hi;
      else if (n + t < (S.rich ? 0.38 : 0.4)) c = r.lo;
      const sp = hash(x, y, seed + 31);
      if (S.v === "A" ? sp > 0.975 : S.v === "B" ? sp > 0.972 : false) c = r.deep;
      else if (S.rich && sp < 0.02) c = r.hi;
      g.set(x, y, c);
    }
  if (S.v === "C") for (let i = 0; i < 2; i++) g.rect(Math.floor(hash(i, 1, seed) * 14), Math.floor(hash(i, 2, seed) * 14), 2, 2, r.deep);
}

/** Small pebble: a lit top-left pixel, a body, a dark bottom-right edge. */
function pebble(g: Grid, S: Style, x: number, y: number, big: boolean, rock = "r", dark = "R", lit = "q"): void {
  g.rect(x, y, big ? 3 : 2, 2, rock);
  g.set(x + (big ? 3 : 2), y + 1, dark).rect(x + (big ? 0 : 0), y + 2, big ? 3 : 2, 1, dark);
  if (S.rich) g.set(x, y, lit);
}

const groundTile = (kind: "light" | "mid" | "dark", seed: number, night = false) => (v: Ver) =>
  build(v, 16, 16, (g, S) => ground(g, S, (night ? NIGHT : DAY)[kind], seed), { wrap: true });

const rocky = (night: boolean) => (v: Ver) =>
  build(v, 16, 16, (g, S) => {
    ground(g, S, (night ? NIGHT : DAY).mid, 5);
    const rock = night ? ["M", "N", "L"] : ["r", "R", "q"];
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(hash(i, 1, 77) * 16), y = Math.floor(hash(i, 2, 77) * 16);
      pebble(g, S, x, y, hash(i, 3, 77) > 0.55, rock[0], rock[1], rock[2]);
    }
  }, { wrap: true });

const boulder = (v: Ver) =>
  build(v, 16, 16, (g, S) => {
    if (S.v !== "A") g.ell(9, 13, 6.5, 2.2, "x");
    g.ell(7.5, 8.5, 6, 5, "r");
    // lit upper left, dark lower right; B adds a mid tone and a highlight
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        if (g.get(x, y) !== "r") continue;
        const d = (x - 7.5) * 0.7 + (y - 8.5) * 0.7;
        if (d > 2.2) g.set(x, y, "R");
        else if (d < -2.6) g.set(x, y, "q");
      }
    g.line(8, 5, 9, 8, "R").set(9, 9, "R");
    if (S.rich) g.set(4, 6, "h").set(5, 5, "h");
  });

const ripples = (night: boolean) => (v: Ver) =>
  build(v, 16, 16, (g, S) => {
    const r = (night ? NIGHT : DAY).mid;
    ground(g, S, { ...r, hi: r.base, lo: r.base }, 11);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const yy = y + 1.7 * Math.sin((2 * Math.PI * x) / 16 + 0.6);
        const k = ((Math.floor(yy) % 8) + 8) % 8;
        if (k === 0) g.set(x, y, r.hi);
        else if (S.rich && k === 1) g.set(x, y, r.base === "1" ? "3" : r.hi);
        else if (k === (S.rich ? 4 : 3)) g.set(x, y, r.lo);
        else if (S.rich && k === 5) g.set(x, y, r.deep);
      }
  }, { wrap: true });

/** Depth t and inward normal n for crater tile `part`; t < 2 is outside the rim. */
function craterSample(part: string, px: number, py: number): { t: number; nx: number; ny: number } {
  switch (part) {
    case "N": return { t: py, nx: 0, ny: 1 };
    case "S": return { t: 16 - py, nx: 0, ny: -1 };
    case "W": return { t: px, nx: 1, ny: 0 };
    case "E": return { t: 16 - px, nx: -1, ny: 0 };
  }
  const cx = part.endsWith("W") ? 16 : 0, cy = part.startsWith("N") ? 16 : 0;
  const dx = cx - px, dy = cy - py, len = Math.hypot(dx, dy) || 1;
  return { t: 16 - len, nx: dx / len, ny: dy / len };
}

const crater = (part: string) => (v: Ver) =>
  build(v, 16, 16, (g, S) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        let t = 99, lit = 0;
        if (part !== "floor") {
          const s = craterSample(part, x + 0.5, y + 0.5);
          t = s.t;
          lit = s.nx * -0.707 + s.ny * -0.707; // inward normal against the light from the top left
        }
        const fl = hash(x, y, 4) > 0.9 ? "4" : hash(x, y, 8) > 0.86 ? "1" : "2";
        if (t < 2) continue;
        const tone = (c: string, dk: string) => (S.dither && bayer(x, y) < 0.3 ? dk : c);
        if (t < 3.2) g.set(x, y, lit < 0 ? "5" : "3"); // outer slope of the rim
        else if (t < 5) g.set(x, y, lit < 0 ? "3" : tone("1", "2")); // crest
        else if (t < 9) g.set(x, y, lit > 0.3 ? tone("3", "1") : lit < -0.3 ? tone("4", "2") : "1"); // inner wall
        else if (t < 10 && S.dither) g.set(x, y, bayer(x, y) < 0.5 ? "2" : fl);
        else g.set(x, y, fl);
        if (t >= 2 && t < 5 && hash(x, y, 21) > 0.93) g.set(x, y, "r");
      }
  }, { wrap: false, flat: true });

const cliff = (v: Ver) =>
  build(v, 16, 16, (g, S) => {
    ground(g, S, DAY.light, 3);
    for (let x = 0; x < 16; x++) {
      const e = 4 + Math.round(1.4 * Math.sin((2 * Math.PI * x) / 16 + 1));
      g.set(x, e - 1, "5");
      for (let y = e; y < e + 6; y++) {
        const dark = hash(x, 5, 3) > 0.55 || (S.rich && y > e + 3);
        g.set(x, y, y === e && S.rich ? "q" : dark ? "R" : "r");
      }
      for (let y = e + 6; y < 16; y++) g.set(x, y, y < e + 8 ? "4" : hash(x, y, 6) > 0.9 ? "4" : "2");
    }
  }, { wrap: true });

const channel = (v: Ver) =>
  build(v, 16, 16, (g, S) => {
    ground(g, S, DAY.mid, 13);
    for (let x = 0; x < 16; x++) {
      const c = 8 + 2 * Math.sin((2 * Math.PI * x) / 16);
      for (let y = 0; y < 16; y++) {
        const d = y + 0.5 - c;
        if (Math.abs(d) < 2.4) g.set(x, y, Math.abs(d) < 1.2 ? "4" : "2");
        else if (Math.abs(d) < 3.4) g.set(x, y, d < 0 ? "5" : "4"); // lit north bank, shaded south bank
        if (Math.abs(d) < 2.4 && hash(x, y, 9) > 0.93) g.set(x, y, "r");
        if (S.rich && Math.abs(d) < 1.2 && hash(x, y, 17) > 0.8) g.set(x, y, "2");
      }
    }
  }, { wrap: true });

const drift = (v: Ver) =>
  build(v, 16, 16, (g, S) => {
    g.ell(8, 9, 7, 3, "5");
    g.ell(8.5, 10.6, 6, 1.6, "3");
    for (let x = 12; x < 16; x++) if (!S.dither || (x + 9) % 2 === 0) g.set(x, 7 + (x % 2), "5");
    g.set(2, 6, "5").set(1, 7, "5");
  }, { flat: true });

const SITE_STATES = {
  unknown: { col: "y", glyph: ["yyy", "..y", ".y.", "...", ".y."] },
  found: { col: "c", glyph: [] as string[] },
  sampled: { col: "k", glyph: [] as string[] },
};
const siteMarker = (state: keyof typeof SITE_STATES) => (v: Ver) =>
  build(v, 16, 16, (g) => {
    const { col, glyph } = SITE_STATES[state];
    if (state === "unknown") {
      // dashed ring and a question mark
      for (let a = 0; a < 16; a++) {
        if (a % 2) continue;
        const t = (a / 16) * Math.PI * 2;
        g.set(Math.round(7.5 + Math.cos(t) * 6.3), Math.round(7.5 + Math.sin(t) * 6.3), col);
      }
      g.stamp(glyph, 6, 5);
    } else if (state === "found") {
      // solid ring, cross-hair ticks and a diamond: the satellite has seen it
      g.ring(8, 8, 6.5, 6.5, col);
      g.rect(7, 0, 2, 3, col).rect(7, 13, 2, 3, col).rect(0, 7, 3, 2, col).rect(13, 7, 3, 2, col);
      g.stamp([".y.", "yYy", ".y."], 6, 7);
      g.set(7, 6, "Y").set(8, 6, "Y");
    } else {
      // filled disc and a check mark: sampled
      g.ell(8, 8, 6.5, 6.5, col);
      g.stamp(["....Y", "...Y.", "Y.Y..", ".Y..."], 5, 6);
    }
  });

const routeMarker = (v: Ver) =>
  build(v, 16, 16, (g, S) => {
    // two cairn posts with flags and a chevron between them
    for (const x of [2, 12]) {
      g.rect(x, 7, 2, 7, "h").set(x, 6, "a").set(x + 1, 6, "a").set(x + 2, 7, "a").set(x + 2, 6, "a").rect(x - 1, 13, 4, 1, "j");
      if (S.rich) g.set(x, 8, "l");
    }
    g.line(6, 4, 9, 8, "Y").line(9, 8, 6, 12, "Y").line(7, 4, 10, 8, "Y").line(10, 8, 7, 12, "Y");
  });

const tracks = (v: Ver) =>
  build(v, 16, 16, (g) => {
    // boot prints: heel and sole, alternating left and right
    const print = (x: number, y: number) => g.rect(x, y, 2, 2, "4").rect(x, y + 3, 2, 1, "4").set(x + 1, y + 2, "2");
    print(4, 1); print(9, 5); print(4, 9); print(9, 12);
  }, { flat: true });

const horizon = (time: "day" | "dusk" | "night") => (v: Ver) =>
  build(v, 64, 16, (g, S) => {
    const sky = { day: ["u", "u", "w"], dusk: ["V", "U", "W"], night: ["t", "t", "T"] }[time];
    const bands = pick<[number, number, number]>(S, [5, 4, 3], [4, 4, 4], [5, 5, 2]);
    for (let y = 0; y < 12; y++) {
      const k = y < bands[0] ? 0 : y < bands[0] + bands[1] ? 1 : 2;
      for (let x = 0; x < 64; x++) {
        const edge = y === bands[0] - 1 || y === bands[0] + bands[1] - 1;
        g.set(x, y, S.dither && edge && (x + y) % 2 ? sky[Math.min(k + 1, 2)]! : sky[k]!);
      }
    }
    if (time === "night") {
      for (let i = 0; i < 14; i++) g.set(Math.floor(hash(i, 1, 5) * 64), Math.floor(hash(i, 2, 5) * 9), "z");
      // Phobos (a lumpy potato) and Deimos (a dot)
      g.stamp([".zzz.", "zzzzZ", ".ZZZ."], 14, 2).set(44, 5, "z").set(45, 5, "Z");
    } else if (time === "dusk") {
      g.ell(46, 11, 8, 6, S.v === "C" ? "U" : "W").ell(46, 11, 5, 4, "Y");
      if (S.rich) g.ring(46, 11, 8, 6, "I");
      g.stamp(["zz", "zz"], 12, 3);
    } else {
      g.ell(48, 6, 3, 3, "Y");
      if (S.dither) for (const [x, y] of [[44, 6], [52, 6], [48, 2], [48, 10]] as const) g.set(x, y, "w");
    }
    const hill = time === "night" ? ["N", "M"] : ["2", "4"];
    for (let x = 0; x < 64; x++) {
      const h = 11 - Math.round(2 * Math.sin((4 * Math.PI * x) / 64 + 1) + 1.2 * Math.sin((10 * Math.PI * x) / 64 + 2));
      for (let y = h; y < 16; y++) g.set(x, y, y === h && S.rich ? (time === "night" ? "L" : "1") : y < h + 3 ? hill[0]! : hill[1]!);
    }
  }, { flat: true, wrap: true });

const defs = {
  regolith1: groundTile("light", 1), regolith2: groundTile("mid", 2), regolith3: groundTile("dark", 3),
  rocky: rocky(false), boulder, ripples: ripples(false), cliff, channel,
  craterNW: crater("NW"), craterN: crater("N"), craterNE: crater("NE"),
  craterW: crater("W"), craterFloor: crater("floor"), craterE: crater("E"),
  craterSW: crater("SW"), craterS: crater("S"), craterSE: crater("SE"),
  drift, siteUnknown: siteMarker("unknown"), siteFound: siteMarker("found"), siteSampled: siteMarker("sampled"),
  routeMarker, tracks,
  nightRegolith1: groundTile("light", 1, true), nightRegolith2: groundTile("mid", 2, true), nightRegolith3: groundTile("dark", 3, true),
  nightRocky: rocky(true), nightRipples: ripples(true),
  horizonDay: horizon("day"), horizonDusk: horizon("dusk"), horizonNight: horizon("night"),
};

export const { A, B, C } = versions(defs);
export type TerrainKey = keyof typeof defs;
/** Tiles that tile seamlessly in both directions (the tile test of the tests and the preview). */
export const SEAMLESS: TerrainKey[] = [
  "regolith1", "regolith2", "regolith3", "rocky", "ripples", "nightRegolith1", "nightRegolith2", "nightRegolith3", "nightRocky", "nightRipples",
];
