/**
 * The crew: four looks (people in surface suits), each in every pose the game needs, in three art directions.
 * The looks differ in build, helmet shape, suit trim and one personal detail, so they are told apart in one colour.
 * Every sprite is built at load time from the shapes below into rows of characters; see `raster.ts`.
 */
import type { Sprite } from "./paint";
import { Grid, render, type Style, type Version } from "./raster";

export const CHAR_W = 16;
export const CHAR_H = 24;
export const PORTRAIT = 32;

export type LookId = "round" | "broad" | "tall" | "compact";
export const LOOKS: readonly LookId[] = ["round", "broad", "tall", "compact"];

/** Where the body is in a pose, so gear can be fitted to any look. */
export interface Frame {
  /** Torso left column and width (depth in side views). */
  tl: number;
  tw: number;
  /** Rows of the top of the torso and of the belt, after the pose's lowering. */
  top: number;
  belt: number;
  /** Top-left of each glove (left and right on screen). */
  handL: [number, number];
  handR: [number, number];
  view: "down" | "up" | "side";
  mirrored: boolean;
}

type View = "down" | "up" | "side";

interface Look {
  id: LookId;
  label: string;
  torso: number;
  legW: number;
  /** Side-view torso depth. */
  depth: number;
  helmet: Record<View, string[]>;
  helmetTop: number;
  trim(g: Grid, view: View, f: Frame): void;
  detail(g: Grid, view: View, f: Frame, legTop: number): void;
}

/* Semantic characters: h/H helmet and its shade, w highlight, v/V visor and glint, s/S suit and shade,
   t/T trim and its shade, g/G gloves and boots, p/P life-support pack, d personal detail, k face, m mark, o line. */

const ROUND: Look = {
  id: "round",
  label: "Round: bubble helmet with a headlamp, average build, chest band",
  torso: 8, legW: 3, depth: 6, helmetTop: 2,
  helmet: {
    down: ["..hhddhh..", ".hwhhhhhH.", "hwhhhhhhhH", "hvvvvvvvvH", "hvVvvvvvvH", "hHvvvvvvHH", ".HHHHHHHH."],
    up: ["..hhhhhh..", ".hwhhhhhH.", "hwhhhhhhhH", "hhhhhhhhhH", "hhhhhhhhHH", "HhhhhhhhHH", ".HHHHHHHH."],
    side: [".ddhhhh..", ".hwhhhhhH", "hwhhhhhhH", "vvvvhhhhH", "vVvvhhhhH", "vvvHhhhHH", ".HHHHHHH."],
  },
  trim(g, view, f) {
    if (view === "side") g.rect(f.tl, f.top + 2, f.tw, 1, "t");
    else g.rect(f.tl, f.top + 2, f.tw, 1, "t").set(f.tl + f.tw - 1, f.top + 2, "T");
  },
  detail() {},
};

const BROAD: Look = {
  id: "broad",
  label: "Broad: boxy helmet, wide build, shoulder yokes, round mission patch",
  torso: 10, legW: 3, depth: 7, helmetTop: 2,
  helmet: {
    down: ["hhhhhhhhhH", "hwwhhhhhhH", "hvvvvvvvvH", "hvVVvvvvvH", "hvvvvvvvvH", "hHHHHHHHHH", ".HHHHHHHH."],
    up: ["hhhhhhhhhH", "hwwhhhhhhH", "hhhhhhhhhH", "hhhhhhhhhH", "hhhhhhhhHH", "hHHHHHHHHH", ".HHHHHHHH."],
    side: ["hhhhhhhhH", "hwwhhhhhH", "vvvvhhhhH", "VVvvhhhhH", "vvvvhhhhH", "HHHHHHHHH", ".HHHHHHH."],
  },
  trim(g, view, f) {
    if (view === "side") g.rect(f.tl, f.top, f.tw, 1, "t");
    else {
      g.rect(f.tl - 2, f.top + 1, 4, 1, "t").rect(f.tl + f.tw - 2, f.top + 1, 4, 1, "T");
      g.rect(f.tl, f.top, 3, 1, "t").rect(f.tl + f.tw - 3, f.top, 3, 1, "T");
    }
  },
  detail(g, view, f) {
    if (view === "down") g.rect(f.tl + 2, f.top + 3, 2, 2, "d");
  },
};

