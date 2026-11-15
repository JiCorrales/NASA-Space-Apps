/**
 * The Mars palette of the world art, one set of named colours per art direction, and the table that
 * maps the one-letter pixel codes the drawing code uses onto them. Three directions:
 *   A "8-bit": saturated, few colours, one dark outline.
 *   B "16-bit": two tones per material plus highlights, softer hues.
 *   C "flat": muted modern flat colours, no outline.
 * Ground ramp codes run lightest to darkest: 5 3 1 2 4. Night ramp: J K L M N.
 */
export type Ver = "A" | "B" | "C";
export const VERSIONS: readonly Ver[] = ["A", "B", "C"];
export const VERSION_NAME: Record<Ver, string> = { A: "A 8-bit", B: "B 16-bit", C: "C flat" };
/** Maximum colours per sprite (A counts its outline). */
export const COLOUR_LIMIT: Record<Ver, number> = { A: 4, B: 12, C: 5 };

export const MARS_A = {
  OUTLINE: "#2a1210", CREAM: "#f2e2c4", SAND: "#e0904c", RUST: "#c0562c", BROWN: "#8a3a24", DEEP: "#52221a",
  PALE: "#f4b46c", STONE: "#7a5a52", STONE_DK: "#4a3030", STONE_LT: "#b08c7a",
  STEEL: "#a4a0b0", STEEL_DK: "#58506a", ORANGE: "#ff7a2a", ORANGE_DK: "#b83a1c",
  CELL: "#2c48c0", CELL_LT: "#9cb8ff", GLASS: "#1c1034", LAMP: "#ffe05a", WHITE: "#ffffff", FAULT: "#ff4636",
  DUST: "#ecb880", DUST_DK: "#c88a58",
  DAY: "#e89a6c", DAY_DK: "#c46a48", DAY_LT: "#f6c890", DUSK: "#9a4a78", DUSK_DK: "#5a2a5c", DUSK_LT: "#e8786a",
  NIGHT: "#0c0e2c", NIGHT_LT: "#1e1c4c", MOON: "#f8f0d8", MOON_DK: "#9a90a8",
  FROST: "#eef6ff", FROST_DK: "#8cc8f0", FOUND: "#46e0f0", SAMPLED: "#5cdc90",
  N1: "#7a6aa8", N2: "#5c4c8c", N3: "#46386e", N4: "#30244e", N5: "#201638",
} as const;

export const MARS_B = {
  OUTLINE: "#3a1d18", CREAM: "#d8c8b4", SAND: "#c26f48", RUST: "#bb6a43", BROWN: "#b46640", DEEP: "#8a4a30",
  PALE: "#dd9560", STONE: "#8a6458", STONE_DK: "#5e4440", STONE_LT: "#a8837a",
  STEEL: "#9098a8", STEEL_DK: "#586070", ORANGE: "#e8742c", ORANGE_DK: "#b04820",
  CELL: "#34508c", CELL_LT: "#6c90d0", GLASS: "#24243c", LAMP: "#ffd060", WHITE: "#fff4c8", FAULT: "#e84a3c",
  DUST: "#d9a878", DUST_DK: "#b88458",
  HULL_LT: "#f0e4d2", HULL_DK: "#a89480", HULL_DEEP: "#7c6a5c", GLASS_LT: "#ffe08a",
  DAY: "#dc9468", DAY_DK: "#b87050", DAY_LT: "#eec090", DUSK: "#8a5080", DUSK_DK: "#58305c", DUSK_LT: "#e08068",
  NIGHT: "#0e1030", NIGHT_LT: "#201e48", MOON: "#f0e8d0", MOON_DK: "#8c84a0",
  FROST: "#e8f2fa", FROST_DK: "#98c0e0", FOUND: "#58d8ec", SAMPLED: "#68d498",
  N1: "#8068a0", N2: "#66508a", N3: "#503c72", N4: "#3a2c58", N5: "#281e40",
} as const;

