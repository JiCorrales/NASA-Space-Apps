/**
 * Composed 320 x 180 scenes, built only from the world art, so the owner sees each direction as a game and not
 * as loose sprites: the base with a module under construction, a damaged module, a crater, a sample site in each
 * of its three states, a storm front and the satellite's pass arc, by day, at night and under a medium dust storm.
 * The crew are plain 16 x 24 rectangles labelled by role: the characters come from the other half of the art.
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
export type SceneMode = "day" | "night" | "storm";
const mods = { terrain, base, satellite, hazards, vehicles } as const;

export function drawScene(ctx: CanvasRenderingContext2D, v: Ver, time: number, s: number, mode: SceneMode = "day"): void {
  const frame = (a: Art, speed = 220): Sprite => (Array.isArray(a) ? a[Math.floor(time / speed) % a.length]! : a);
  const T = mods.terrain[v] as Record<string, Art>, B = mods.base[v] as Record<string, Art>;
  const S = mods.satellite[v] as Record<string, Art>, H = mods.hazards[v] as Record<string, Art>;
  const V = mods.vehicles[v] as Record<string, Art>;
  const at = (a: Art, x: number, y: number, speed?: number) => paint(ctx, frame(a, speed), Math.round(x * s), Math.round(y * s), s);
  const night = mode === "night";
  const px = (x: number, y: number, col: string) => { ctx.fillStyle = col; ctx.fillRect(x * s, y * s, s, s); };

  // ground: the three shades mix freely
  const kinds = night
    ? ["nightRegolith2", "nightRegolith2", "nightRegolith2", "nightRegolith1", "nightRegolith1", "nightRegolith3", "nightRegolith3", "nightRipples", "nightRocky"]
    : ["regolith2", "regolith2", "regolith2", "regolith2", "regolith1", "regolith1", "regolith3", "regolith3", "ripples", "rocky"];
  for (let ty = 0; ty < 12; ty++) for (let tx = 0; tx < 20; tx++) at(T[kinds[Math.floor(hash(tx, ty, 9) * kinds.length)]!]!, tx * 16, ty * 16);
  // a round crater of 3 x 3 tiles
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) at(T[`crater3_${j}${i}`]!, 16 + i * 16, 124 + j * 16);
  at(B.sampleContainer!, 32, 140);
  for (let i = 0; i < 5; i++) at(T.channel!, 112 + i * 16, 164);
  for (const [x, y] of [[88, 36], [304, 84], [20, 100]] as const) at(T.boulder!, x, y);
  at(T.drift!, 148, 22); at(T.drift!, 70, 108);
  for (let i = 0; i < 5; i++) at(T.tracks!, 184, 96 + i * 16 - 2 * (i % 2));

  // sample sites in their three states, and the safe route
  at(T.siteUnknown!, 18, 20); at(T.siteFound!, 62, 30); at(T.siteSampled!, 112, 38);
  at(T.routeMarker!, 84, 68); at(T.routeMarker!, 98, 80);

  // the base: array, habitat, storage and antenna joined by conduits; a habitat under construction; a damaged array
  at(B.habitatFrame!, 20, 62); at(B.supplyCrate!, 70, 94); at(B.supplyCrate!, 18, 96);
  at(B.solarClean!, 100, 58); at(B.habitatPowered!, 148, 58); at(B.storage2!, 196, 58); at(B.antennaTransmit!, 232, 54);
  at(B.conduitCorner!, 112, 92);
  for (let x = 128; x < 224; x += 16) at(x === 160 ? B.conduitT! : B.conduitStraight!, x, 92);
  at(B.conduitCorner!, 224, 92);
  at(B.conduitStraight!, 160, 108);
  at(B.lander!, 136, 120);
  at(B.lightPole!, 84, 92); at(B.lightPole!, 236, 92);
  at(B.supplyCrate!, 200, 106); at(B.battery!, 216, 106); at(B.supplyCrate!, 200, 120);
  at(V.roverRight!, 188, 134);
  at(B.solarDamaged!, 246, 112); at(B.storageDamaged!, 214, 140);

  if (night) {
    // frost on the modules and the ground, then the dark, then the lit things on top of it
    at(H.frostModule!, 196, 58); at(H.frostModule!, 214, 140);
    for (const [x, y] of [[150, 100], [250, 70], [60, 140], [110, 52]] as const) at(H.frostTile!, x, y);
    ctx.fillStyle = "rgba(12,16,60,0.42)";
    ctx.fillRect(0, 0, SCENE_W * s, SCENE_H * s);
    const glow = (cx: number, cy: number, r: number) => {
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        const d = Math.hypot(x, y);
        if (d <= r && (x + y) % 2 === 0) px(cx + x, cy + y, d < r * 0.5 ? "rgba(255,214,110,0.2)" : "rgba(255,214,110,0.1)");
      }
    };
    glow(88, 96, 12); glow(240, 96, 12); glow(172, 96, 18);
    at(B.habitatPowered!, 148, 58); at(B.lightPole!, 84, 92); at(B.lightPole!, 236, 92);
  }

  // the crew: placeholders for the characters of the other half
  const crew: [string, string, number, number][] = [["CMD", "#4a7fd0", 124, 98], ["ENG", "#e0a030", 172, 100], ["SCI", "#58c088", 40, 66], ["COM", "#c068c0", 236, 118]];
  ctx.font = `${Math.round(5 * s)}px monospace`;
  ctx.textAlign = "center";
  for (const [label, col, x, y] of crew) {
    ctx.fillStyle = "#05070f"; ctx.fillRect((x - 1) * s, (y - 1) * s, 18 * s, 26 * s);
    ctx.fillStyle = col; ctx.fillRect(x * s, y * s, 16 * s, 24 * s);
    ctx.fillStyle = "#fff"; ctx.fillText(label, (x + 8) * s, (y + 14) * s);
  }

  // weather: the front arrives from the right (the sprite is heavy on its left, so it is mirrored)
  ctx.save();
  ctx.translate(SCENE_W * s, 0); ctx.scale(-1, 1);
  for (let y = 0; y < SCENE_H; y += 32) paint(ctx, frame(H.stormFront!, 260), 0, y * s, s);
  ctx.restore();
  if (mode === "storm") for (let y = 0; y < SCENE_H; y += 32) for (let x = 0; x < SCENE_W; x += 32) paint(ctx, frame(H.dustStorm2!, 200), x * s, y * s, s);
  else for (let y = 0; y < SCENE_H; y += 32) for (let x = 256; x < SCENE_W; x += 32) paint(ctx, frame(H.dustStorm1!, 260), x * s, y * s, s);

  // the satellite's pass: an arc with its footprint, and the satellite moving along it
  const sx = 70, sy = -6, ks = 3;
  at(S.passArc!, sx, sy);
  const u = (time / 9000) % 1, ax = 2 + u * 58;
  const k = (ax - 31) / 31, ay = 21 - 19 * (1 - k * k);
  paint(ctx, frame(S.satPoint!, 300), Math.round((sx + ax * ks - 8) * s), Math.round((sy + ay * ks - 8) * s), 2 * s);
}
