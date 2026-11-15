/**
 * The relay CubeSat in three art directions, consistent with PixelCubeSat.tsx (3U body in three units,
 * frame rails, blue cells, a lens, a UHF whip or an S-band patch): the close-up for a panel (32 x 24) in
 * the eight combinations of the design (body-mounted cells or wings, basic or multispectral camera, whip
 * or patch), the moving point seen from the ground, the pass arc with its footprint, and the satellite in
 * trouble (tumbling, dark, no signal).
 */
import { Grid, build, frames, versions, type Style, type Ver } from "./worldkit";

interface Look { wings: boolean; multi: boolean; patch: boolean }
interface Fault { dark?: boolean; mark?: "off" | "x" }

function drawSat(g: Grid, S: Style, look: Look, fault: Fault = {}): void {
  const cell = fault.dark ? "n" : "p", line = fault.dark ? "j" : "P";
  const x0 = 9, w = 14;
  // body: top face lit, front face in shade, three units split by rails
  g.rect(x0, 8, w, 5, "h").rect(x0, 13, w, 5, "s");
  g.rect(x0, 8, w, 1, "l").rect(x0, 13, w, 1, "m");
  if (S.rich) g.rect(x0, 17, w, 1, "j");
  for (const x of [x0 + 4, x0 + 9]) g.rect(x, 8, 1, 10, "m");
  g.rect(x0, 8, 1, 10, "m").rect(x0 + w - 1, 8, 1, 10, "m");
  if (!look.wings) {
    // body-mounted cells: one panel on each face
    for (let u = 0; u < 3; u++) {
      const cx = x0 + 1 + u * 4 + (u === 2 ? 1 : 0);
      g.rect(cx, 9, 3, 3, cell).rect(cx, 14, 3, 3, cell);
      g.set(cx + 1, 10, line).set(cx + 1, 15, line);
    }
  }
  if (look.wings) {
    for (const side of [-1, 1]) {
      const wx = side < 0 ? 0 : 24;
      g.rect(side < 0 ? 7 : 23, 12, 2, 2, "m"); // hinge
      g.rect(wx, 5, 8, 14, "m").rect(wx + 1, 6, 6, 12, cell);
      g.rect(wx + 3, 6, 1, 12, line).rect(wx + 1, 11, 6, 1, line);
      if (S.rich && !fault.dark) g.set(wx + 1, 6, "P").set(wx + 2, 7, "P");
    }
  }
  // camera on the front face: one big lens or three small ones in different colours
  if (look.multi) {
    g.rect(x0 + 1, 15, 3, 2, "n").set(x0 + 2, 15, fault.dark ? "g" : "c");
    g.rect(x0 + 5, 15, 3, 2, "n").set(x0 + 6, 15, fault.dark ? "g" : "y");
    g.rect(x0 + 10, 15, 3, 2, "n").set(x0 + 11, 15, fault.dark ? "g" : "a");
  } else {
    g.rect(x0 + 5, 14, 5, 4, "n").rect(x0 + 6, 15, 3, 2, "g").set(x0 + 6, 15, fault.dark ? "g" : "P");
  }
  // antenna on top: UHF whip with a ball tip, or a flat S-band patch
  if (look.patch) {
    g.rect(x0 + 3, 5, 8, 3, "n").rect(x0 + 4, 6, 6, 1, "m").set(x0 + 6, 6, "a").set(x0 + 7, 6, "a");
  } else {
    g.rect(x0 + 6, 2, 1, 6, "Y").set(x0 + 6, 1, "a").set(x0 + 5, 1, "a").set(x0 + 5, 0, "a").set(x0 + 6, 0, "a");
  }
}

const LOOKS: Record<string, Look> = {};
for (const wings of [false, true]) for (const multi of [false, true]) for (const patch of [false, true])
  LOOKS[`sat${wings ? "Wings" : "Body"}${multi ? "Multi" : "Basic"}${patch ? "Patch" : "Whip"}`] = { wings, multi, patch };
const BASE_LOOK: Look = { wings: true, multi: false, patch: false };

const closeups = Object.fromEntries(
  Object.entries(LOOKS).map(([k, look]) => [k, (v: Ver) => build(v, 32, 24, (g, S) => drawSat(g, S, look))]),
);

const tumble = (v: Ver) =>
  frames(v, 3, 32, 24, (g, S, f) => {
    const t = new Grid(32, 24);
    drawSat(t, S, BASE_LOOK);
    const r = t.rotated([-35, 20, 75][f]!);
    for (let y = 0; y < 24; y++) for (let x = 0; x < 32; x++) g.set(x, y, r.get(x, y));
    // spin arrows: short arcs that move round the body
    const arcs = [[[3, 2], [4, 1], [5, 1]], [[26, 2], [27, 3], [27, 4]], [[3, 22], [4, 22], [5, 21]]][f]!;
    for (const [x, y] of arcs) g.under(x!, y!, "y");
  });

const dark = (v: Ver) =>
  frames(v, 2, 32, 24, (g, S, f) => {
    drawSat(g, S, BASE_LOOK, { dark: true });
    // power-off mark: a ring broken at the top with a bar, blinking
    if (f === 0) g.stamp([".f.f.", "f.f.f", "f.f.f", "f...f", ".fff."], 13, 18).set(15, 18, "f");
  });

const noSignal = (v: Ver) =>
  frames(v, 2, 32, 24, (g, S, f) => {
    drawSat(g, S, { wings: true, multi: false, patch: false });
    // broken arcs around the whip, and a cross
    if (f === 0) for (const [x, y] of [[11, 2], [10, 3], [10, 4], [19, 2], [20, 3], [20, 4]] as const) g.set(x, y, "y");
    g.stamp(["f...f", ".f.f.", "..f..", ".f.f.", "f...f"], 1, 0);
  });

const point = (v: Ver) =>
  frames(v, 2, 8, 8, (g, _S, f) => {
    g.rect(3, 3, 2, 2, "Y");
    if (f === 0) g.set(3, 1, "c").set(4, 1, "c").set(3, 6, "c").set(4, 6, "c").set(1, 3, "c").set(1, 4, "c").set(6, 3, "c").set(6, 4, "c");
    else g.set(2, 2, "c").set(5, 2, "c").set(2, 5, "c").set(5, 5, "c");
  }, { flat: true });

const passArc = (v: Ver) =>
  build(v, 64, 24, (g, S) => {
    // footprint on the ground: a flat ellipse, filled by a checker
    for (let y = 14; y < 24; y++) for (let x = 14; x < 50; x++) {
      const d = ((x + 0.5 - 32) / 17) ** 2 + ((y + 0.5 - 19.5) / 4.5) ** 2;
      if (d <= 1 && (S.dither ? (x + y) % 2 === 0 : true)) g.set(x, y, S.v === "C" ? "I" : "c");
    }
    g.ring(32, 19.5, 17, 4.5, "c");
    // the pass: dots along an arc, an arrow at the end
    for (let x = 0; x < 62; x += 3) {
      const u = (x - 31) / 31;
      g.set(x + 1, Math.round(21 - 19 * (1 - u * u)), "Y");
    }
    g.stamp(["Y.", "YY", "Y."], 61, 20);
  }, { flat: true });

const defs = { ...closeups, satTumbling: tumble, satDark: dark, satNoSignal: noSignal, satPoint: point, passArc };
export const { A, B, C } = versions(defs);
export type SatelliteKey = keyof typeof defs;
