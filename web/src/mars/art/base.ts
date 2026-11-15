/**
 * The base on Mars in three art directions: lander, habitat (frame, shell, powered), solar array (clean,
 * dusty, stowed), antenna (three stages, transmitting), storage (two stages), props, conduits, light pole
 * and a damaged version of each module. Three-quarter top-down view, light from the top left.
 */
import { Grid, build, frames, versions, type Style, type Ver } from "./worldkit";

const shadow = (g: Grid, S: Style, cx: number, cy: number, rx: number, ry: number) => {
  if (S.v !== "A") g.ell(cx, cy, rx, ry, "x");
};

/** Habitat body: a horizontal pressure hull, roof on top, front wall below. */
function habBody(g: Grid, S: Style, lit: boolean): void {
  shadow(g, S, 25, 28, 22, 3);
  g.rect(5, 6, 38, 21, "h");
  for (const [x, y] of [[5, 6], [42, 6], [5, 26], [42, 26]] as const) g.set(x, y, ".");
  g.rect(6, 5, 36, 1, "h"); // rounded roof edge
  g.rect(5, 15, 38, 12, "s"); // front wall in shade
  g.rect(5, 15, 38, 1, "n"); // eave trim
  if (S.rich) { g.rect(7, 6, 34, 1, "l").rect(5, 25, 38, 2, "j"); g.rect(5, 7, 1, 8, "l"); }
  if (S.v !== "C") for (let x = 11; x < 42; x += 6) g.rect(x, 7, 1, 8, S.v === "A" ? "s" : "j"); // roof ribs
  g.rect(5, 23, 38, 1, "a"); // orange service stripe
  // door
  g.rect(20, 17, 8, 10, "n").rect(21, 18, 6, 9, lit ? "G" : "m").set(26, 22, "a");
  g.rect(20, 17, 8, 1, "m");
  // windows
  for (const x of [9, 34]) {
    g.rect(x, 18, 5, 4, "n").rect(x + 1, 19, 3, 2, lit ? "G" : "g");
  }
  // roof vent
  if (S.v !== "C") g.rect(13, 9, 4, 3, "n").rect(14, 9, 2, 1, "m");
  if (lit) g.rect(34, 2, 1, 4, "n").set(34, 1, "y").set(33, 1, "Y").set(35, 1, "y");
}

function habFrame(g: Grid, S: Style): void {
  shadow(g, S, 25, 28, 22, 3);
  g.rect(3, 26, 42, 3, "n").rect(3, 26, 42, 1, "m");
  for (const x of [5, 12, 19, 26, 33, 40, 42]) g.rect(x, 6, 1, 21, "m");
  g.rect(5, 6, 38, 1, "m").rect(5, 15, 38, 1, "m").rect(5, 5, 38, 1, "n");
  for (const x of [5, 19, 33]) { g.line(x + 1, 16, x + 6, 26, "n"); g.line(x + 6, 16, x + 1, 26, "n"); }
  // two roof panels already fixed, to show the build is under way
  g.rect(6, 7, 6, 8, "h").rect(13, 7, 6, 8, "s");
  if (S.rich) g.rect(6, 7, 6, 1, "l");
  // a hoist and a hook
  g.rect(36, 2, 1, 4, "a").rect(34, 2, 5, 1, "a");
}

function habDamaged(g: Grid, S: Style): void {
  habBody(g, S, false);
  // breach in the roof, crack, scorch, a spark, a window broken
  g.rect(28, 7, 9, 7, "R");
  g.stamp(["..gggg..", ".gggggg.", "gggggggg", ".gggggg."], 28, 8);
  g.line(24, 6, 27, 11, "g").line(27, 11, 25, 15, "g").line(25, 15, 22, 16, "g");
  g.set(29, 7, "n").set(31, 6, "n").set(35, 7, "n").set(37, 9, "n");
  g.set(33, 5, "f").set(34, 4, "y").set(32, 4, "y");
  g.stamp(["n..n", ".nn.", ".nn.", "n..n"], 34, 18); // shattered window
  g.rect(9, 18, 5, 4, "n").rect(10, 19, 3, 2, "g");
  g.set(30, 20, "R").set(31, 21, "R").set(29, 22, "R").set(32, 22, "R"); // scorch on the wall
}