const TALL: Look = {
  id: "tall",
  label: "Tall: tall helmet with a crest, slim build, centre stripe, knee pads",
  torso: 6, legW: 2, depth: 5, helmetTop: 1,
  helmet: {
    down: ["...tt...", "..htth..", ".hwtthH.", "hwhtthhH", "hvvvvvvH", "hVvvvvvH", "hvvvvvvH", ".HHHHHH."],
    up: ["...tt...", "..htth..", ".hwtthH.", "hwhtthhH", "hhhtthhH", "hhhtthhH", "hhhhhhHH", ".HHHHHH."],
    side: ["..ttt...", ".hhhttt.", "hwhhhhtH", "vvvhhhhH", "vVvhhhhH", "vvvhhhhH", "vvHhhhHH", ".HHHHHH."],
  },
  trim(g, view, f) {
    if (view === "side") g.rect(f.tl + f.tw - 1, f.top, 1, 7, "t");
    else if (view === "down") g.rect(f.tl + 2, f.top, 2, 7, "t").rect(f.tl + 3, f.top, 1, 7, "T");
  },
  detail(g, view, f, legTop) {
    if (view === "down" && legTop < 20) g.rect(f.tl - 1, legTop + 2, 2, 2, "d").rect(f.tl + 4, legTop + 2, 2, 2, "d");
    if (view === "side" && legTop < 20) g.rect(f.tl, legTop + 2, 2, 2, "d");
  },
};

const COMPACT: Look = {
  id: "compact",
  label: "Compact: low wide dome with ear lights, short build, chevron",
  torso: 8, legW: 3, depth: 6, helmetTop: 3,
  helmet: {
    down: ["...hhhhhh...", "..hwhhhhhH..", ".hwhhhhhhhH.", "dhvvvvvvvvHd", "dhvVvvvvvvHd", ".HHHHHHHHHH."],
    up: ["...hhhhhh...", "..hwhhhhhH..", ".hwhhhhhhhH.", "dhhhhhhhhhHd", "dhhhhhhhhHHd", ".HHHHHHHHHH."],
    side: ["..hhhhhh..", ".hwhhhhhH.", "hwhhhhhhhH", "vvvvhhdhhH", "vVvvhhdhHH", ".HHHHHHHH."],
  },
  trim(g, view, f) {
    if (view === "down") {
      const c = f.tl + f.tw / 2;
      for (let i = 0; i < 3; i++) g.set(c - 3 + i, f.top + 1 + i, "t").set(c + 2 - i, f.top + 1 + i, "T");
    } else if (view === "side") for (let i = 0; i < 4; i++) g.set(f.tl + i, f.top + 1 + i, "t");
  },
  detail() {},
};

const LOOK: Record<LookId, Look> = { round: ROUND, broad: BROAD, tall: TALL, compact: COMPACT };
export const LOOK_LABEL: Record<LookId, string> = {
  round: ROUND.label, broad: BROAD.label, tall: TALL.label, compact: COMPACT.label,
};

type Legs = "stand" | "walk0" | "walk1" | "kneel" | "sit" | "bent";
type Arms = "down" | "swing0" | "swing1" | "out" | "reach" | "hold" | "helmet" | "slump" | "knees";

