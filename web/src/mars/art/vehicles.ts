/**
 * Vehicles and travel in three art directions: the crew's transfer ship in cruise, Mars growing in three
 * steps, the descent with its engine burning, the touchdown dust, and a small supply rover in four directions.
 */
import { Grid, bayer, build, frames, hash, tnoise, versions, type Style, type Ver } from "./worldkit";

function ship(g: Grid, S: Style, f: number): void {
  // solar wings above and below the stack, flying to the right
  for (const y of [0, 18]) {
    g.rect(14, y, 30, 6, "m").rect(15, y + 1, 28, 4, "p");
    for (let x = 18; x < 43; x += 6) g.rect(x, y + 1, 1, 4, "P");
    g.rect(28, y < 10 ? 6 : 17, 2, y < 10 ? 2 : 1, "n");
  }
  g.rect(18, 7, 28, 10, "h").rect(18, 7, 28, 3, "l").rect(18, 14, 28, 3, "s"); // service module and crew cabin
  g.rect(31, 7, 1, 10, "m").rect(18, 11, 28, 1, "a");
  g.ell(48, 12, 10, 6, "h").rect(48, 6, 10, 12, ".").ell(50, 12, 7, 5, "s").ell(50, 11, 6, 4, "h");
  g.rect(50, 10, 3, 3, "g").set(50, 10, S.v === "A" ? "G" : "P");
  g.rect(10, 8, 8, 8, "n").rect(6, 6, 5, 12, "m").rect(6, 6, 5, 1, "l"); // engine bell
  g.rect(56, 11, 6, 2, "n"); // docking probe
  if (f === 0) g.stamp([".yy", "yyy", "yyy", ".yy"], 3, 9); else g.stamp(["y", "yy", "yy", "y"], 4, 9);
  if (S.rich) g.rect(19, 7, 26, 1, "l");
}

function marsDisc(g: Grid, S: Style, d: number): void {
  const r = d / 2;
  for (let y = 0; y < d; y++) for (let x = 0; x < d; x++) {
    const dx = x + 0.5 - r, dy = y + 0.5 - r;
    if (dx * dx + dy * dy > r * r) continue;
    const n = tnoise(x * 64 / d, y * 64 / d, 64, 64, 16, 7) * 0.7 + tnoise(x * 64 / d, y * 64 / d, 64, 64, 8, 3) * 0.3;
    let c = n > 0.6 ? "2" : n < 0.35 ? "3" : "1";
    if (dy < -r * 0.78 && Math.abs(dx) < r * 0.5) c = "i"; // polar cap
    const light = -(dx + dy) / (r * 1.41); // 1 at the top left, -1 at the bottom right
    const cut = S.dither ? light + (bayer(x, y) - 0.5) * 0.25 : light;
    if (cut < -0.25 && c !== "i") c = c === "3" ? "1" : c === "1" ? "2" : "4";
    else if (S.rich && cut > 0.6 && c === "1") c = "3";
    g.set(x, y, c);
  }
}

function descent(g: Grid, S: Style, f: number): void {
  // capsule on top, legs out, engine bell, then the flame
  if (S.v !== "A") g.ell(16, 40, 9, 1.5, "x");
  g.line(9, 16, 3, 27, "n").line(10, 16, 4, 27, "n").line(23, 16, 29, 27, "n").line(22, 16, 28, 27, "n");
  g.rect(1, 27, 6, 2, "m").rect(25, 27, 6, 2, "m");
  g.rect(8, 3, 16, 14, "h").rect(8, 3, 16, 3, "l").rect(8, 12, 16, 5, "s");
  g.rect(10, 1, 12, 2, "h");
  g.rect(12, 7, 8, 4, "n").rect(13, 8, 6, 2, "g").set(14, 8, "G").set(17, 8, "G");
  g.rect(8, 14, 16, 1, "a");
  g.rect(12, 17, 8, 4, "n").rect(13, 21, 6, 2, "m").rect(14, 23, 4, 1, "n"); // engine
  const len = f === 0 ? 20 : 14;
  for (let y = 0; y < len; y++) {
    const w = Math.max(1, 3 - Math.floor(y / 6));
    g.rect(16 - w, 24 + y, w * 2, 1, S.rich ? (y < 4 ? "Y" : y < 10 ? "y" : "a") : y < 12 ? "y" : "a");
  }
  if (f === 0) g.set(12, 36, "a").set(19, 37, "a"); else g.set(13, 31, "y").set(18, 32, "y");
}

