/**
 * Drawing kit of the world art: a character grid with a few whole-pixel primitives, tileable noise,
 * and `build`, which turns a drawing function into a Sprite for one art direction. A drawing function
 * paints with one-letter codes (see marsPalette.ts); `build` looks them up in the version's palette,
 * adds the outline (A, B), and merges the rarest colours until the version's colour limit holds.
 */
import type { Art, Sprite } from "./paint";
import { COLOUR_LIMIT, PALETTE, VERSIONS, type Ver } from "./marsPalette";

export type { Ver };

export class Grid {
  readonly d: string[];
  constructor(readonly w: number, readonly h: number, readonly wrap = false) {
    this.d = new Array<string>(w * h).fill(".");
  }
  private ix(x: number, y: number): number {
    x = Math.floor(x); y = Math.floor(y);
    if (this.wrap) return (((y % this.h) + this.h) % this.h) * this.w + (((x % this.w) + this.w) % this.w);
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? -1 : y * this.w + x;
  }
  get(x: number, y: number): string {
    const i = this.ix(x, y);
    return i < 0 ? "." : this.d[i]!;
  }
  set(x: number, y: number, c: string): this {
    const i = this.ix(x, y);
    if (i >= 0) this.d[i] = c;
    return this;
  }
  /** Paints only where the pixel is still transparent. */
  under(x: number, y: number, c: string): this {
    if (this.get(x, y) === ".") this.set(x, y, c);
    return this;
  }
  rect(x: number, y: number, w: number, h: number, c: string): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }
  frame(x: number, y: number, w: number, h: number, c: string): this {
    this.rect(x, y, w, 1, c).rect(x, y + h - 1, w, 1, c).rect(x, y, 1, h, c).rect(x + w - 1, y, 1, h, c);
    return this;
  }
  /** Filled ellipse centred at (cx, cy) in pixel-edge coordinates. */
  ell(cx: number, cy: number, rx: number, ry: number, c: string): this {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    return this;
  }
  /** One-pixel-thick ellipse. */
  ring(cx: number, cy: number, rx: number, ry: number, c: string): this {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        const inner = ((x + 0.5 - cx) / (rx - 1)) ** 2 + ((y + 0.5 - cy) / (ry - 1)) ** 2;
        if (dx * dx + dy * dy <= 1 && (rx <= 1 || ry <= 1 || inner > 1)) this.set(x, y, c);
      }
    return this;
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string): this {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    let err = dx + dy;
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  }
  /** Draws rows of characters with the top-left at (x, y); `.` and space are skipped. */
  stamp(rows: string[], x: number, y: number): this {
    rows.forEach((r, j) => [...r].forEach((ch, i) => ch !== "." && ch !== " " && this.set(x + i, y + j, ch)));
    return this;
  }
  /** Replaces every pixel of `from` with `to`. */
  swap(from: string, to: string): this {
    for (let i = 0; i < this.d.length; i++) if (this.d[i] === from) this.d[i] = to;
    return this;
  }
  /** Copy rotated about the centre by nearest neighbour (whole pixels stay whole pixels). */
  rotated(deg: number): Grid {
    const out = new Grid(this.w, this.h);
    const a = (deg * Math.PI) / 180, cs = Math.cos(a), sn = Math.sin(a);
    const cx = this.w / 2, cy = this.h / 2;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        out.set(x, y, this.get(Math.floor(cx + dx * cs + dy * sn), Math.floor(cy - dx * sn + dy * cs)));
      }
    return out;
  }
  /** One-pixel outline of colour `c` around every opaque shape (4-neighbours). */
  outline(c: string): this {
    const src = this.d.slice();
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= this.w || y >= this.h ? "." : src[y * this.w + x]!);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (at(x, y) !== ".") continue;
        if (at(x - 1, y) !== "." || at(x + 1, y) !== "." || at(x, y - 1) !== "." || at(x, y + 1) !== ".") this.d[y * this.w + x] = c;
      }
    return this;
  }
}

