/**
 * The Earth of the cockpit window: a band of real land per mission region, baked from the NASA
 * Blue Marble images by `Tools/cockpit-earth/bake_earth.py` into `earthData.ts`.
 *
 * A band is EARTH_PERIOD columns along the limb (1 column = 1 / EARTH_RS radians) by EARTH_DEPTH
 * rows below it (row d is the angle beta from the limb with d = EARTH_RD * (1 - cos beta)); the
 * target region is at the middle column, EARTH_TARGET_D rows down. Everything here is pure data
 * work; `paintBand` turns a band into pixels for the scene to scroll.
 */
import { EARTH_BANDS, EARTH_DEPTH, EARTH_PERIOD, EARTH_RD, EARTH_RS, EARTH_TARGET_D, type EarthBand } from "./earthData";

export { EARTH_DEPTH, EARTH_PERIOD, EARTH_TARGET_D };

export type RegionKey = keyof typeof EARTH_BANDS;

/** Palette indices of a band. */
export const DEEP = 0, SHALLOW = 1, FOREST = 2, GRASS = 3, DRY = 4, ROCK = 5, ICE = 6, SEA_ICE = 7;
export const isLand = (c: number) => c >= FOREST && c <= ICE;

/** The fixed palette: the eight baked classes, then the colours the painter adds. */
export const EARTH_COLOURS = [
  "#10346e", // deep ocean
  "#2a6fb8", // shallow water and the shoreline
  "#1f7040", // forest
  "#5fa350", // grassland
  "#cfae6a", // dry land
  "#8c7a5e", // rock and tundra
  "#ffffff", // land ice and snow
  "#c8e2f2", // sea ice
  "#184684", // wave fleck on the deep ocean
  "#62a8e0", // haze near the horizon
  "#c4ecff", // the atmosphere line
  "#dbe8f2", // cloud shade
] as const;
const WAVE = 8, HAZE = 9, AIR = 10, CLOUD_SHADE = 11;

/** Short name drawn under the target marker. */
export const REGION_LABEL: Record<RegionKey, string> = {
  costaRica: "COSTA RICA",
  amazon: "AMAZON",
  arctic: "ARCTIC ICE",
};

/** Maps the bridge's region id (`state.design.region`) to a band. Unknown or unset: Costa Rica. */
export function regionKey(id: unknown): RegionKey {
  const s = typeof id === "string" ? id : "";
  if (/amazon/i.test(s)) return "amazon";
  if (/arctic|ice/i.test(s)) return "arctic";
  return "costaRica";
}

const cache = new Map<RegionKey, Uint8Array>();

/** The band's palette indices, row by row (EARTH_DEPTH rows of EARTH_PERIOD). Decoded once. */
export function bandPixels(region: RegionKey): Uint8Array {
  let px = cache.get(region);
  if (!px) {
    px = decode(EARTH_BANDS[region].rle, EARTH_PERIOD * EARTH_DEPTH);
    cache.set(region, px);
  }
  return px;
}

/** Run-length decoding: byte = class << 5 | n; n < 31 is a run of n + 1, n = 31 is followed by a 16-bit length. */
export function decode(code: string, size: number): Uint8Array {
  const bytes = atob(code);
  const out = new Uint8Array(size);
  let o = 0;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes.charCodeAt(i);
    let n = b & 31;
    if (n === 31) {
      n = (bytes.charCodeAt(i + 1) << 8) | bytes.charCodeAt(i + 2);
      i += 2;
    } else n += 1;
    out.fill(b >> 5, o, o + n);
    o += n;
  }
  return out;
}

const RAD = Math.PI / 180;

/** Where a place on Earth falls in a band: column and row, fractional. `null` on the far side or outside the band. */
export function project(region: RegionKey, lat: number, lon: number): { col: number; row: number } | null {
  const band: EarthBand = EARTH_BANDS[region];
  const p = [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)];
  const dot = (v: readonly number[]) => p[0]! * v[0]! + p[1]! * v[1]! + p[2]! * v[2]!;
  const sinB = dot(band.n);
  if (sinB < 0) return null;
  const row = EARTH_RD * (1 - Math.sqrt(1 - sinB * sinB)) - 0.5;
  const col = EARTH_PERIOD / 2 + Math.atan2(dot(band.e), dot(band.a)) * EARTH_RS - 0.5;
  if (row >= EARTH_DEPTH || col < 0 || col >= EARTH_PERIOD) return null;
  return { col, row };
}

