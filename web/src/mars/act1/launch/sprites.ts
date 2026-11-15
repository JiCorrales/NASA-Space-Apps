/**
 * Pixel sprites of the launch act, as code: arrays of strings, one character per pixel, and a palette map.
 * Adapted from Alexander's launch prototype (a standalone HTML file); the shapes are his, the greys are
 * moved to the cockpit's palette. `paint` draws rows as they are, `blit` rotates them by nearest neighbour;
 * both can draw each sprite pixel as an S x S block, so every pixel stays whole on the 640 x 360 grid.
 */

/** Palette: one character per colour. "." is transparent. */
export const PAL: Record<string, string> = {
  w: "#eef1f6", g: "#8fa3b8", d: "#4b5a6b", r: "#ff6464", b: "#5b86e0", o: "#ff7a2e", y: "#ffd23f", s: "#3d6fd8",
  k: "#05070f", h: "#3a2a22", e: "#05070f", t: "#f2b48c", n: "#c0566b", m: "#9aa3b0", c: "#86dcf2", G: "#62d394",
};

export type Rows = readonly string[];

export const FAIRING: Rows = ["...w...", "..www..", "..www..", ".wwwww.", ".wwwww.", ".wwgww."];
export const CAPSULE: Rows = [".......", "..www..", ".wwwww.", ".wbbbw.", ".wwwww.", ".ggggg."];
/** What shows once the fairing is gone: the CubeSat dispenser on top of the second stage. */
export const PAYLOAD: Rows = [".......", ".......", ".......", ".......", "..bbb..", "..bbb.."];
export const STAGE2: Rows = [".ddddd.", ".wwwww.", ".wwwww.", ".wwwww.", ".ggggg."];
export const STAGE1: Rows = [
  ".ddddd.", ".wwwww.", ".wwrww.", ".wwrww.", ".wwwww.", ".wwwww.", ".wwwww.", ".wwwww.", ".wwwww.", ".ggggg.", "ww.g.ww", "w..g..w",
];
export const ENGINE2: Rows = ["..ggg..", "...g..."];
export const FLAME: readonly Rows[] = [
  ["..oyo..", ".oyyyo.", "..oyo..", "...o...", "...o..."],
  [".oyyyo.", "..yyy..", "..oyo..", "...o...", "......."],
];
export const BIGFLAME: readonly Rows[] = [
  [".oyyyo.", "oyyyyyo", ".oyyyo.", "..oyo..", "..o.o..", "...o..."],
  ["oyyyyyo", ".oyyyo.", ".oyyyo.", "..oyo..", "...o...", "...o..."],
];
export const SAT: Rows = ["www", "wbw", "www"];
export const SAT_OPEN: Rows = ["ss.www.ss", "sssbwbsss", "ss.www.ss"];
/** The mission-control operator: hair, eyes, mouth, headset and shirt. */
export const FACE: Rows = [
  "...hhhhhh...", "..hhhhhhhh..", ".khhhhhhhhk.", ".kttttttttk.", ".ktetttettk.", ".kttttttttk.",
  ".ktttnntttk.", "mkttttttttk.", ".mmttttttt..", "...cccccc...", "..cccccccc..", ".cccccccccc.",
];
/** The two fairing halves as they fall away. */
export const FAIRING_HALVES: readonly Rows[] = [["w..", "ww.", "ww.", "ww."], ["..w", ".ww", ".ww", ".ww"]];

/** Replaces the stripe colour "r" of a body with another palette character. */
export const stripe = (rows: Rows, colour: string): Rows => rows.map((r) => r.replace(/r/g, colour));

/** Body of the launcher for a vehicle id, as it is at a stage of the climb. */
export function rocketBody(vehicle: string, stage: { booster: boolean; fairing: boolean }): Rows {
  const capsule = /iss|station|cargo/i.test(vehicle);
  const top = capsule ? CAPSULE : stage.fairing ? FAIRING : PAYLOAD;
  const rows = [...top, ...STAGE2, ...(stage.booster ? STAGE1 : ENGINE2)];
  if (capsule) return rows;
  // A commercial rideshare wears a yellow stripe, the NASA-provided launch a blue one.
  return stripe(rows, /rideshare|commercial|broker/i.test(vehicle) ? "y" : "b");
}

/** The smallest drawing surface the sprites need. A canvas context satisfies it. */
export interface Pen { fillStyle: string | CanvasGradient | CanvasPattern; fillRect(x: number, y: number, w: number, h: number): void }

/** Draws rows at (x, y), one S x S block per sprite pixel; `tint` paints every pixel one colour. */
export function paint(c: Pen, rows: Rows, x = 0, y = 0, tint?: string, S = 1): void {
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j]!;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i]!;
      if (ch === ".") continue;
      c.fillStyle = tint ?? PAL[ch] ?? "#f0f";
      c.fillRect(x + i * S, y + j * S, S, S);
    }
  }
}

/**
 * Draws rows with their pivot (px, py) at (x, y), rotated by `rot` radians by nearest neighbour, one S x S
 * block per sprite pixel. The pivot defaults to the centre.
 */
export function blit(c: Pen, rows: Rows, x: number, y: number, rot = 0, px?: number, py?: number, tint?: string, S = 1): void {
  const sh = rows.length, sw = rows[0]?.length ?? 0;
  const ox = px ?? (sw - 1) / 2, oy = py ?? (sh - 1) / 2;
  x = Math.round(x);
  y = Math.round(y);
  if (rot === 0) return paint(c, rows, Math.round(x - ox * S), Math.round(y - oy * S), tint, S);
  const cs = Math.cos(rot), sn = Math.sin(rot), r = Math.ceil(Math.hypot(sw, sh));
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const sx = Math.round(cs * dx + sn * dy + ox), sy = Math.round(-sn * dx + cs * dy + oy);
      if (sx < 0 || sy < 0 || sx >= sw || sy >= sh) continue;
      const ch = rows[sy]![sx];
      if (ch === undefined || ch === ".") continue;
      c.fillStyle = tint ?? PAL[ch] ?? "#f0f";
      c.fillRect(x + dx * S, y + dy * S, S, S);
    }
  }
}
