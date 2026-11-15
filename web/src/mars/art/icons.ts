/**
 * Interface icons, 12 x 12, readable at 1x: health gauges, resources, link states, activities, task states,
 * hazards and the sol counter. Each symbol is drawn once in a 10 x 10 semantic grid and told apart by its form;
 * the versions differ in outline and palette. C sets every symbol on a flat plate, since it has no outline.
 *
 * Semantic characters: a/A main colour and its shade, b/B second colour and its shade, c light, x dark.
 */
import type { Sprite } from "./paint";
import { Grid, render, type Version } from "./raster";

export const ICON = 12;

/** Colour pairs (light, shade) the icons pick from. Bright enough to read on the dark UI and on Mars ground. */
export const ICON_HUES = {
  yellow: ["#f3c04f", "#b8862a"],
  red: ["#ff6464", "#b33c3c"],
  green: ["#62d394", "#2f9a62"],
  cyan: ["#86dcf2", "#3f93b8"],
  white: ["#e4ecf5", "#8394ab"],
  rust: ["#e0814f", "#9a4a2a"],
  violet: ["#c38cf0", "#8456b0"],
  blue: ["#5c9ded", "#2f5fa8"],
  grey: ["#a3abbf", "#5b6074"],
} as const;
type Hue = keyof typeof ICON_HUES;

export const ICON_A = { outline: "#05070f", light: "#ffffff" } as const;
export const ICON_B = { outline: "#05070f", litOutline: "#2b3852", light: "#ffffff", dark: "#05070f" } as const;
export const ICON_C = { plate: "#2b3852", light: "#ffffff", dark: "#05070f" } as const;

interface Def {
  rows: string[];
  a: Hue;
  b: Hue;
}

const d = (a: Hue, b: Hue, ...rows: string[]): Def => ({ a, b, rows });

/* ---------- symbols (10 x 10) ---------- */

