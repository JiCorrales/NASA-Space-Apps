/**
 * A composed 320 x 180 scene per art direction, built only from the world art, so the owner sees each
 * direction as a game and not as loose sprites. The crew are plain 16 x 24 rectangles labelled by role:
 * the characters come from the other half of the art.
 */
import type { Art, Sprite } from "./paint";
import { paint } from "./paint";
import type { Ver } from "./marsPalette";
import * as terrain from "./terrain";
import * as base from "./base";
import * as satellite from "./satellite";
import * as hazards from "./hazards";
import * as vehicles from "./vehicles";
import { hash } from "./worldkit";

export const SCENE_W = 320;
export const SCENE_H = 180;
const mods = { terrain, base, satellite, hazards, vehicles } as const;

export function drawScene(ctx: CanvasRenderingContext2D, v: Ver, time: number, s: number): void {
  const frame = (a: Art, speed = 220): Sprite => (Array.isArray(a) ? a[Math.floor(time / speed) % a.length]! : a);
  const T = mods.terrain[v] as Record<string, Art>, B = mods.base[v] as Record<string, Art>;
  const S = mods.satellite[v] as Record<string, Art>, H = mods.hazards[v] as Record<string, Art>;
  const V = mods.vehicles[v] as Record<string, Art>;
  const at = (a: Art, x: number, y: number, speed?: number) => paint(ctx, frame(a, speed), Math.round(x * s), Math.round(y * s), s);

  // ground
  const kinds = ["regolith2", "regolith2", "regolith2", "regolith2", "regolith2", "regolith2", "regolith2", "regolith1", "regolith3", "rocky", "rocky", "ripples"];
  for (let ty = 0; ty < 12; ty++) for (let tx = 0; tx < 20; tx++) at(T[kinds[Math.floor(hash(tx, ty, 9) * kinds.length)]!]!, tx * 16, ty * 16);
  // a crater, 4 x 3 tiles, from corners, edges and floor
  const crater = [["NW", "N", "N", "NE"], ["W", "Floor", "Floor", "E"], ["SW", "S", "S", "SE"]];
  crater.forEach((row, j) => row.forEach((p, i) => at(T[`crater${p}`]!, 16 + i * 16, 112 + j * 16)));
  at(B.sampleContainer!, 38, 130);
  // dry channel along the bottom right, a boulder, drifts, tracks
  for (let i = 0; i < 5; i++) at(T.channel!, 96 + i * 16, 164);
  for (const [x, y] of [[88, 36], [304, 110], [20, 60]] as const) at(T.boulder!, x, y);
  at(T.drift!, 120, 20); at(T.drift!, 56, 90);
  for (let i = 0; i < 5; i++) at(T.tracks!, 190, 96 + i * 16 - 2 * (i % 2));

  // sample sites and the safe route
  at(T.siteFound!, 60, 30); at(T.siteUnknown!, 20, 20); at(T.siteSampled!, 100, 104);
  at(T.routeMarker!, 80, 66); at(T.routeMarker!, 100, 80);

  // the base: array, habitat, storage, antenna, with conduits joining them
  at(B.solarClean!, 100, 58); at(B.habitatPowered!, 148, 58); at(B.storage2!, 196, 58); at(B.antennaTransmit!, 232, 54);
  at(B.conduitCorner!, 112, 92);
  for (let x = 128; x < 224; x += 16) at(x === 160 ? B.conduitT! : B.conduitStraight!, x, 92);
  at(B.conduitCorner!, 224, 92);
  at(B.conduitStraight!, 160, 108);
  at(B.lander!, 136, 120);
  at(B.lightPole!, 84, 92); at(B.lightPole!, 236, 92);
  at(B.supplyCrate!, 200, 106); at(B.battery!, 216, 106); at(B.supplyCrate!, 200, 120);
  at(V.roverRight!, 188, 130);

  // the crew: placeholders for the characters of the other half
  const crew: [string, string, number, number][] = [["CMD", "#4a7fd0", 124, 98], ["ENG", "#e0a030", 186, 96], ["SCI", "#58c088", 70, 100], ["COM", "#c068c0", 252, 98]];
  ctx.font = `${Math.round(5 * s)}px monospace`;
  ctx.textAlign = "center";
  for (const [label, col, x, y] of crew) {
    ctx.fillStyle = "#05070f"; ctx.fillRect((x - 1) * s, (y - 1) * s, 18 * s, 26 * s);
    ctx.fillStyle = col; ctx.fillRect(x * s, y * s, 16 * s, 24 * s);
    ctx.fillStyle = "#fff"; ctx.fillText(label, (x + 8) * s, (y + 14) * s);
  }

  // weather: a storm front arriving from the right edge (the sprite is heavy on its left, so it is mirrored)
  ctx.save();
  ctx.translate(SCENE_W * s, 0); ctx.scale(-1, 1);
  for (let y = 0; y < SCENE_H; y += 32) paint(ctx, frame(H.stormFront!, 260), 0, y * s, s);
  ctx.restore();
  for (let y = 0; y < SCENE_H; y += 32) for (let x = 224; x < SCENE_W; x += 32) paint(ctx, frame(H.dustStorm1!, 260), x * s, y * s, s);

  // the satellite's pass: an arc with its footprint, and the satellite itself moving along it
  const sx = 70, sy = -6, ks = 3;
  at(S.passArc!, sx, sy);
  const u = (time / 9000) % 1, px = 2 + u * 58;
  const k = (px - 31) / 31, py = 21 - 19 * (1 - k * k);
  paint(ctx, frame(S.satPoint!, 300), Math.round((sx + px * ks - 8) * s), Math.round((sy + py * ks - 8) * s), 2 * s);
}