export const MARS_C = {
  OUTLINE: "#000000", CREAM: "#ece2d4", SAND: "#d98c5c", RUST: "#c9744a", BROWN: "#b4623e", DEEP: "#8f4a32",
  PALE: "#e6a574", STONE: "#8c6a60", STONE_DK: "#664a46", STONE_LT: "#ae8a80",
  STEEL: "#b8bcc8", STEEL_DK: "#6e7488", ORANGE: "#f2863c", ORANGE_DK: "#d4612c",
  CELL: "#3d5a9e", CELL_LT: "#8fb0e8", GLASS: "#2a2a44", LAMP: "#ffd466", WHITE: "#fff6dc", FAULT: "#e8503c",
  DUST: "#e8c09a", DUST_DK: "#cfa078",
  HULL_DK: "#c7b6a2",
  DAY: "#eaa97c", DAY_DK: "#d4885e", DAY_LT: "#f4cfa0", DUSK: "#8c5a8c", DUSK_DK: "#5e3a66", DUSK_LT: "#ec8a6c",
  NIGHT: "#161a3c", NIGHT_LT: "#262a56", MOON: "#f4ecd8", MOON_DK: "#a89cb4",
  FROST: "#f0f6fc", FROST_DK: "#a8cce8", FOUND: "#4cd0e4", SAMPLED: "#5ccc8c",
  N1: "#8c78ac", N2: "#725e98", N3: "#5a4880", N4: "#443468", N5: "#30244c",
} as const;

/** Soft black used for cast shadows (B and C); A has no cast shadow, its outline grounds the shapes. */
const SHADOW: Record<Ver, string> = { A: "#2a121080", B: "#2a121058", C: "#2a121048" };
/** Translucent dust and frost layers for the overlays. */
const DUST_A: Record<Ver, [string, string]> = { A: ["#ecb880b0", "#c88a58c8"], B: ["#e0b080a0", "#b88458b8"], C: ["#e8c09a99", "#cfa078b3"] };

type Pal = typeof MARS_A | typeof MARS_B | typeof MARS_C;

function table(v: Ver, P: Pal): Record<string, string> {
  const hull = (k: "HULL_LT" | "HULL_DK" | "HULL_DEEP" | "GLASS_LT", fb: string): string => (k in P ? (P as Record<string, string>)[k]! : fb);
  const hullLt = v === "A" ? P.CREAM : hull("HULL_LT", P.CREAM);
  const hullShade = v === "A" ? P.STONE_LT : v === "B" ? hull("HULL_DK", P.STONE_LT) : hull("HULL_DK", P.STONE_LT);
  const hullDeep = v === "B" ? hull("HULL_DEEP", P.STONE) : v === "C" ? P.STONE : P.STONE;
  return {
    o: P.OUTLINE, x: SHADOW[v],
    "5": P.PALE, "3": P.SAND, "1": P.RUST, "2": P.BROWN, "4": P.DEEP,
    J: P.N1, K: P.N2, L: P.N3, M: P.N4, N: P.N5,
    r: P.STONE, R: P.STONE_DK, q: P.STONE_LT,
    h: P.CREAM, s: hullShade, l: hullLt, j: hullDeep, m: P.STEEL, n: P.STEEL_DK,
    a: P.ORANGE, b: P.ORANGE_DK, p: P.CELL, P: P.CELL_LT,
    g: P.GLASS, G: v === "A" ? P.LAMP : hull("GLASS_LT", P.LAMP), y: P.LAMP, Y: P.WHITE, f: P.FAULT,
    d: DUST_A[v][0], D: DUST_A[v][1], e: "#05070f",
    u: P.DAY, V: P.DUSK_DK, w: P.DAY_LT, W: P.DUSK_LT, U: P.DUSK, S: P.DAY_DK,
    t: P.NIGHT, T: P.NIGHT_LT, z: P.MOON, Z: P.MOON_DK,
    i: P.FROST, I: P.FROST_DK, c: P.FOUND, k: P.SAMPLED,
  };
}

export const PALETTE: Record<Ver, Record<string, string>> = {
  A: table("A", MARS_A), B: table("B", MARS_B), C: table("C", MARS_C),
};