const DEFS = {
  // health gauges
  radiation: d("yellow", "yellow",
    ".aaa..aaa.", "aaaa..aaaa", "aaaa..aaaa", "aaa.xx.aaa", "....xx....",
    "..........", "...aaaa...", "..aaaaaa..", "..aaaaaa..", "...aaaa..."),
  energy: d("green", "white",
    "...cccc...", "..aaaaaa..", "..axxxxa..", "..axxxxa..", "..abbbba..",
    "..abbbba..", "..abbbba..", "..abbbba..", "..aaaaaa..", ".........."),
  air: d("cyan", "white",
    "......aa..", ".....acaa.", ".....aaaA.", "......AA..", ".aaaa.....",
    "aacaaa....", "acaaaa....", "aaaaaA..a.", "aaaaaA.aca", ".AAAA...a."),
  water: d("blue", "white",
    "....aa....", "....aa....", "...aaaa...", "...aaaa...", "..acaaaa..",
    ".acaaaaaa.", ".acaaaaaa.", ".aaaaaaaA.", "..aaaaAA..", "...AAAA..."),
  food: d("red", "green",
    ".....b....", "....b.bb..", "..aa.baa..", ".aaaaaaaa.", "aacaaaaaaa",
    "acaaaaaaaa", "aaaaaaaaaA", "aaaaaaaaaA", ".aaaaaaaA.", "..aa..AA.."),
  body: d("white", "red",
    "....aa....", "...aaaa...", "...aaaa...", "....aa....", ".aaaaaaaa.",
    "aa.abba.aa", "aa.abba.aa", "...aaaa...", "...a..a...", "..aa..aa.."),
  morale: d("yellow", "yellow",
    "..aaaaaa..", ".aaaaaaaa.", "aaxaaaaxaa", "aaxaaaaxaa", "aaaaaaaaaa",
    "axaaaaaaxa", "aaxaaaaxaa", ".aaxxxxaa.", "..aaaaaa..", ".........."),
  // resources
  mass: d("grey", "white",
    "...aaaa...", "...a..a...", "...a..a...", "..aaaaaa..", ".aaaaaaaa.",
    ".acaaaaaa.", "aacaaaaaaa", "aaaaaaaaaA", "aaaaaaaaaA", "AAAAAAAAAA"),
  power: d("yellow", "white",
    ".....aaaa.", "....acaa..", "...acaa...", "..acaaaaa.", ".aaaaaaa..",
    "....aaa...", "...aaa....", "..aaa.....", "..aa......", ".a........"),
  budget: d("yellow", "white",
    "..aaaaaa..", ".aaaxxaaa.", "aaaxxxxaaa", "aaxxaaaaaa", "aaaxxxaaaa",
    "aaaaaxxaaa", "aaaaaaxxaA", "aaaxxxxaaA", ".aaaxxaaA.", "..AAAAAA.."),
  data: d("cyan", "blue",
    "..aaaaaa..", ".acaaaaaa.", ".aaaaaaaa.", ".bbbbbbbb.", ".aaaaaaaa.",
    ".aaaaaaaa.", ".bbbbbbbb.", ".aaaaaaaa.", ".aaaaaaaa.", "..AAAAAA.."),
  communications: d("white", "cyan",
    "..a.......", "..a.....b.", "..a..b..b.", ".aaaa.b.b.", ".acca.b.b.",
    ".aaaa..b..", ".axxa.....", ".aaaa.....", ".axxa.....", ".aaaa....."),
  time: d("white", "white",
    "..aaaaaa..", ".aaaxaaaa.", "aaaaxaaaaa", "aaaaxaaaaa", "aaaaxaaaaa",
    "aaaaxxxaaa", "aaaaaaaaaa", "aaaaaaaaaA", ".aaaaaaaA.", "..AAAAAA.."),
  // link states: signal bars, told apart by how many stand and by the mark over them
  link_linked: d("green", "white",
    "..........", "........a.", "........a.", "......a.a.", "......a.a.",
    "....a.a.a.", "....a.a.a.", "..a.a.a.a.", "..a.a.a.a.", "bbbbbbbbbb"),
  link_weak: d("yellow", "grey",
    "..........", "........b.", "..........", "......b...", "..........",
    "....a.....", "....a.....", "..a.a.....", "..a.a.....", "aaaaaaaaaa"),
  link_cutoff: d("red", "grey",
    "aa......aa", ".aa....aa.", "..aa..aa..", "...aaaa...", "....aa....",
    "...aaaa...", "..aa..aa..", ".aa....aa.", "aa......aa", "bbbbbbbbbb"),
  link_restored: d("green", "white",
    "cc......a.", "cc......a.", "......a.a.", "......a.a.", "....a.a.a.",
    "....a.a.a.", "..a.a.a.a.", "..a.a.a.a.", "a.a.a.a.a.", "aaaaaaaaaa"),
  // activities
  build: d("rust", "white",
    "....cc....", "....cc....", "..cccccc..", "..cccccc..", "....cc....",
    "aaaacc....", "aaaaaaaaaa", "aAaAaAaAaA", "aaaaaaaaaa", "AAAAAAAAAA"),
  repair: d("grey", "white",
    ".aa....aa.", ".aaa..aaa.", "..aaaaaa..", "...acaa...", "...acaa...",
    "...acaa...", "...acaa...", "..aaaaaa..", ".aaa..aaa.", ".aa....aa."),
  clear_dust: d("yellow", "rust",
    "........aa", ".......aa.", "......aa..", ".....aa...", "..aaaa....",
    ".aaaaaa...", "aaaaaaa...", "aaaaaa....", "b.b.b.....", ".b.b.b...."),
  sample: d("grey", "rust",
    ".aaaaaa...", "aa..a.....", "....a.....", "....a.....", "....a.....",
    "....a.bb..", "....abbbb.", "...bbbbbbb", "..bbbbBbbB", ".BBBBBBBBB"),
  analyse: d("white", "cyan",
    "..aaaa....", ".abbbba...", "abbcbbba..", "abcbbbba..", "abbbbbba..",
    ".abbbba...", "..aaaaaa..", "......aaa.", ".......aaa", "........aa"),
  read_map: d("white", "red",
    "aaa.aaa.aa", "aAa.aAa.aA", "aAaaaba.aA", "aAa.bbb.aA", "aAa.aba.aA",
    "aAa.aAa.aA", "aAa.aAa.aA", "aAa.aAa.aA", "aaa.aaa.aa", ".........."),
  restore_link: d("green", "white",
    "aaa.......", "a.a....bbb", "aaa....b.b", ".a.....bbb", ".a......b.",
    ".aaaccaab.", "...cc.....", "....c.....", "....cc....", ".........."),
  schedule_pass: d("cyan", "white",
    "...bb.....", "..bbbb....", ".bbbbbb...", "..bbbb....", "...bb.....",
    "........a.", ".......a..", "a.....a...", ".aa.aa....", "...a......"),
  move_supplies: d("rust", "white",
    ".aaaaaaa..", ".aAaaaAa..", ".aaAaAaa..", ".aaaAaaa..", ".aaAaAaa..",
    ".aAaaaAa..", ".aaaaaaa..", "......c...", "cccccccc..", "......c..."),
  first_aid: d("white", "red",
    "...aaaa...", ".aaaaaaaa.", "aaaabbaaaa", "aaaabbaaaa", "aabbbbbbaa",
    "aabbbbbbaa", "aaaabbaaaa", "aaaabbaaaa", "AAAAAAAAAA", ".........."),
  rest: d("violet", "white",
    "......bbbb", ".......bb.", "......bb..", "......bbbb", "aaaaa.....",
    "...aa.....", "..aa......", ".aa.......", "aaaaa.....", ".........."),
  shelter: d("white", "rust",
    "...aaaa...", "..acaaaa..", ".acaaaaaa.", ".aaaaaaaa.", "aaaaxxaaaa",
    "aaaaxxaaaa", "aaaaxxaaaA", "bbbbbbbbbb", "BBBBBBBBBB", ".........."),
  plan: d("white", "grey",
    "...bbbb...", ".aabbbbaa.", ".aaaaaaaa.", ".axxxaaaa.", ".aaaaaaaa.",
    ".axxxxxaa.", ".aaaaaaaa.", ".axxxxaaa.", ".aaaaaaaa.", ".AAAAAAAA."),
  // task states: one box, a different mark inside
  task_todo: d("white", "white",
    "aaaaaaaaaa", "axxxxxxxxa", "axxxxxxxxa", "axxxxxxxxa", "axxxxxxxxa",
    "axxxxxxxxa", "axxxxxxxxa", "axxxxxxxxa", "axxxxxxxxa", "aaaaaaaaaa"),
  task_progress: d("white", "yellow",
    "aaaaaaaaaa", "abbbbbxxxa", "abbbbbxxxa", "abbbbxxxxa", "abbbbxxxxa",
    "abbbxxxxxa", "abbbxxxxxa", "abbxxxxxxa", "abbxxxxxxa", "aaaaaaaaaa"),
  task_done: d("white", "green",
    "aaaaaaaaaa", "axxxxxxxba", "axxxxxxbba", "axxxxxbbxa", "abxxxbbxxa",
    "abbxbbxxxa", "axbbbxxxxa", "axxbxxxxxa", "axxxxxxxxa", "aaaaaaaaaa"),
  task_failed: d("white", "red",
    "aaaaaaaaaa", "abbxxxxbba", "axbbxxbbxa", "axxbbbbxxa", "axxxbbxxxa",
    "axxbbbbxxa", "axbbxxbbxa", "abbxxxxbba", "axxxxxxxxa", "aaaaaaaaaa"),
  task_hidden: d("grey", "white",
    "aaaaaaaaaa", "axxbbbbxxa", "axbbxxbbxa", "axxxxxbbxa", "axxxxbbxxa",
    "axxxbbxxxa", "axxxbbxxxa", "axxxxxxxxa", "axxxbbxxxa", "aaaaaaaaaa"),
  // hazards
  dust_storm: d("rust", "yellow",
    "..aaaa....", ".a....a...", "a..aa..a..", "a.a..a.a.b", "a.a.aa.a..",
    "a..a...a.b", ".a...aa...", "..aaa...b.", "b...b.....", "..b...b..."),
  cold_night: d("cyan", "white",
    "...aaa....", "..aaa.....", ".aaa...b..", ".aaa..bbb.", "aaa....b..",
    "aaa.......", "aaa.....b.", ".aaa....aa", ".aaaaaaaa.", "...aaaa..."),
  dust_array: d("blue", "rust",
    "aaaaaaaaaa", "abaAaAaAaa", "bbbbaAaAaa", "aAbbbbaAaa", "aaaabbbaaa",
    "aAaAaAbbaa", "aaaaaaaaaa", "....aa....", "....aa....", "...AAAA..."),
  solar_storm: d("yellow", "red",
    "b...b...b.", ".b..b..b..", "..aaaaa...", "bbacaaaabb", "..aaaaaa..",
    "..aaaaaa..", "bbaaaaaabb", "..aaaaa...", ".b..b..b..", "b...b...b."),
  sat_fault: d("cyan", "red",
    "........bb", "aaa.....bb", "aAa.....bb", "aAacaaa.bb", "aAacaaa...",
    "aAa.aAaAaa", "aaa.aaaAaa", ".......bb.", ".......bb.", ".........."),
  // sol counter and the window home
  sol: d("yellow", "rust",
    "....a.....", ".a..a..a..", "..aaaaa...", ".aacaaaa..", "aaaaaaaaaa",
    ".aaaaaaa..", "bbbbbbbbbb", "BbBBbBBbBB", "BBBBBBBBBB", ".........."),
  window_closing: d("white", "yellow",
    "aaaaaaaaaa", ".abbbbbba.", "..abbbba..", "...abba...", "....aa....",
    "....aa....", "...abba...", "..abbbba..", ".abbbbbba.", "aaaaaaaaaa"),
  window_last: d("white", "red",
    "aaaaaaaaaa", ".axxxxxxa.", "..axxxxa..", "...axxa...", "....aa....",
    "....aa....", "...abba...", "..abbbba..", ".abbbbbba.", "aaaaaaaaaa"),
} satisfies Record<string, Def>;