/** A front or back figure. `dy` lowers the upper body (kneeling, sitting). */
function figure(look: Look, view: "down" | "up", legs: Legs, arms: Arms, dy = 0): { g: Grid; f: Frame } {
  const g = new Grid(CHAR_W, CHAR_H);
  const tw = look.torso, tl = 8 - tw / 2, tr = tl + tw - 1;
  const top = 9 + dy, belt = 15 + dy;
  const lw = look.legW;
  const lx = 7 - lw, rx = 9;
  const leg = (x: number, y0: number, len: number, shadeRight: boolean) => {
    g.rect(x, y0, lw, len - 2, "s");
    if (shadeRight) g.rect(x + lw - 1, y0, 1, len - 2, "S");
    g.rect(x, y0 + len - 2, lw, 1, "g").rect(x, y0 + len - 1, lw, 1, "G");
  };
  const legTop = belt + 1;
  if (legs === "stand") { leg(lx, 16, 7, false); leg(rx, 16, 7, true); }
  else if (legs === "walk0") { leg(lx, 16, 6, false); leg(rx, 16, 7, true); }
  else if (legs === "walk1") { leg(lx, 16, 7, false); leg(rx, 16, 6, true); }
  else if (legs === "bent") { leg(lx - 1, legTop, 23 - legTop, false); leg(rx + 1, legTop, 23 - legTop, true); }
  else if (legs === "kneel") {
    // left knee on the ground, right foot planted forward
    g.rect(lx, legTop, lw, 3, "s").rect(lx, legTop + 3, lw + 1, 1, "S");
    leg(rx, legTop, 23 - legTop, true);
  } else if (legs === "sit") {
    // legs out towards the viewer, feet apart
    g.rect(lx - 1, legTop, lw, 2, "s").rect(rx + 1, legTop, lw, 2, "S");
    g.rect(lx - 1, legTop + 2, lw, 1, "g").rect(rx + 1, legTop + 2, lw, 1, "G");
  }
  // torso
  const th = Math.min(7, 23 - top);
  g.rect(tl, top, tw, th, "s").rect(tr, top, 1, th, "S").rect(tl, top + 1, 1, 4, "w");
  if (belt < 23) g.rect(tl + 1, belt, tw - 2, 1, "S");
  // arms
  const arm = (x: number, y: number, len: number, side: "L" | "R"): [number, number] => {
    g.rect(x, y, 2, len, "s");
    if (side === "R") g.rect(x + 1, y, 1, len, "S");
    g.rect(x, y + len, 2, 2, "g");
    return [x, y + len];
  };
  let handL: [number, number] = [tl - 2, top + 6];
  let handR: [number, number] = [tr + 1, top + 6];
  const ay = top + 1;
  switch (arms) {
    case "down": handL = arm(tl - 2, ay, 5, "L"); handR = arm(tr + 1, ay, 5, "R"); break;
    case "swing0": handL = arm(tl - 2, ay, 4, "L"); handR = arm(tr + 1, ay, 6, "R"); break;
    case "swing1": handL = arm(tl - 2, ay, 6, "L"); handR = arm(tr + 1, ay, 4, "R"); break;
    case "out": {
      const lx0 = Math.max(1, tl - 5), rx1 = Math.min(13, tr + 4);
      g.rect(lx0 + 2, ay, tl - lx0 - 2, 2, "s").rect(lx0, ay, 2, 2, "g");
      g.rect(tr + 1, ay, rx1 - tr - 1, 2, "S").rect(rx1, ay, 2, 2, "g");
      handL = [lx0, ay]; handR = [rx1, ay];
      break;
    }
    case "reach":
      g.rect(tl - 2, ay, 2, 3, "s").rect(tl - 1, ay + 3, 2, 3, "s").rect(tl, ay + 6, 2, 2, "g");
      g.rect(tr + 1, ay, 2, 3, "S").rect(tr, ay + 3, 2, 3, "S").rect(tr, ay + 6, 2, 2, "g");
      handL = [tl, ay + 6]; handR = [tr, ay + 6];
      break;
    case "hold":
      g.rect(tl - 2, ay, 2, 3, "s").rect(tr + 1, ay, 2, 3, "S");
      handL = [tl - 2, ay + 3]; handR = [tr + 1, ay + 3];
      break;
    case "helmet":
      handL = arm(tl - 2, ay, 5, "L");
      g.rect(tr + 1, ay - 2, 2, 3, "S");
      handR = [tr + 1, ay - 4];
      break;
    case "slump": handL = arm(tl - 1, ay + 1, 5, "L"); handR = arm(tr, ay + 1, 5, "R"); break;
    case "knees": handL = arm(tl - 2, ay, 3, "L"); handR = arm(tr + 1, ay, 3, "R"); break;
  }
  const f: Frame = { tl, tw, top, belt, handL, handR, view, mirrored: false };
  if (view === "up") {
    g.rect(tl + 1, top, tw - 2, 6, "p").rect(tr - 1, top, 1, 6, "P").rect(tl + 1, top + 5, tw - 2, 1, "P");
  }
  look.trim(g, view, f);
  look.detail(g, view, f, legTop);
  const hw = look.helmet[view === "up" ? "up" : "down"][0]!.length;
  g.stamp(look.helmet[view], 8 - hw / 2, look.helmetTop + dy);
  if (arms === "hold") {
    // a supply crate held against the chest
    g.rect(tl - 1, top + 2, tw + 2, 5, "p").rect(tl - 1, top + 6, tw + 2, 1, "P").rect(tr + 1, top + 2, 1, 5, "P");
    g.rect(tl - 1, top + 4, tw + 2, 1, "P");
    g.rect(tl - 2, top + 3, 1, 2, "g").rect(tr + 2, top + 3, 1, 2, "g");
  }
  if (arms === "helmet") g.rect(tr + 1, ay - 4, 2, 2, "g");
  return { g, f };
}