/** One solar panel as a sheared parallelogram of cells. `dust` is 0 (clean), 1 (dusty) or 2 (broken). */
function array(g: Grid, S: Style, dust: 0 | 1 | 2): void {
  shadow(g, S, 25, 28, 21, 3);
  // frame legs and base
  g.rect(8, 22, 2, 6, "n").rect(38, 22, 2, 6, "n").rect(5, 27, 8, 2, "m").rect(35, 27, 8, 2, "m");
  g.rect(22, 21, 4, 7, "n").rect(20, 27, 8, 2, "m").set(24, 24, "a"); // junction box
  for (let y = 3; y < 22; y++) {
    const sh = Math.round((22 - y) * 0.3);
    const x0 = 3 + sh, w = 38;
    g.rect(x0, y, w, 1, "p");
    g.set(x0, y, "m").set(x0 + w - 1, y, "m");
    if ((y - 3) % 9 === 0) g.rect(x0, y, w, 1, "P"); // rows of cells
    for (let c = 0; c <= 4; c++) g.set(x0 + c * 9, y, "P");
    if (S.rich && y === 4) g.rect(x0 + 1, y, w - 2, 1, "P");
  }
  g.rect(8, 3, 38, 1, "m").rect(2, 21, 38, 1, "m").rect(2, 21, 1, 1, "n");
  if (S.rich) for (const [x, y] of [[12, 6], [13, 7], [21, 6], [22, 7], [31, 6], [32, 7]] as const) g.set(x, y, "l"); // glint
  if (dust === 1) {
    for (let y = 4; y < 21; y++) for (let x = 4; x < 46; x++) {
      const c = g.get(x, y);
      if ((c === "p" || c === "P") && ((x * 7 + y * 13) % 11 < 4 || (y > 12 && (x + y) % 3 === 0))) g.set(x, y, (x + y) % 4 ? "3" : "5");
    }
  }
  if (dust === 2) {
    // snapped: a diagonal break, a dark gap and loose cells
    for (let y = 3; y < 22; y++) {
      const x = 22 + Math.round((y - 12) * 0.9);
      g.rect(x - 1, y, 3, 1, "g");
      if (y % 3 === 0) g.set(x + 2, y, "f");
    }
    g.set(14, 9, "g").set(15, 9, "g").set(33, 15, "g").set(32, 15, "g");
  }
}

function arrayStowed(g: Grid, S: Style): void {
  shadow(g, S, 25, 28, 12, 3);
  g.rect(14, 26, 20, 3, "m").rect(14, 26, 20, 1, "l");
  g.rect(20, 5, 9, 21, "n"); // folded stack seen from the edge
  for (let y = 7; y < 25; y += 3) g.rect(21, y, 7, 2, "p").set(21, y, "P");
  g.rect(18, 3, 13, 2, "m").rect(23, 2, 3, 1, "a"); // top latch with a lamp
  g.rect(19, 12, 1, 4, "m").rect(29, 12, 1, 4, "m"); // clamps
  if (S.rich) g.rect(20, 5, 1, 21, "m");
  g.rect(4, 24, 14, 2, "n").rect(31, 24, 14, 2, "n"); // empty cradles
  g.rect(4, 22, 2, 2, "m").rect(43, 22, 2, 2, "m");
}

const antennaBase = (g: Grid, S: Style) => {
  shadow(g, S, 17, 28, 11, 3);
  g.rect(7, 25, 20, 4, "n").rect(7, 25, 20, 1, "m").rect(11, 22, 12, 3, "m");
};
/** Parabolic dish seen from the front and above, on a mast. `stage` 1: pad and stub, 2: mast and open frame, 3: full dish. */
function antenna(g: Grid, S: Style, stage: 1 | 2 | 3, broken = false): void {
  antennaBase(g, S);
  if (stage === 1) { g.rect(15, 15, 4, 8, "m").rect(15, 15, 1, 8, "l").rect(13, 21, 8, 2, "n"); g.set(16, 14, "a").set(17, 14, "a"); return; }
  g.rect(15, 13, 4, 10, "m").rect(15, 13, 1, 10, "l").rect(13, 21, 8, 2, "n");
  const lean = broken ? 3 : 0;
  g.ell(17 + lean, 9, 11, 8, "n"); // dish rim
  if (stage === 2) {
    // open frame: spokes only
    g.ell(17 + lean, 9, 11, 8, ".").ring(17 + lean, 9, 11, 8, "m");
    g.line(17 + lean, 9, 8 + lean, 9, "m").line(17 + lean, 9, 26 + lean, 9, "m").line(17 + lean, 9, 17 + lean, 1, "m").line(17 + lean, 9, 17 + lean, 17, "m");
    g.line(17 + lean, 9, 10 + lean, 3, "m").line(17 + lean, 9, 24 + lean, 15, "m");
    return;
  }
  g.ell(17 + lean, 9, 10, 7, "h");
  g.ell(18 + lean, 10, 7, 5, "s");
  if (S.rich) { g.rect(10 + lean, 5, 6, 1, "l"); g.set(9 + lean, 7, "l"); }
  g.line(17 + lean, 10, 24 + lean, 1, "n").rect(23 + lean, 0, 3, 3, "a"); // feed arm and horn
  g.set(17 + lean, 10, "a");
  g.rect(26 - 11, 13, 1, 1, "n");
  if (broken) {
    g.line(10, 4, 18, 14, "g").line(18, 14, 15, 16, "g");
    g.set(12, 3, "f").set(24, 2, "f").set(5, 9, "y");
  }
}
/** Radio arcs for the transmitting frames: two frames, the arcs grow outward. */
function waves(g: Grid, f: number): void {
  const r = f === 0 ? [4, 8] : [6, 11];
  for (const k of r) for (let a = -50; a <= 50; a += 8) {
    const t = (a * Math.PI) / 180;
    g.set(Math.round(26 + Math.cos(t) * k), Math.round(1 - Math.sin(t) * k * 0.9), "y");
  }
}