/** Palette index at a place on Earth, or `null` if the region's band does not show it. */
export function classAt(region: RegionKey, lat: number, lon: number): number | null {
  const at = project(region, lat, lon);
  if (!at) return null;
  return bandPixels(region)[Math.max(0, Math.round(at.row)) * EARTH_PERIOD + Math.round(at.col)] ?? null;
}

/** Column and row (whole pixels) of the target and of the ground station of a region. */
export function regionPlaces(region: RegionKey) {
  const band = EARTH_BANDS[region];
  const t = project(region, band.target[0], band.target[1])!;
  const s = project(region, band.station[0], band.station[1])!;
  return {
    target: { col: Math.round(t.col), row: Math.round(t.row) },
    station: { col: Math.round(s.col), row: Math.round(s.row) },
  };
}

function hash(x: number, y: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Rows of haze below the limb, and rows of atmosphere drawn above it. */
export const HAZE_ROWS = 9;
export const AIR_ROWS = 3;

/**
 * The band as the scene shows it: AIR_ROWS rows of atmosphere, then the surface with a bright limb line,
 * dithered haze under it and wave flecks on the open ocean. Returns palette indices into EARTH_COLOURS
 * (255 = transparent), (AIR_ROWS + EARTH_DEPTH) rows of EARTH_PERIOD.
 */
export function paintBand(region: RegionKey): Uint8Array {
  const src = bandPixels(region);
  const W = EARTH_PERIOD;
  const out = new Uint8Array(W * (AIR_ROWS + EARTH_DEPTH)).fill(255);
  for (let x = 0; x < W; x++) {
    // Thin atmosphere: a dithered row, then a solid line of haze right on the limb.
    if ((x & 1) === 0) out[W + x] = HAZE;
    out[2 * W + x] = HAZE;
  }
  for (let d = 0; d < EARTH_DEPTH; d++) {
    for (let x = 0; x < W; x++) {
      let c: number = src[d * W + x]!;
      if (c === DEEP && hash(x >> 1, d) % 61 === 0 && src[d * W + (x ^ 1)] === DEEP) c = WAVE;
      if (d === 0) c = AIR;
      else if (d < HAZE_ROWS && (HAZE_ROWS - d) * 2 > BAYER[(d & 3) * 4 + (x & 3)]!) c = isLand(c) && d > 3 ? c : HAZE;
      out[(d + AIR_ROWS) * W + x] = c;
    }
  }
  return out;
}

/**
 * A layer of pixel clouds over the band, generated from a fixed seed: flat-bottomed puffs, squashed
 * towards the horizon. Returns palette indices (ICE = white, CLOUD_SHADE) or 255, EARTH_DEPTH rows.
 */
export function paintClouds(region: RegionKey): Uint8Array {
  const W = EARTH_PERIOD;
  const out = new Uint8Array(W * EARTH_DEPTH).fill(255);
  const seed = region === "arctic" ? 31 : region === "amazon" ? 17 : 5;
  const count = region === "arctic" ? 12 : 20;
  for (let i = 0; i < count; i++) {
    const h0 = hash(i * 7 + seed, seed);
    const row = 4 + (hash(i, seed + 1) % (EARTH_DEPTH - 12));
    const tall = row < 14 ? 1 : row < 34 ? 2 : 3 + (h0 % 2);
    const len = 10 + (hash(i, seed + 2) % 34) + tall * 4;
    const x0 = hash(i, seed + 3) % W;
    for (let r = 0; r < tall; r++) {
      // Rows get wider towards the flat base; the base row is the shaded one.
      const inset = (tall - 1 - r) * 3 + (hash(i * 13 + r, seed) % 3);
      const shift = hash(i * 5 + r, seed + 9) % 4;
      for (let x = inset + shift; x < len - inset + shift; x++) {
        const col = (x0 + x) % W;
        out[(row + r) * W + col] = r === tall - 1 && tall > 1 ? CLOUD_SHADE : ICE;
      }
    }
    // A loose wisp beside the puff.
    const wl = 4 + (h0 % 7);
    for (let x = 0; x < wl; x++) out[(row + tall - 1) * W + ((x0 + len + 3 + x) % W)] = ICE;
  }
  return out;
}
