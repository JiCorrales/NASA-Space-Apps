/**
 * Pixel-art sprites of the cockpit window, as code: small grids of palette indices, drawn on the
 * 640 x 360 canvas grid with whole pixels, a limited palette, a dark outline and no anti-aliasing.
 * Nothing here needs a canvas until `toCanvas`, so the shapes can be tested.
 */

/** A grid of palette indices. 0 is transparent. */
export interface Bitmap {
  w: number;
  h: number;
  d: Uint8Array;
}

export const bitmap = (w: number, h: number): Bitmap => ({ w, h, d: new Uint8Array(w * h) });
export const getPx = (b: Bitmap, x: number, y: number) => (x < 0 || y < 0 || x >= b.w || y >= b.h ? 0 : b.d[y * b.w + x]!);
export function setPx(b: Bitmap, x: number, y: number, c: number) {
  if (x >= 0 && y >= 0 && x < b.w && y < b.h) b.d[y * b.w + x] = c;
}
export function rect(b: Bitmap, x: number, y: number, w: number, h: number, c: number) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) setPx(b, i, j, c);
}

/** Builds a bitmap from rows of characters; `legend` maps a character to a palette index, anything else is transparent. */
export function fromRows(rows: readonly string[], legend: Record<string, number>, pad = 1): Bitmap {
  const w = Math.max(...rows.map((r) => r.length));
  const b = bitmap(w + pad * 2, rows.length + pad * 2);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) setPx(b, x + pad, y + pad, legend[row[x]!] ?? 0);
  });
  return b;
}

/** Gives every opaque shape a one-pixel outline of colour `c` (4-neighbours). */
export function outline(b: Bitmap, c: number): Bitmap {
  const out = { w: b.w, h: b.h, d: b.d.slice() };
  for (let y = 0; y < b.h; y++) {
    for (let x = 0; x < b.w; x++) {
      if (getPx(b, x, y) !== 0) continue;
      if (getPx(b, x - 1, y) || getPx(b, x + 1, y) || getPx(b, x, y - 1) || getPx(b, x, y + 1)) out.d[y * b.w + x] = c;
    }
  }
  return out;
}

/** Rotates about the centre by nearest neighbour: every pixel stays a whole pixel of the palette. */
export function rotate(b: Bitmap, degrees: number): Bitmap {
  if (degrees === 0) return { w: b.w, h: b.h, d: b.d.slice() };
  const out = bitmap(b.w, b.h);
  const a = (degrees * Math.PI) / 180;
  const cos = Math.cos(a), sin = Math.sin(a);
  const cx = (b.w - 1) / 2, cy = (b.h - 1) / 2;
  for (let y = 0; y < b.h; y++) {
    for (let x = 0; x < b.w; x++) {
      const dx = x - cx, dy = y - cy;
      out.d[y * b.w + x] = getPx(b, Math.round(cx + dx * cos + dy * sin), Math.round(cy - dx * sin + dy * cos));
    }
  }
  return out;
}

/** Paints a bitmap on a new canvas, one rectangle per run. `null` where there is no canvas (tests). */
export function toCanvas(b: Bitmap, palette: readonly string[]): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = b.w;
  cv.height = b.h;
  let c: CanvasRenderingContext2D | null = null;
  try { c = cv.getContext("2d"); } catch { c = null; }
  if (!c) return null;
  for (let y = 0; y < b.h; y++) {
    for (let x = 0; x < b.w; ) {
      const v = b.d[y * b.w + x]!;
      let n = 1;
      while (x + n < b.w && b.d[y * b.w + x + n] === v) n++;
      if (v) {
        c.fillStyle = palette[v] ?? "#f0f";
        c.fillRect(x, y, n, 1);
      }
      x += n;
    }
  }
  return cv;
}

/* ---------- The CubeSat ---------- */