/** A side figure facing left; step 0 stands, 1 and 2 are the two strides. */
function side(look: Look, step: 0 | 1 | 2): { g: Grid; f: Frame } {
  const g = new Grid(CHAR_W, CHAR_H);
  const d = look.depth;
  const x0 = 5, top = 9, belt = 15;
  const leg = (x: number, shade: boolean, len = 7) => {
    g.rect(x, 16, 3, len - 2, shade ? "S" : "s");
    g.rect(x - 1, 16 + len - 2, 4, 1, "g").rect(x - 1, 16 + len - 1, 4, 1, "G");
  };
  // pack on the back (right side when facing left)
  g.rect(x0 + d - 1, top, 3, 6, "p").rect(x0 + d + 1, top, 1, 6, "P").rect(x0 + d - 1, top + 5, 3, 1, "P");
  if (step === 0) { leg(7, true); leg(6, false); }
  else if (step === 1) { leg(9, true, 6); leg(5, false); }
  else { leg(5, true, 6); leg(9, false); }
  g.rect(x0, top, d, 7, "s").rect(x0, top + 1, 1, 4, "w").rect(x0 + 1, belt, d - 2, 1, "S");
  const f: Frame = { tl: x0, tw: d, top, belt, handL: [6, top + 6], handR: [6, top + 6], view: "side", mirrored: false };
  look.trim(g, "side", f);
  look.detail(g, "side", f, belt + 1);
  // the near arm swings against the legs
  const ax = step === 1 ? 8 : step === 2 ? 6 : 7;
  g.rect(ax, top + 1, 2, 5, "S").rect(ax, top + 1, 1, 5, "s").rect(ax, top + 6, 2, 2, "g");
  f.handL = [ax, top + 6];
  f.handR = f.handL;
  g.stamp(look.helmet.side, look.id === "compact" ? 3 : 4, look.helmetTop);
  return { g, f };
}

/** The collapsed figure: lying on its back across the bottom of the cell, helmet to the left. */
function lying(look: Look): Grid {
  const g = new Grid(CHAR_W, CHAR_H);
  g.rect(11, 15, 3, 2, "s").rect(11, 18, 3, 2, "S").rect(14, 15, 1, 2, "g").rect(14, 18, 1, 2, "g");
  g.rect(5, 14, 6, 7, "s").rect(5, 20, 6, 1, "S").rect(6, 14, 4, 1, "w");
  g.rect(7, 11, 2, 3, "s").rect(9, 10, 2, 2, "g"); // an arm flung up
  g.rect(6, 21, 3, 1, "S").rect(9, 21, 2, 1, "g");
  look.trim(g, "side", { tl: 5, tw: 6, top: 14, belt: 20, handL: [0, 0], handR: [0, 0], view: "side", mirrored: false });
  // the helmet on its side: the side view turned a quarter, visor up
  const h = look.helmet.side;
  const rot: string[] = [];
  for (let x = 0; x < h[0]!.length; x++) {
    let r = "";
    for (let y = h.length - 1; y >= 0; y--) r += h[y]![x] ?? ".";
    rot.push(r);
  }
  g.stamp(rot.slice(0, 9), 0, 13);
  return g;
}

/** The "cut off" mark beside the helmet: a cross, readable in one colour. */
function cutMark(g: Grid): void {
  g.stamp(["m.m", ".m.", "m.m"], 1, 1);
}

/** Hurt or exhausted: the head bowed (the top of the helmet hides the visor) and two drops of sweat. */
function bowHead(g: Grid, look: Look, dy: number): void {
  const y0 = look.helmetTop + dy;
  for (let y = y0; y < y0 + look.helmet.down.length; y++) {
    const row = g.c[y]!;
    if (row.some((c) => c === "v" || c === "V")) {
      for (let x = 0; x < g.w; x++) if (row[x] === "v" || row[x] === "V") row[x] = "h";
      break;
    }
  }
  g.stamp(["m..", "m.m", "..m"], 12, y0 - 3 < 0 ? 0 : y0 - 3);
}