export type IconKey = keyof typeof DEFS;
export const ICON_KEYS = Object.keys(DEFS) as IconKey[];
/** The icons in their groups, for the preview and for the game's own lists. */
export const ICON_GROUPS: Record<string, IconKey[]> = {
  "health gauges": ["radiation", "energy", "air", "water", "food", "body", "morale"],
  resources: ["mass", "power", "budget", "data", "communications", "time"],
  "link states": ["link_linked", "link_weak", "link_cutoff", "link_restored"],
  activities: [
    "build", "repair", "clear_dust", "sample", "analyse", "read_map", "restore_link", "schedule_pass",
    "move_supplies", "first_aid", "rest", "shelter", "plan",
  ],
  "task states": ["task_todo", "task_progress", "task_done", "task_failed", "task_hidden"],
  hazards: ["dust_storm", "cold_night", "dust_array", "solar_storm", "sat_fault"],
  "sol and window": ["sol", "window_closing", "window_last"],
};

/** Puts a 10 x 10 symbol into the 12 x 12 cell, with C's plate behind it. */
export function placeSymbol(rows: readonly string[], v: Version): string[] {
  const g = new Grid(ICON, ICON);
  if (v === "C") g.rect(1, 0, 10, 12, "p").rect(0, 1, 12, 10, "p");
  g.stamp(rows, 1, 1);
  return g.rows();
}