/** Palette of the CubeSat, matching the design screen's `PixelCubeSat`. Index 0 is transparent. */
export const SAT = { outline: 1, frame: 2, frameDark: 3, face: 4, cell: 5, cellLine: 6, panelEdge: 7, antenna: 8, lens: 9, ring: 10, led: 11, glint: 12 } as const;
export const SAT_COLOURS = [
  "", "#0b1220", "#8fa3b8", "#4b5a6b", "#1f2a38", "#2c4fa8", "#16285a", "#9fb2c6", "#e6e9ee", "#0b0f16", "#7ce7ff", "#62d394", "#5b86e0",
];
/** Side of the square the CubeSat is drawn in; its body centre is the centre of the square. */
export const SAT_SIZE = 64;
export const SAT_BODY = { w: 10, h: 34 } as const;
/** Distance from the body centre down to the camera lens. */
export const SAT_LENS = 21;

/**
 * A 3U CubeSat, 1 pixel = 1 cm: body 10 x 34 with a frame and three units, two deployed solar wings
 * on hinges, two whip antennas on top, the camera at the bottom looking at Earth. No outline yet
 * (it is added after rotating).
 */
export function cubeSatBitmap(): Bitmap {
  const b = bitmap(SAT_SIZE, SAT_SIZE);
  const x0 = SAT_SIZE / 2 - SAT_BODY.w / 2; // 27
  const y0 = SAT_SIZE / 2 - SAT_BODY.h / 2; // 15
  // Solar wings: frame, cells, cell grid every 4 pixels, one lit cell.
  const wingW = 14, wingH = 30, wy = y0 + 2;
  for (const side of [-1, 1]) {
    const wx = side < 0 ? x0 - 2 - wingW : x0 + SAT_BODY.w + 2;
    rect(b, side < 0 ? x0 - 2 : x0 + SAT_BODY.w, y0 + 16, 2, 2, SAT.panelEdge);
    rect(b, wx, wy, wingW, wingH, SAT.panelEdge);
    rect(b, wx + 1, wy + 1, wingW - 2, wingH - 2, SAT.cell);
    for (let gx = wx + 4; gx < wx + wingW - 1; gx += 4) rect(b, gx, wy + 1, 1, wingH - 2, SAT.cellLine);
    for (let gy = wy + 4; gy < wy + wingH - 1; gy += 4) rect(b, wx + 1, gy, wingW - 2, 1, SAT.cellLine);
    rect(b, wx + (side < 0 ? 5 : 1), wy + 5, 3, 3, SAT.glint);
    rect(b, wx + (side < 0 ? 9 : 5), wy + 17, 3, 3, SAT.glint);
  }
  // Body: frame, dark faces, a divider between units.
  rect(b, x0, y0, SAT_BODY.w, SAT_BODY.h, SAT.frame);
  rect(b, x0 + 1, y0 + 1, SAT_BODY.w - 2, SAT_BODY.h - 2, SAT.face);
  rect(b, x0 + 1, y0 + 11, SAT_BODY.w - 2, 1, SAT.frameDark);
  rect(b, x0 + 1, y0 + 22, SAT_BODY.w - 2, 1, SAT.frameDark);
  // Top unit: status light. Middle unit: a body-mounted cell. Bottom unit: the payload bay.
  rect(b, x0 + 4, y0 + 3, 2, 2, SAT.led);
  rect(b, x0 + 2, y0 + 7, 6, 1, SAT.frameDark);
  rect(b, x0 + 2, y0 + 14, 6, 6, SAT.cell);
  rect(b, x0 + 5, y0 + 14, 1, 6, SAT.cellLine);
  rect(b, x0 + 2, y0 + 25, 6, 1, SAT.frameDark);
  rect(b, x0 + 3, y0 + 28, 4, 3, SAT.frameDark);
  // Whip antennas on top.
  rect(b, x0 + 1, y0 - 8, 1, 8, SAT.antenna);
  rect(b, x0 + SAT_BODY.w - 2, y0 - 8, 1, 8, SAT.antenna);
  // Camera at the bottom: housing, lens, lit ring.
  const by = y0 + SAT_BODY.h;
  rect(b, x0 + 2, by, 6, 3, SAT.frameDark);
  rect(b, x0 + 3, by + 1, 4, 2, SAT.lens);
  rect(b, x0 + 4, by + 3, 2, 1, SAT.ring);
  return b;
}