/** Deterministic hash to [0, 1). */
export function hash(x: number, y: number, seed = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Value noise on a w x h torus with lattice spacing `cell`, in [0, 1): tiles seamlessly. */
export function tnoise(x: number, y: number, w: number, h: number, cell: number, seed = 0): number {
  const gx = w / cell, gy = h / cell;
  const fx = (x / cell) % gx, fy = (y / cell) % gy;
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const tx = fx - x0, ty = fy - y0;
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const v = (i: number, j: number) => hash(((i % gx) + gx) % gx, ((j % gy) + gy) % gy, seed);
  const a = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * sx;
  const b = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * sx;
  return a + (b - a) * sy;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Ordered-dither threshold in (0, 1) for a pixel; period 4, so it tiles on any multiple of 4. */
export const bayer = (x: number, y: number): number => (BAYER[(y & 3) * 4 + (x & 3)]! + 0.5) / 16;

/** What a drawing function may ask about the art direction it is drawing for. */
export interface Style {
  v: Ver;
  /** A and B draw an outline; C does not. */
  outlined: boolean;
  /** B adds highlights and second tones. */
  rich: boolean;
  /** A and B use ordered dithering for texture; C stays flat. */
  dither: boolean;
}
export const styleOf = (v: Ver): Style => ({ v, outlined: v !== "C", rich: v === "B", dither: v !== "C" });
export const pick = <T>(S: Style, a: T, b: T, c: T): T => (S.v === "A" ? a : S.v === "B" ? b : c);

export interface BuildOpts {
  wrap?: boolean;
  /** Skip the outline even for A and B (tiles, overlays, effects). */
  flat?: boolean;
  /** Draw the outline before this callback runs, e.g. to add effects that must stay outside it. */
  after?: (g: Grid, S: Style) => void;
}

function rgba(c: string): [number, number, number, number] {
  const n = (i: number) => parseInt(c.slice(i, i + 2), 16);
  return [n(1), n(3), n(5), c.length > 7 ? n(7) : 255];
}

/** Merges the rarest colours into their nearest neighbour until at most `max` remain; `keep` is never merged away. */
function reduce(rows: string[], palette: Record<string, string>, max: number, keep?: string): Record<string, string> {
  const pal = { ...palette };
  const count = (): Map<string, number> => {
    const m = new Map<string, number>();
    for (const r of rows) for (const ch of r) if (ch !== ".") m.set(ch, (m.get(ch) ?? 0) + 1);
    return m;
  };
  // Chars with the same colour are one colour: fold them first.
  const first = new Map<string, string>();
  for (const [ch] of count()) {
    const col = pal[ch]!;
    const f = first.get(col);
    if (f && f !== ch) remap(rows, ch, f);
    else first.set(col, ch);
  }
  for (;;) {
    const m = count();
    if (m.size <= max) break;
    const victim = [...m.entries()].filter(([ch]) => ch !== keep).sort((a, b) => a[1] - b[1])[0]![0];
    const vc = rgba(pal[victim]!);
    let best = "", bd = Infinity;
    for (const ch of m.keys()) {
      if (ch === victim) continue;
      const c = rgba(pal[ch]!);
      const d = (c[0] - vc[0]) ** 2 + (c[1] - vc[1]) ** 2 + (c[2] - vc[2]) ** 2 + (c[3] - vc[3]) ** 2 * 2;
      if (d < bd) { bd = d; best = ch; }
    }
    remap(rows, victim, best);
  }
  const used = count();
  for (const ch of Object.keys(pal)) if (!used.has(ch)) delete pal[ch];
  return pal;
}
function remap(rows: string[], from: string, to: string): void {
  for (let j = 0; j < rows.length; j++) rows[j] = rows[j]!.split(from).join(to);
}

/** Runs a drawing function for one version and returns the finished sprite. */
export function build(v: Ver, w: number, h: number, draw: (g: Grid, S: Style) => void, o: BuildOpts = {}): Sprite {
  const S = styleOf(v);
  const g = new Grid(w, h, !!o.wrap);
  draw(g, S);
  if (S.outlined && !o.flat && !o.wrap) g.outline("o");
  o.after?.(g, S);
  const rows: string[] = [];
  for (let y = 0; y < h; y++) rows.push(g.d.slice(y * w, (y + 1) * w).join(""));
  const full = PALETTE[v];
  const palette: Record<string, string> = {};
  for (const r of rows) for (const ch of r) if (ch !== ".") {
    const col = full[ch];
    if (!col) throw new Error(`world art: no colour for code "${ch}"`);
    palette[ch] = col;
  }
  return { rows, palette: reduce(rows, palette, COLOUR_LIMIT[v], "o") };
}

/** Frames of an animation: `draw` receives the frame index. */
export function frames(v: Ver, n: number, w: number, h: number, draw: (g: Grid, S: Style, f: number) => void, o: BuildOpts = {}): Sprite[] {
  return Array.from({ length: n }, (_, f) => build(v, w, h, (g, S) => draw(g, S, f), o));
}

/** `defs` maps a name to a function that draws it for a version; returns `{ A, B, C }` with the same keys. */
export function versions<K extends string>(defs: Record<K, (v: Ver) => Art>): Record<Ver, Record<K, Art>> {
  const out = {} as Record<Ver, Record<K, Art>>;
  for (const v of VERSIONS) {
    const set = {} as Record<K, Art>;
    for (const k of Object.keys(defs) as K[]) set[k] = defs[k](v);
    out[v] = set;
  }
  return out;
}
