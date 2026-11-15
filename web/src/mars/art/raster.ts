/**
 * The small drawing kit the crew art is made with. Shapes are drawn on a grid of "semantic" characters
 * (suit, shade, visor, trim...), then each art direction turns the grid into a `Sprite`: it adds its own
 * outline (full, selective or none) and maps the semantic characters to its own palette.
 */
import type { Sprite } from "./paint";

export type Version = "A" | "B" | "C";
export const VERSIONS: readonly Version[] = ["A", "B", "C"];
/** Most colours a sprite may use in each version (transparent not counted). */
export const COLOUR_LIMIT: Record<Version, { min: number; max: number }> = {
  A: { min: 1, max: 4 },
  B: { min: 1, max: 12 },
  C: { min: 3, max: 5 },
};

export class Grid {
  readonly c: string[][];
  constructor(readonly w: number, readonly h: number) {
    this.c = Array.from({ length: h }, () => Array.from({ length: w }, () => "."));
  }
  static from(rows: readonly string[]): Grid {
    const g = new Grid(Math.max(...rows.map((r) => r.length)), rows.length);
    g.stamp(rows, 0, 0);
    return g;
  }
  get(x: number, y: number): string {
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? "." : this.c[y]![x]!;
  }
  set(x: number, y: number, ch: string): this {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y]![x] = ch;
    return this;
  }
  rect(x: number, y: number, w: number, h: number, ch: string): this {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, ch);
    return this;
  }
  /** Copies `rows` with their top-left at (x, y); `.` leaves what is underneath. */
  stamp(rows: readonly string[], x: number, y: number): this {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) if (row[i] !== ".") this.set(x + i, y + j, row[i]!);
    });
    return this;
  }
  /** Replaces every `from` character with `to` inside a box. */
  recolour(from: string, to: string, x = 0, y = 0, w = this.w, h = this.h): this {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.get(i, j) === from) this.set(i, j, to);
    return this;
  }
  rows(): string[] {
    return this.c.map((r) => r.join(""));
  }
  mirror(): Grid {
    return Grid.from(this.c.map((r) => [...r].reverse().join("")));
  }
  shift(dx: number, dy: number): Grid {
    const g = new Grid(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) g.set(x + dx, y + dy, this.get(x, y));
    return g;
  }
}

export const mirrorRows = (rows: readonly string[]) => rows.map((r) => [...r].reverse().join(""));

/** How a version draws the edge of a shape. */
export type OutlineMode = "full" | "selective" | "none";

export interface Style {
  outline: OutlineMode;
  /** Colour of every semantic character, plus `o` (dark outline) and, for selective, `O` (lit outline). */
  palette: Record<string, string>;
}

/**
 * Adds an outline in transparent pixels next to the shape (4-neighbours). Full: all `o`.
 * Selective: `o` below and right of the shape (the shadow side), `O` on the lit top and left.
 */
export function outlined(rows: readonly string[], mode: OutlineMode): string[] {
  if (mode === "none") return [...rows];
  const g = Grid.from(rows);
  const out = Grid.from(rows);
  const solid = (x: number, y: number) => g.get(x, y) !== ".";
  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      if (solid(x, y)) continue;
      const below = solid(x, y - 1), right = solid(x - 1, y), above = solid(x, y + 1), left = solid(x + 1, y);
      if (!(below || right || above || left)) continue;
      out.set(x, y, mode === "full" || below || right ? "o" : "O");
    }
  }
  return out.rows();
}

/** Turns a semantic grid into a sprite of one version: outline, then only the palette entries it uses. */
export function render(rows: readonly string[], style: Style): Sprite {
  const out = outlined(rows, style.outline);
  const used = new Set(out.join(""));
  const palette: Record<string, string> = {};
  for (const ch of used) {
    if (ch === ".") continue;
    const colour = style.palette[ch];
    if (!colour) throw new Error(`no colour for "${ch}"`);
    palette[ch] = colour;
  }
  return { rows: out, palette };
}

/** Number of distinct colours a sprite actually paints. */
export function colourCount(s: Sprite): number {
  const used = new Set(s.rows.join(""));
  used.delete(".");
  return new Set([...used].map((ch) => s.palette[ch]?.toLowerCase())).size;
}

/** Common checks used by the tests of every module. */
export function problems(s: Sprite, v: Version): string[] {
  const out: string[] = [];
  const w = s.rows[0]?.length ?? 0;
  if (s.rows.some((r) => r.length !== w)) out.push("rows of different length");
  for (const ch of new Set(s.rows.join(""))) if (ch !== "." && !(ch in s.palette)) out.push(`"${ch}" not in palette`);
  const n = colourCount(s);
  if (n < COLOUR_LIMIT[v].min || n > COLOUR_LIMIT[v].max) out.push(`${n} colours`);
  return out;
}
