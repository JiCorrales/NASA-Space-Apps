/**
 * Role gear: overlays drawn over any of the four looks (the role is chosen apart from the look), and a
 * 12 x 12 badge per role. Overlays are fitted to each look's body from the same anchors the characters
 * are built with, for the standing and walking poses in the four directions.
 *
 * Semantic characters: q/Q gear and its shade, e role colour, E light metal.
 */
import { LOOKS, poseGrids, CHAR_W, CHAR_H, type Frame, type LookId, type PoseKey } from "./characters";
import { iconSprite } from "./icons";
import type { Sprite } from "./paint";
import { Grid, render, type Style, type Version } from "./raster";

export type RoleId = "commander" | "engineer" | "scientist" | "comms";
export const ROLES: readonly RoleId[] = ["commander", "engineer", "scientist", "comms"];
export const ROLE_LABEL: Record<RoleId, string> = {
  commander: "Commander: command pack and arm band",
  engineer: "Engineer: tool belt and wrench",
  scientist: "Scientist: sample case and pick",
  comms: "Communications officer: backpack antenna and handset",
};
/** Poses the overlays exist for (frames match the character's frames). Not "out": a collapsed body drops its gear. */
export const GEAR_POSES = [
  "stand_down", "stand_up", "stand_left", "stand_right", "walk_down", "walk_up", "walk_left", "walk_right",
  "work", "carry", "rest", "cutoff", "hurt",
] as const satisfies readonly PoseKey[];
export type GearPose = (typeof GEAR_POSES)[number];

type Draw = (g: Grid, f: Frame) => void;
const hand = (f: Frame, side: "L" | "R") => (side === "L" ? f.handL : f.handR);

function wrench(g: Grid, [hx, hy]: [number, number]) {
  g.rect(hx + 1, hy + 2, 1, 2, "e").rect(hx, hy + 4, 3, 1, "E").set(hx, hy + 5, "E").set(hx + 2, hy + 5, "E");
}
function sampleCase(g: Grid, [hx, hy]: [number, number]) {
  g.rect(hx - 1, hy + 1, 4, 3, "q").rect(hx - 1, hy + 2, 4, 1, "e").rect(hx + 2, hy + 1, 1, 3, "Q");
}
function pick(g: Grid, [hx, hy]: [number, number]) {
  g.rect(hx + 1, hy - 3, 1, 6, "Q").rect(hx - 1, hy - 4, 4, 1, "E").set(hx - 1, hy - 3, "E").set(hx + 2, hy - 4, "e");
}
function handset(g: Grid, [hx, hy]: [number, number]) {
  g.rect(hx, hy - 1, 2, 3, "q").set(hx, hy - 1, "e").rect(hx + 1, hy - 3, 1, 2, "E");
}
function mast(g: Grid, x: number, bottom: number) {
  g.rect(x, 2, 1, bottom - 2, "E").rect(x - 1, 1, 3, 1, "e").set(x, 0, "e");
}

const DRAW: Record<RoleId, Record<Frame["view"], Draw>> = {
  commander: {
    down(g, f) {
      const r = f.tl + f.tw - 1;
      g.rect(f.tl - 2, f.top + 2, 2, 2, "e");
      g.rect(f.tl + 1, f.top, 1, 6, "q").rect(r - 1, f.top, 1, 6, "Q").set(f.tl + 1, f.top + 2, "E");
    },
    up(g, f) {
      const r = f.tl + f.tw - 1;
      g.rect(f.tl, f.top - 1, f.tw, 7, "q").rect(r, f.top - 1, 1, 7, "Q").rect(f.tl, f.top + 5, f.tw, 1, "Q");
      g.set(f.tl + f.tw / 2 - 1, f.top + 1, "E").set(f.tl + f.tw / 2, f.top + 1, "E");
      g.rect(f.tl + 1, f.top + 3, f.tw - 2, 1, "e");
      g.rect(r + 1, f.top + 2, 2, 2, "e");
    },
    side(g, f) {
      const x = f.tl + f.tw - 1;
      g.rect(x, f.top - 1, 4, 7, "q").rect(x + 3, f.top - 1, 1, 7, "Q").rect(x + 1, f.top + 2, 2, 1, "e").set(x + 1, f.top, "E");
      g.rect(f.handL[0], f.top + 2, 2, 2, "e");
    },
  },
  engineer: {
    down(g, f) {
      g.rect(f.tl - 1, f.belt, f.tw + 2, 1, "q").rect(f.tl + f.tw / 2 - 1, f.belt, 2, 1, "E");
      g.rect(f.tl - 1, f.belt + 1, 2, 2, "Q").rect(f.tl + f.tw - 1, f.belt + 1, 2, 2, "Q");
      wrench(g, hand(f, "R"));
    },
    up(g, f) {
      g.rect(f.tl - 1, f.belt, f.tw + 2, 1, "q").rect(f.tl - 1, f.belt + 1, 2, 2, "Q").rect(f.tl + f.tw - 1, f.belt + 1, 2, 2, "Q");
      g.set(f.tl + 2, f.belt, "e");
      wrench(g, hand(f, "L"));
    },
    side(g, f) {
      g.rect(f.tl, f.belt, f.tw + 1, 1, "q").rect(f.tl + f.tw - 2, f.belt + 1, 3, 2, "Q").set(f.tl + 1, f.belt, "E");
      wrench(g, hand(f, "L"));
    },
  },
  scientist: {
    down(g, f) {
      sampleCase(g, hand(f, "L"));
      pick(g, hand(f, "R"));
    },
    up(g, f) {
      sampleCase(g, hand(f, "R"));
      pick(g, hand(f, "L"));
    },
    side(g, f) {
      const x = f.tl + f.tw;
      for (let i = 0; i < 6; i++) g.set(x - 1 + i % 2, f.top - 1 + i, "Q");
      g.rect(x - 2, f.top - 2, 3, 1, "E");
      sampleCase(g, hand(f, "L"));
    },
  },
  comms: {
    down(g, f) {
      mast(g, Math.min(CHAR_W - 2, f.tl + f.tw + 1), f.top + 1);
      handset(g, hand(f, "L"));
    },
    up(g, f) {
      mast(g, Math.max(1, f.tl - 2), f.top + 1);
      g.rect(f.tl + 1, f.top + 1, f.tw - 2, 1, "e");
      handset(g, hand(f, "R"));
    },
    side(g, f) {
      mast(g, f.tl + f.tw + 1, f.top + 1);
      handset(g, hand(f, "L"));
    },
  },
};