export type PoseKey =
  | "stand_down" | "stand_up" | "stand_left" | "stand_right"
  | "walk_down" | "walk_up" | "walk_left" | "walk_right"
  | "work" | "carry" | "rest" | "cutoff" | "hurt" | "out";
export const POSES: readonly PoseKey[] = [
  "stand_down", "stand_up", "stand_left", "stand_right", "walk_down", "walk_up", "walk_left", "walk_right",
  "work", "carry", "rest", "cutoff", "hurt", "out",
];

/** Semantic frames of one look, with the body anchors of each frame (for gear). */
export function poseGrids(id: LookId): Record<PoseKey, { frames: string[][]; anchors: Frame[] }> {
  const L = LOOK[id];
  type R = { g: Grid; f: Frame };
  const pack = (...rs: R[]) => ({ frames: rs.map((r) => r.g.rows()), anchors: rs.map((r) => r.f) });
  const mirrorF = (r: R): R => ({
    g: r.g.mirror(),
    f: { ...r.f, mirrored: true, handL: [CHAR_W - 2 - r.f.handL[0], r.f.handL[1]], handR: [CHAR_W - 2 - r.f.handR[0], r.f.handR[1]] },
  });
  const cut = figure(L, "down", "bent", "helmet", 2);
  cutMark(cut.g);
  const hurt = figure(L, "down", "bent", "slump", 3);
  bowHead(hurt.g, L, 3);
  const down = figure(L, "down", "stand", "down");
  const rest = figure(L, "down", "sit", "knees", 5);
  rest.g.stamp(["mmmm", "..m.", ".m..", "mmmm"], 11, 1); // a "Z": asleep, told apart from the cross and the drops by shape
  return {
    stand_down: pack(down),
    stand_up: pack(figure(L, "up", "stand", "down")),
    stand_left: pack(side(L, 0)),
    stand_right: pack(mirrorF(side(L, 0))),
    walk_down: pack(figure(L, "down", "walk0", "swing0"), figure(L, "down", "walk1", "swing1")),
    walk_up: pack(figure(L, "up", "walk0", "swing1"), figure(L, "up", "walk1", "swing0")),
    walk_left: pack(side(L, 1), side(L, 2)),
    walk_right: pack(mirrorF(side(L, 1)), mirrorF(side(L, 2))),
    work: pack(figure(L, "down", "kneel", "out", 3), figure(L, "down", "kneel", "reach", 3)),
    carry: pack(figure(L, "down", "stand", "hold")),
    rest: pack(rest),
    cutoff: pack(cut),
    hurt: pack(hurt),
    out: { frames: [lying(L).rows()], anchors: [down.f] },
  };
}

/** The portrait for the player's panel: the helmet at twice the size, with a face behind the visor. */
function portraitGrid(id: LookId): string[] {
  const L = LOOK[id];
  const g = new Grid(PORTRAIT, PORTRAIT);
  g.rect(3, 24, 26, 8, "s").rect(2, 26, 1, 6, "s").rect(29, 26, 1, 6, "S").rect(25, 24, 4, 8, "S");
  g.rect(4, 25, 2, 6, "w").rect(8, 23, 16, 2, "S");
  if (id === "round") g.rect(3, 28, 26, 2, "t").rect(25, 28, 4, 2, "T");
  if (id === "broad") g.rect(2, 25, 8, 2, "t").rect(22, 25, 8, 2, "T").rect(12, 27, 4, 4, "d");
  if (id === "tall") g.rect(14, 24, 4, 8, "t").rect(16, 24, 2, 8, "T");
  if (id === "compact") for (let i = 0; i < 6; i++) g.rect(9 + i, 25 + i, 1, 1, "t").rect(22 - i, 25 + i, 1, 1, "T");
  const h = L.helmet.down;
  const hw = h[0]!.length * 2;
  const x0 = 16 - hw / 2, y0 = 24 - h.length * 2 + 1;
  h.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) if (row[i] !== ".") g.rect(x0 + i * 2, y0 + j * 2, 2, 2, row[i]!);
  });
  // a face in the visor
  let minX = 99, maxX = -1, minY = 99, maxY = -1;
  for (let y = 0; y < PORTRAIT; y++) for (let x = 0; x < PORTRAIT; x++) {
    const c = g.get(x, y);
    if (c === "v" || c === "V") { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  }
  const cx = Math.round((minX + maxX + 1) / 2);
  const fw = Math.min(8, maxX - minX - 5);
  g.rect(cx - fw / 2, minY + 1, fw, maxY - minY, "k");
  g.rect(cx - 2, minY + 2, 1, 1, "o").rect(cx + 1, minY + 2, 1, 1, "o");
  g.rect(minX + 1, minY, 2, 1, "V");
  return g.rows();
}