function touchdown(g: Grid, S: Style, f: number): void {
  const r = [3, 5, 6][f]!, n = [3, 5, 6][f]!;
  for (let i = 0; i < n; i++) {
    const spread = f === 0 ? 8 : f === 1 ? 17 : 21;
    const cx = 24 + (i / (n - 1 || 1) - 0.5) * 2 * spread, cy = 11 - (f === 2 ? 1 : 0) - (i % 2) * 2;
    g.ell(cx, cy, r - (i % 2), (r - (i % 2)) * 0.7, "5");
    g.ell(cx + 1, cy + 1, r - 1 - (i % 2), (r - 1 - (i % 2)) * 0.6, "3");
  }
  if (f === 2) for (let i = 0; i < 14; i++) if (!S.dither || i % 2 === 0) g.set(Math.floor(hash(i, 1, 2) * 48), 3 + Math.floor(hash(i, 2, 2) * 11), "3");
}

function rover(g: Grid, S: Style, dir: "right" | "left" | "up" | "down"): void {
  const wheel = (x: number, y: number, w = 4, h = 4) => g.rect(x, y, w, h, "n").rect(x + 1, y + 1, w - 2, h - 2, "m");
  if (dir === "right" || dir === "left") {
    const t = new Grid(16, 16);
    if (S.v !== "A") t.ell(8, 14, 7, 1.6, "x");
    for (const x of [1, 6, 11]) wheel(x, 10);
    t.rect(1, 7, 14, 4, "h");
    t.rect(1, 7, 14, 1, "l");
    t.rect(1, 3, 7, 4, "s").rect(2, 4, 3, 3, "a").set(2, 4, "Y"); // cargo crate
    t.rect(9, 3, 6, 5, "h").rect(11, 4, 3, 3, "g").set(11, 4, "P");
    t.rect(3, 0, 1, 3, "m").set(3, 0, "a");
    // draw wheels over the body
    for (const x of [1, 6, 11]) { t.rect(x, 10, 4, 4, "n"); t.rect(x + 1, 11, 2, 2, "m"); }
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) g.set(dir === "right" ? x : 15 - x, y, t.get(x, y));
    return;
  }
  const down = dir === "down";
  if (S.v !== "A") g.ell(8, 14, 6, 1.6, "x");
  g.rect(0, 3, 3, 5, "n").rect(13, 3, 3, 5, "n").rect(0, 9, 3, 5, "n").rect(13, 9, 3, 5, "n");
  g.rect(1, 4, 1, 3, "m").rect(14, 4, 1, 3, "m").rect(1, 10, 1, 3, "m").rect(14, 10, 1, 3, "m");
  g.rect(3, 2, 10, 12, "h").rect(3, 2, 10, 2, "l");
  if (down) {
    g.rect(4, 8, 8, 5, "g").rect(5, 9, 6, 2, "P").set(4, 13, "y").set(11, 13, "y"); // cab seen from the front, headlights
    g.rect(4, 3, 8, 4, "s").rect(5, 4, 3, 2, "a");
  } else {
    g.rect(4, 2, 8, 5, "s").rect(5, 3, 3, 3, "a").set(5, 3, "Y").set(11, 3, "f").set(4, 3, "f"); // cargo and rear lights
    g.rect(4, 8, 8, 5, "h").rect(5, 9, 6, 3, "g");
    g.rect(7, 0, 1, 2, "m").set(7, 0, "a");
  }
}

const defs = {
  transferShip: (v: Ver) => frames(v, 2, 64, 24, ship),
  marsStep1: (v: Ver) => build(v, 16, 16, (g, S) => marsDisc(g, S, 16), { flat: true }),
  marsStep2: (v: Ver) => build(v, 32, 32, (g, S) => marsDisc(g, S, 32), { flat: true }),
  marsStep3: (v: Ver) => build(v, 64, 64, (g, S) => marsDisc(g, S, 64), { flat: true }),
  descent: (v: Ver) => frames(v, 2, 32, 48, descent),
  touchdownDust: (v: Ver) => frames(v, 3, 48, 16, touchdown, { flat: true }),
  roverRight: (v: Ver) => build(v, 16, 16, (g, S) => rover(g, S, "right")),
  roverLeft: (v: Ver) => build(v, 16, 16, (g, S) => rover(g, S, "left")),
  roverUp: (v: Ver) => build(v, 16, 16, (g, S) => rover(g, S, "up")),
  roverDown: (v: Ver) => build(v, 16, 16, (g, S) => rover(g, S, "down")),
};
export const { A, B, C } = versions(defs);
export type VehicleKey = keyof typeof defs;