function storage(g: Grid, S: Style, stage: 1 | 2, broken = false): void {
  shadow(g, S, 17, 28, 14, 3);
  g.rect(2, 24, 28, 4, "n").rect(2, 24, 28, 1, "m");
  if (stage === 1) {
    // open frame of a container with two crates inside
    for (const x of [3, 14, 28]) g.rect(x, 10, 2, 15, "m");
    g.rect(3, 10, 27, 2, "m").rect(3, 17, 27, 1, "n");
    g.rect(6, 19, 7, 5, "a").rect(17, 19, 8, 5, "b").set(6, 19, "Y");
    return;
  }
  g.rect(3, 9, 26, 16, "h").rect(3, 9, 26, 3, "l").rect(3, 19, 26, 6, "s");
  g.rect(3, 9, 26, 1, "n").rect(3, 24, 26, 1, "j");
  if (S.v !== "C") for (let x = 8; x < 28; x += 5) g.rect(x, 12, 1, 12, S.v === "A" ? "s" : "j");
  g.rect(12, 14, 9, 10, "n").rect(13, 15, 7, 9, "m").rect(16, 15, 1, 9, "n").set(15, 20, "a").set(18, 20, "a"); // double door
  g.rect(3, 12, 26, 1, "a");
  if (broken) {
    g.stamp(["..gg..", ".gggg.", "gggggg", ".gggg."], 22, 13);
    g.line(8, 9, 11, 15, "g").set(25, 11, "f").set(26, 10, "y").set(5, 17, "R").set(6, 18, "R");
    g.rect(13, 17, 2, 6, "g");
  }
}

function lander(g: Grid, S: Style): void {
  shadow(g, S, 25, 42, 22, 4);
  // four legs with foot pads
  g.line(15, 28, 5, 41, "n").line(16, 28, 6, 41, "n").line(33, 28, 43, 41, "n").line(32, 28, 42, 41, "n");
  g.line(18, 30, 15, 43, "n").line(30, 30, 33, 43, "n");
  for (const x of [2, 12, 30, 40]) g.rect(x, x < 20 && x > 5 ? 43 : 41, 6, 2, "m");
  // landing ramp down at the front
  g.rect(19, 36, 10, 8, "s").rect(19, 36, 10, 1, "m"); for (let y = 38; y < 44; y += 2) g.rect(20, y, 8, 1, "j");
  // body: a squat capsule, heat shield below, top deck
  g.ell(24, 22, 17, 13, "s");
  g.ell(24, 20, 17, 12, "h");
  g.ell(24, 19, 12, 8, "s");
  g.ell(24, 18, 11, 7, "h");
  if (S.rich) { g.rect(15, 12, 10, 1, "l"); g.set(14, 14, "l"); g.rect(8, 16, 1, 4, "l"); }
  g.rect(20, 17, 8, 6, "n").rect(21, 18, 6, 4, "g").set(22, 19, "G").set(25, 19, "G"); // hatch window
  g.rect(8, 24, 32, 2, "a"); // orange belt
  for (const [x, y] of [[10, 13], [37, 13], [8, 28], [39, 28]] as const) g.rect(x, y, 2, 2, "n"); // thrusters
  g.rect(23, 4, 2, 5, "m").set(23, 3, "a").set(24, 3, "a"); // whip aerial
}