/** The role colour, its shade, and the gear colours of each version. */
export const ROLE_COLOUR: Record<RoleId, string> = {
  commander: "#e2524f",
  engineer: "#f2b233",
  scientist: "#3fc79c",
  comms: "#5fd0f0",
};
export const GEAR_A = { outline: "#1c1426", gear: "#8c7650", metal: "#d6dae6" } as const;
export const GEAR_B = { outline: "#1a1222", litOutline: "#4b3551", gear: "#a08a5e", gearShade: "#6e5c3c", metal: "#dfe3ee" } as const;
export const GEAR_C = { gear: "#8f7a54", metal: "#e4e8f2" } as const;

export function gearStyle(v: Version, role: RoleId): Style {
  const e = ROLE_COLOUR[role];
  if (v === "A") return { outline: "full", palette: { o: GEAR_A.outline, q: GEAR_A.gear, Q: GEAR_A.gear, e, E: GEAR_A.metal } };
  if (v === "B")
    return { outline: "selective", palette: { o: GEAR_B.outline, O: GEAR_B.litOutline, q: GEAR_B.gear, Q: GEAR_B.gearShade, e, E: GEAR_B.metal } };
  return { outline: "none", palette: { q: GEAR_C.gear, Q: GEAR_C.gear, e, E: GEAR_C.metal } };
}

/** Gear overlay grids of one role on one look (semantic rows, one per frame). */
export function gearGrids(role: RoleId, look: LookId): Record<GearPose, string[][]> {
  const poses = poseGrids(look);
  const out = {} as Record<GearPose, string[][]>;
  for (const p of GEAR_POSES) {
    const mirrored = p.endsWith("_right");
    const src = mirrored ? (p.replace("_right", "_left") as GearPose) : p;
    out[p] = poses[src].anchors.map((f) => {
      const g = new Grid(CHAR_W, CHAR_H);
      DRAW[role][f.view](g, f);
      return (mirrored ? g.mirror() : g).rows();
    });
  }
  return out;
}

/* ---------- badges (12 x 12) ---------- */

const BADGE: Record<RoleId, { rows: string[]; a: "red" | "yellow" | "white"; b: "white" | "green" | "cyan" }> = {
  commander: {
    a: "red", b: "white",
    rows: ["....aa....", "....aa....", "...aaaa...", "aaaaccaaaa", ".aaaccaaa.", "..aaaaaa..", "..aaaaaa..", ".aaa..aaa.", ".aa....aa.", "a........a"],
  },
  engineer: {
    a: "yellow", b: "white",
    rows: ["....aa....", ".a.aaaa.a.", "..aaaaaa..", ".aaaxxaaa.", "aaaxxxxaaa", "aaaxxxxaaa", ".aaaxxaaa.", "..aaaaaa..", ".a.aaaa.a.", "....aa...."],
  },
  scientist: {
    a: "white", b: "green",
    rows: ["...aaaa...", "....aa....", "....aa....", "....aa....", "...aaaa...", "..abbbba..", ".abbcbbba.", "abbbbbbbba", "abbbbbbbba", "aaaaaaaaaa"],
  },
  comms: {
    a: "white", b: "cyan",
    rows: ["b........b", ".b..aa..b.", "b..acca..b", ".b..aa..b.", "....aa....", "...a..a...", "...aaaa...", "..a....a..", "..aaaaaa..", ".a......a."],
  },
};

export interface RoleSprites {
  badge: Sprite;
  /** overlays[look][pose] is a list of frames, matching the character's frames. */
  overlays: Record<LookId, Record<GearPose, Sprite[]>>;
}

function build(v: Version): Record<RoleId, RoleSprites> {
  const out = {} as Record<RoleId, RoleSprites>;
  for (const role of ROLES) {
    const style = gearStyle(v, role);
    const overlays = {} as Record<LookId, Record<GearPose, Sprite[]>>;
    for (const look of LOOKS) {
      const grids = gearGrids(role, look);
      overlays[look] = {} as Record<GearPose, Sprite[]>;
      for (const p of GEAR_POSES) overlays[look][p] = grids[p].map((rows) => render(rows, style));
    }
    const b = BADGE[role];
    out[role] = { badge: iconSprite(b.rows, v, b.a, b.b), overlays };
  }
  return out;
}

export const A = build("A");
export const B = build("B");
export const C = build("C");
