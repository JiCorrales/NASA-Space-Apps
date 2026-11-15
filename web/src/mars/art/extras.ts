/**
 * Extras for the crew: the communicator's speech bubbles (a normal one and a broken one full of static),
 * emotes shown over a character (question, alert, done) and boot prints in the dust.
 *
 * Semantic characters: a/A bubble and its shade, x dark mark, f/F/g the print, its lit rim and its tread.
 */
import type { Sprite } from "./paint";
import { Grid, render, type Style, type Version } from "./raster";

const place = (rows: string[], w: number, h: number) => new Grid(w, h).stamp(rows, 1, 1).rows();

const BUBBLE = [
  ".aaaaaaaaaaaa.",
  "aaaaaaaaaaaaaa",
  "aaxxaaxxaaxxaa",
  "aaxxaaxxaaxxaa",
  "aaaaaaaaaaaaaa",
  "AaaaaaaaaaaaaA",
  ".AAAAAAAAAAAA.",
  "...AaA........",
  "...AA.........",
  "...A..........",
];
/** The broken bubble: torn edges and static, two frames that flicker. */
const BROKEN = [
  [
    ".aaa.aaaa.aaa.",
    "aaxa.aaxxaaa.a",
    "axaaxaa.axaxaa",
    "aaa.aaxaaxaa.a",
    "a.aaaxa.aaaaxa",
    "AaaxaaaaaxaaaA",
    ".AAA.AAAAA.AA.",
    "...AaA........",
    "....A.........",
    "...A..........",
  ],
  [
    ".aa.aaaa.aaaa.",
    "aaaaxaa.aaxaaa",
    "a.axaaxaaaa.xa",
    "axaa.aaaxaaxaa",
    "aaxaaa.aaxa.aa",
    "Aa.aaxaaaaaxaA",
    ".AAAA.AAA.AAA.",
    "...AaA........",
    "...A..........",
    "....A.........",
  ],
];

const EMOTE: Record<"question" | "alert" | "done", string[]> = {
  question: [".aaaaaaaa.", "aaaxxxxaaa", "aaxxaaxxaa", "aaaaaaxxaa", "aaaaaxxaaa", "aaaaxxaaaa", "aaaaaaaaaa", "AaaaxxaaaA", ".AAAAAAAA.", "...AA....."],
  alert: [".aaaaaaaa.", "aaaaxxaaaa", "aaaaxxaaaa", "aaaaxxaaaa", "aaaaxxaaaa", "aaaaaaaaaa", "aaaaxxaaaa", "AaaaaaaaaA", ".AAAAAAAA.", "...AA....."],
  done: [".aaaaaaaa.", "aaaaaaaaxa", "aaaaaaaxxa", "aaaaaaxxaa", "axxaaxxaaa", "aaxxxxaaaa", "aaaxxaaaaa", "AaaaaaaaaA", ".AAAAAAAA.", "...AA....."],
};

/** A boot print, toe up; the tile holds a left and a right print, walking up the screen. */
const PRINT = [".FF.", "FfgF", "FgfF", "FfgF", ".FF.", "....", ".FF.", "FgfF", ".FF."];
function printsTile(): string[] {
  const g = new Grid(16, 16);
  g.stamp(PRINT, 2, 6).stamp(PRINT, 9, 0);
  return g.rows();
}

export const EXTRA_COLOURS = {
  bubble: "#e4ecf5", bubbleShade: "#8394ab", mark: "#05070f", outline: "#05070f", litOutline: "#2b3852",
  print: "#6e2a1a", printRim: "#cf7a49", tread: "#8f3a22",
} as const;

function style(v: Version, withOutline: boolean): Style {
  const c = EXTRA_COLOURS;
  const palette: Record<string, string> = {
    o: c.outline, O: c.litOutline, a: c.bubble, A: v === "A" ? c.bubble : c.bubbleShade, x: c.mark,
    f: c.print, F: c.printRim, g: v === "A" ? c.print : c.tread,
  };
  return { outline: !withOutline || v === "C" ? "none" : v === "A" ? "full" : "selective", palette };
}

export interface Extras {
  bubble: Sprite[];
  bubble_broken: Sprite[];
  emote_question: Sprite[];
  emote_alert: Sprite[];
  emote_done: Sprite[];
  footprints: Sprite[];
}

function build(v: Version): Extras {
  const s = style(v, true);
  const one = (rows: string[], w: number, h: number) => [render(place(rows, w, h), s)];
  return {
    bubble: one(BUBBLE, 16, 12),
    bubble_broken: BROKEN.map((f) => render(place(f, 16, 12), s)),
    emote_question: one(EMOTE.question, 12, 12),
    emote_alert: one(EMOTE.alert, 12, 12),
    emote_done: one(EMOTE.done, 12, 12),
    footprints: [render(printsTile(), style(v, false))],
  };
}

export const A = build("A");
export const B = build("B");
export const C = build("C");