const solidProp = (g: Grid, S: Style, body: string, hi: string, lo: string) => {
  shadow(g, S, 8, 14, 7, 2);
  g.rect(2, 4, 12, 10, body).rect(2, 4, 12, 3, hi).rect(2, 11, 12, 3, lo);
};
function crate(g: Grid, S: Style): void {
  solidProp(g, S, "h", "l", "s");
  g.rect(2, 8, 12, 1, "a").rect(7, 4, 2, 10, "a");
  g.rect(3, 5, 2, 1, "Y");
}
function battery(g: Grid, S: Style): void {
  shadow(g, S, 8, 14, 7, 2);
  g.rect(2, 4, 12, 10, "n").rect(2, 4, 12, 3, "m").rect(4, 2, 2, 2, "a").rect(10, 2, 2, 2, "m");
  g.stamp(["..y.", ".yy.", "yyyy", ".yy.", ".y.."], 6, 6); // bolt
  if (S.rich) g.rect(2, 4, 12, 1, "l");
}
function sampleContainer(g: Grid, S: Style): void {
  shadow(g, S, 8, 14, 6, 2);
  g.rect(4, 3, 8, 11, "g").rect(4, 3, 8, 3, "m").rect(5, 6, 6, 7, "P").rect(4, 3, 8, 1, "l");
  g.rect(5, 8, 6, 2, "a").rect(5, 11, 6, 1, "s");
  g.set(6, 6, "Y").set(6, 7, "Y");
}
function lightPole(g: Grid, S: Style, lit = true): void {
  shadow(g, S, 8, 14, 5, 2);
  g.rect(7, 4, 2, 10, "m").rect(5, 13, 6, 1, "n").rect(5, 2, 6, 3, "n").rect(6, 3, 4, 2, lit ? "Y" : "g");
  if (lit) { g.set(3, 3, "y").set(12, 3, "y").set(4, 0, "y").set(11, 0, "y").set(7, 0, "y").set(8, 0, "y"); }
}
/** Conduits are 16 x 16 and meet at the middle of each side: `E` east, `W` west, `N` north, `S` south. */
function conduit(g: Grid, S: Style, dirs: string): void {
  const pipe = (x: number, y: number, w: number, h: number) => {
    g.rect(x, y, w, h, "m");
    if (w > h) g.rect(x, y, w, 1, S.rich ? "l" : "m").rect(x, y + h - 1, w, 1, "n");
    else g.rect(x, y, 1, h, S.rich ? "l" : "m").rect(x + w - 1, y, 1, h, "n");
  };
  g.rect(5, 5, 6, 6, "n").rect(6, 6, 4, 4, "m").set(7, 7, "a");
  if (dirs.includes("E")) { pipe(10, 6, 6, 4); g.rect(13, 5, 1, 6, "n"); }
  if (dirs.includes("W")) { pipe(0, 6, 6, 4); g.rect(2, 5, 1, 6, "n"); }
  if (dirs.includes("N")) { pipe(6, 0, 4, 6); g.rect(5, 2, 6, 1, "n"); }
  if (dirs.includes("S")) { pipe(6, 10, 4, 6); g.rect(5, 13, 6, 1, "n"); }
}

const defs = {
  habitatFrame: (v: Ver) => build(v, 48, 32, habFrame),
  habitatShell: (v: Ver) => build(v, 48, 32, (g, S) => habBody(g, S, false)),
  habitatPowered: (v: Ver) => build(v, 48, 32, (g, S) => habBody(g, S, true)),
  habitatDamaged: (v: Ver) => build(v, 48, 32, habDamaged),
  solarClean: (v: Ver) => build(v, 48, 32, (g, S) => array(g, S, 0)),
  solarDusty: (v: Ver) => build(v, 48, 32, (g, S) => array(g, S, 1)),
  solarStowed: (v: Ver) => build(v, 48, 32, arrayStowed),
  solarDamaged: (v: Ver) => build(v, 48, 32, (g, S) => array(g, S, 2)),
  antenna1: (v: Ver) => build(v, 32, 32, (g, S) => antenna(g, S, 1)),
  antenna2: (v: Ver) => build(v, 32, 32, (g, S) => antenna(g, S, 2)),
  antenna3: (v: Ver) => build(v, 32, 32, (g, S) => antenna(g, S, 3)),
  antennaTransmit: (v: Ver) => frames(v, 2, 32, 32, (g, S, f) => { antenna(g, S, 3); waves(g, f); }),
  antennaDamaged: (v: Ver) => build(v, 32, 32, (g, S) => antenna(g, S, 3, true)),
  storage1: (v: Ver) => build(v, 32, 32, (g, S) => storage(g, S, 1)),
  storage2: (v: Ver) => build(v, 32, 32, (g, S) => storage(g, S, 2)),
  storageDamaged: (v: Ver) => build(v, 32, 32, (g, S) => storage(g, S, 2, true)),
  lander: (v: Ver) => build(v, 48, 48, lander),
  sampleContainer: (v: Ver) => build(v, 16, 16, sampleContainer),
  supplyCrate: (v: Ver) => build(v, 16, 16, crate),
  battery: (v: Ver) => build(v, 16, 16, battery),
  conduitStraight: (v: Ver) => build(v, 16, 16, (g, S) => conduit(g, S, "EW")),
  conduitCorner: (v: Ver) => build(v, 16, 16, (g, S) => conduit(g, S, "ES")),
  conduitT: (v: Ver) => build(v, 16, 16, (g, S) => conduit(g, S, "EWS")),
  lightPole: (v: Ver) => build(v, 16, 16, (g, S) => lightPole(g, S)),
};
export const { A, B, C } = versions(defs);
export type BaseKey = keyof typeof defs;