/** The palette of one symbol in one version. */
export function iconPalette(v: Version, a: Hue, b: Hue): { outline: "full" | "selective" | "none"; palette: Record<string, string> } {
  const [a1, a2] = ICON_HUES[a];
  const [b1, b2] = ICON_HUES[b];
  if (v === "A") return { outline: "full", palette: { o: ICON_A.outline, x: ICON_A.outline, a: a1, A: a1, b: b1, B: b1, c: ICON_A.light } };
  if (v === "B")
    return { outline: "selective", palette: { o: ICON_B.outline, O: ICON_B.litOutline, x: ICON_B.dark, a: a1, A: a2, b: b1, B: b2, c: ICON_B.light } };
  return { outline: "none", palette: { p: ICON_C.plate, x: ICON_C.dark, a: a1, A: a1, b: b1, B: b1, c: ICON_C.light } };
}

/** Renders a symbol to a 12 x 12 sprite in one version. Shared with the gear's role badges. */
export function iconSprite(rows: readonly string[], v: Version, a: Hue, b: Hue): Sprite {
  // A has only 4 colours: when a symbol uses two hues and the light and the dark, the second hue gives way to the light
  const style = iconPalette(v, a, b);
  const sprite = render(placeSymbol(rows, v), style);
  return sprite;
}

function build(v: Version): Record<IconKey, Sprite> {
  const out = {} as Record<IconKey, Sprite>;
  for (const k of ICON_KEYS) {
    const def: Def = DEFS[k];
    out[k] = iconSprite(def.rows, v, def.a, def.b);
  }
  return out;
}

export const A = build("A");
export const B = build("B");
export const C = build("C");
export type { Hue as IconHue };
