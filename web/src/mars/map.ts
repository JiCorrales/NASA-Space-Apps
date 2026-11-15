// The map of a run, made from the seed: terrain that costs more or less to cross, the base site and three sample
// sites at different distances. What is *known* of it is the world's business (map knowledge is in world.ts).
import { TEAM } from "./data";
import { stream } from "./rng";
import type { Pos, SiteId, TileChar } from "./types";

export interface Site { id: SiteId; name: string; pos: Pos }
export interface GameMap { width: number; height: number; tiles: TileChar[][]; base: Pos; sites: Site[] }

const COST: Record<string, number> = { ".": 1, ",": 2, "~": 3, "^": 3, "#": Infinity };
export const tileCost = (c: string) => COST[c] ?? 1;

export const dist = (a: Pos, b: Pos) => Math.hypot(a.x - b.x, a.y - b.y);
export const cheb = (a: Pos, b: Pos) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

const SITE_NAMES = ["Dune Edge", "Ridge Foot", "Far Basin"];
const SITE_BANDS: [number, number][] = [[8, 10], [15, 18], [23, 27]];

function lattice(rnd: () => number, w: number, h: number): number[][] {
  return Array.from({ length: h }, () => Array.from({ length: w }, rnd));
}

function sample(l: number[][], fx: number, fy: number): number {
  const x0 = Math.min(l[0]!.length - 2, Math.floor(fx)), y0 = Math.min(l.length - 2, Math.floor(fy));
  const tx = fx - x0, ty = fy - y0;
  const a = l[y0]![x0]!, b = l[y0]![x0 + 1]!, c = l[y0 + 1]![x0]!, d = l[y0 + 1]![x0 + 1]!;
  return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
}

export function generateMap(seed: number): GameMap {
  const W = TEAM.mapWidth.value, H = TEAM.mapHeight.value;
  const rnd = stream(seed, 101);
  const coarse = lattice(rnd, 7, 5), fine = lattice(rnd, 14, 9);
  const tiles: TileChar[][] = [];
  for (let y = 0; y < H; y++) {
    const row: TileChar[] = [];
    for (let x = 0; x < W; x++) {
      const v = 0.6 * sample(coarse, (x / (W - 1)) * 5, (y / (H - 1)) * 3) + 0.4 * sample(fine, (x / (W - 1)) * 12, (y / (H - 1)) * 7);
      row.push(v < 0.44 ? "." : v < 0.56 ? "," : v < 0.66 ? "~" : v < 0.72 ? "^" : ",");
    }
    tiles.push(row);
  }
  // crater rims, with one gap each so they are not walls
  const craters = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < craters; i++) {
    const cx = 10 + Math.floor(rnd() * 28), cy = 3 + Math.floor(rnd() * 18), r = 3 + Math.floor(rnd() * 2);
    const gap = rnd() * Math.PI * 2;
    for (let a = 0; a < 360; a += 6) {
      const ang = (a * Math.PI) / 180;
      if (Math.abs(Math.atan2(Math.sin(ang - gap), Math.cos(ang - gap))) < 0.5) continue;
      const x = Math.round(cx + r * Math.cos(ang)), y = Math.round(cy + r * Math.sin(ang));
      if (tiles[y]?.[x] !== undefined) tiles[y]![x] = "#";
    }
  }
  const base: Pos = { x: 4 + Math.floor(rnd() * 5), y: 8 + Math.floor(rnd() * 8) };
  const sites: Site[] = [];
  SITE_BANDS.forEach(([lo, hi], i) => {
    for (let tries = 0; tries < 200; tries++) {
      const d = lo + rnd() * (hi - lo), ang = (rnd() - 0.5) * Math.PI * 1.3;
      const p = { x: Math.round(base.x + d * Math.cos(ang)), y: Math.round(base.y + d * Math.sin(ang)) };
      if (p.x < 1 || p.y < 1 || p.x > W - 2 || p.y > H - 2) continue;
      if (sites.some((s) => dist(s.pos, p) < 7)) continue;
      sites.push({ id: `site-${i + 1}` as SiteId, name: SITE_NAMES[i]!, pos: p });
      return;
    }
    // fall back to a straight spot east of the base
    sites.push({ id: `site-${i + 1}` as SiteId, name: SITE_NAMES[i]!, pos: { x: Math.min(W - 2, base.x + Math.round((lo + hi) / 2)), y: Math.min(H - 2, Math.max(1, base.y + (i - 1) * 4)) } });
  });
  const clear = (p: Pos, r: number) => {
    for (let y = p.y - r; y <= p.y + r; y++) for (let x = p.x - r; x <= p.x + r; x++) if (tiles[y]?.[x] !== undefined) tiles[y]![x] = ".";
  };
  clear(base, 2);
  sites.forEach((s) => clear(s.pos, 1));
  const map: GameMap = { width: W, height: H, tiles, base, sites };
  // make sure every site can be reached: carve a straight rough corridor through rims if not
  for (const s of sites) {
    if (!findPath(map, base, s.pos)) {
      let { x, y } = base;
      while (x !== s.pos.x || y !== s.pos.y) {
        x += Math.sign(s.pos.x - x); y += Math.sign(s.pos.y - y);
        if (tiles[y]![x] === "#") tiles[y]![x] = ",";
      }
    }
  }
  return map;
}

// ---- shortest path (Dijkstra, 8 neighbours, the cost of the tile entered) ----

class Heap {
  private a: [number, number][] = [];
  get size() { return this.a.length; }
  push(k: number, v: number) {
    const a = this.a; a.push([k, v]); let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p]![0] <= a[i]![0]) break; [a[p], a[i]] = [a[i]!, a[p]!]; i = p; }
  }
  pop(): [number, number] {
    const a = this.a, top = a[0]!, last = a.pop()!;
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && a[l]![0] < a[m]![0]) m = l;
        if (r < a.length && a[r]![0] < a[m]![0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i]!, a[m]!]; i = m;
      }
    }
    return top;
  }
}

export interface PathResult { path: Pos[]; cost: number }

/** Cheapest path from `from` to `to`, excluding the start tile. Null if the target cannot be reached. */
export function findPath(map: GameMap, from: Pos, to: Pos): PathResult | null {
  const W = map.width, H = map.height, idx = (p: Pos) => p.y * W + p.x;
  const best = new Float64Array(W * H).fill(Infinity), prev = new Int32Array(W * H).fill(-1);
  const heap = new Heap();
  best[idx(from)] = 0; heap.push(0, idx(from));
  const goal = idx(to);
  while (heap.size) {
    const [c, u] = heap.pop();
    if (c > best[u]!) continue;
    if (u === goal) break;
    const ux = u % W, uy = (u / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const x = ux + dx, y = uy + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const w = tileCost(map.tiles[y]![x]!);
      if (w === Infinity) continue;
      const v = y * W + x, nc = c + w;
      if (nc < best[v]!) { best[v] = nc; prev[v] = u; heap.push(nc, v); }
    }
  }
  if (best[goal] === Infinity) return null;
  const path: Pos[] = [];
  for (let u = goal; u !== idx(from); u = prev[u]!) path.push({ x: u % W, y: (u / W) | 0 });
  return { path: path.reverse(), cost: best[goal]! };
}