/* ---------- palettes ---------- */

/** Suit colours shared by all looks, per version; each look adds its trim and detail. */
export const SUIT_A = { outline: "#1c1426", suit: "#ece6da", shade: "#7c86a2" } as const;
export const SUIT_B = {
  outline: "#1a1222", litOutline: "#4b3551", suit: "#e9e4da", shade: "#a3abbf", light: "#ffffff",
  visor: "#1d2c4c", glint: "#86dcf2", glove: "#5b6074", gloveShade: "#373a4c",
} as const;
export const SUIT_C = { suit: "#efe9de", shade: "#b0b6c6", visor: "#213455" } as const;
/** Trim colour of each look (A and C); trim, trim shade, detail and skin (B). */
export const TRIM: Record<LookId, { a: string; b: [string, string, string, string]; c: string }> = {
  round: { a: "#3fa7e6", b: ["#4cb4ee", "#2a6fae", "#ffd45e", "#e3a983"], c: "#47aee8" },
  broad: { a: "#ef8d25", b: ["#f39a33", "#b3591d", "#c94b4b", "#8d5a3b"], c: "#f0912b" },
  tall: { a: "#55c46b", b: ["#66d27a", "#2f8a4a", "#f3c04f", "#c98b62"], c: "#5bc870" },
  compact: { a: "#b866e0", b: ["#c47ae8", "#7d3fa4", "#ff7d6b", "#5e3b2a"], c: "#bb6de2" },
};
/** Marks over the head ("cut off", "hurt") are light, so they read on the dark UI and on the ground; told apart by shape. */
const MARK = { a: SUIT_A.suit, b: SUIT_B.light, c: SUIT_C.suit };

export function charStyle(v: Version, id: LookId): Style {
  const t = TRIM[id];
  if (v === "A") {
    const { outline: o, suit: s, shade: S } = SUIT_A;
    return { outline: "full", palette: { o, s, h: s, w: s, V: s, k: s, S, H: S, g: S, G: S, P: S, p: s, v: o, t: t.a, T: t.a, d: t.a, m: MARK.a } };
  }
  if (v === "B") {
    const c = SUIT_B;
    return {
      outline: "selective",
      palette: {
        o: c.outline, O: c.litOutline, s: c.suit, h: c.suit, p: c.suit, S: c.shade, H: c.shade, P: c.shade, w: c.light,
        v: c.visor, V: c.glint, g: c.glove, G: c.gloveShade, t: t.b[0], T: t.b[1], d: t.b[2], k: t.b[3], m: MARK.b,
      },
    };
  }
  const { suit: s, shade: S, visor: v2 } = SUIT_C;
  return {
    outline: "none",
    palette: { o: v2, s, h: s, w: s, p: s, V: s, k: S, S, H: S, P: S, g: v2, G: v2, v: v2, t: t.c, T: t.c, d: t.c, m: MARK.c },
  };
}

/* ---------- export ---------- */

export interface LookSprites {
  /** Every pose as a list of frames (one frame when it does not move). */
  poses: Record<PoseKey, Sprite[]>;
  portrait: Sprite;
}

function buildVersion(v: Version): Record<LookId, LookSprites> {
  const out = {} as Record<LookId, LookSprites>;
  for (const id of LOOKS) {
    const style = charStyle(v, id);
    const grids = poseGrids(id);
    const poses = {} as Record<PoseKey, Sprite[]>;
    for (const p of POSES) poses[p] = grids[p].frames.map((rows) => render(rows, style));
    // only the colours a sprite paints count: B's portrait shows no gloves, so the face fits in the 12
    out[id] = { poses, portrait: render(portraitGrid(id), style) };
  }
  return out;
}

export const A = buildVersion("A");
export const B = buildVersion("B");
export const C = buildVersion("C");