/** Tilt of one rotation frame of the CubeSat, degrees. Frames go from -SAT_TILTS to +SAT_TILTS. */
export const SAT_STEP = 12;
export const SAT_TILTS = 3;

/** The CubeSat at every tilt, outlined. Index `tilt + SAT_TILTS`. */
export function cubeSatFrames(): Bitmap[] {
  const base = cubeSatBitmap();
  const frames: Bitmap[] = [];
  for (let k = -SAT_TILTS; k <= SAT_TILTS; k++) frames.push(outline(rotate(base, k * SAT_STEP), SAT.outline));
  return frames;
}

/* ---------- Ground station, marks and effects ---------- */

export const FX_COLOURS = [
  "", "#0b1220", "#e6e9ee", "#8fa3b8", "#4b5a6b", "#62d394", "#ff6464", "#7a2a30", "#f3c04f", "#fff3c4", "#f08a2c", "#86dcf2", "#5d6b80",
];
const L = { o: 1, w: 2, g: 3, d: 4, G: 5, r: 6, R: 7, y: 8, Y: 9, O: 10, c: 11, s: 12 };

/** Ground station: a dish looking up, on a mast and a base. The feed tip is the top centre. */
export const DISH_ROWS = [
  ".....G.....",
  ".....w.....",
  "w....w....w",
  "ww...w...ww",
  ".ww..w..ww.",
  "..wwwwwww..",
  "...ggggg...",
  "....ggg....",
  "....d.d....",
  "...d...d...",
  "..ddddddd..",
];
/** The same station out of service: the feed has snapped and hangs, the dish is dark. */
export const DISH_DOWN_ROWS = [
  "...........",
  "...........",
  "R.........R",
  "RR....rr.RR",
  ".RR..r..RR.",
  "..RRRrRRR..",
  "...ddddd...",
  "....ddd....",
  "....d.d....",
  "...d...d...",
  "..ddddddd..",
];
/** A cross, the mark of a cut link. */
export const CROSS_ROWS = [
  "rr.....rr",
  "rrr...rrr",
  ".rrr.rrr.",
  "..rrrrr..",
  "...rrr...",
  "..rrrrr..",
  ".rrr.rrr.",
  "rrr...rrr",
  "rr.....rr",
];
/** Smoke rising from the broken station, three frames. */
export const SMOKE_ROWS = [
  [".......", ".......", ".......", ".......", "..gg...", ".gggg..", "..ggg..", "...g..."],
  [".......", "...gg..", "..gggg.", "...gg..", ".......", "..gg...", "..g....", "......."],
  ["..g.g..", ".g.g.g.", "..g.g..", ".......", "...gg..", "...g...", ".......", "......."],
];
/** A lightning bolt: charged particles hitting the CubeSat during a solar storm. Two frames. */
export const BOLT_ROWS = [
  ["...YY", "..Yy.", ".Yy..", "YyyY.", "..Yy.", ".Yy..", "Yy...", "y...."],
  ["YY...", ".yY..", "..yY.", ".YyyY", ".yY..", "..yY.", "...yY", "....y"],
];

export const fxBitmap = (rows: readonly string[]) => outline(fromRows(rows, L), L.o);

/** The Sun: a disc with rays. `storm` frames are larger, with long uneven flares. */
export function sunBitmap(frame: number, storm: boolean): Bitmap {
  const size = 41, c = 20;
  const b = bitmap(size, size);
  const r = storm ? 7 : 6;
  const rays = storm ? 16 : 8;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const odd = (i + frame) % 2 === 0;
    const from = r + 2;
    const len = storm ? (odd ? 9 : 4) + ((i * 7 + frame * 3) % 4) : odd ? 4 : 2;
    for (let k = from; k < from + len; k++) setPx(b, Math.round(c + Math.cos(a) * k), Math.round(c + Math.sin(a) * k), k > from + 4 ? L.O : L.y);
  }
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d2 = x * x + y * y;
      if (d2 <= r * r + 2) setPx(b, c + x, c + y, d2 <= (r - 3) * (r - 3) ? L.Y : d2 <= (r - 1) * (r - 1) ? L.y : L.O);
    }
  }
  return b;
}
