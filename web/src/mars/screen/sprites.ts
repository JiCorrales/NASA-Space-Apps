// Version B of the art, the owner's choice, and the helpers to draw it: sprites become small offscreen canvases once
// (a 16 x 16 tile is ~100 rectangles to paint, far too many per frame) and are then blitted with drawImage.
import type { Art, Sprite } from "../art/paint";
import { paint } from "../art/paint";
import * as terrain from "../art/terrain";
import * as base from "../art/base";
import * as satellite from "../art/satellite";
import * as hazards from "../art/hazards";
import * as icons from "../art/icons";
import * as extras from "../art/extras";
import * as characters from "../art/characters";
import * as gear from "../art/gear";
import type { LookId } from "../art/characters";
import type { Look, Role } from "../types";

export const T = terrain.B as Record<string, Art>;
export const BASE_ART = base.B as Record<string, Art>;
export const SAT = satellite.B as Record<string, Art>;
export const HAZ = hazards.B as Record<string, Art>;
export const ICON = icons.B as unknown as Record<string, Sprite>;
export const EXTRA = extras.B as unknown as Record<string, Sprite[]>;
export const CHARS = characters.B;
export const GEAR = gear.B;

/** The rules' looks are colour names; the art's are body shapes with a trim colour. */
export const LOOK_ART: Record<Look, LookId> = { amber: "broad", teal: "tall", violet: "compact", coral: "round" };
export const ROLE_ART: Record<Role, "commander" | "engineer" | "scientist" | "comms"> = { commander: "commander", engineer: "engineer", scientist: "scientist", comms: "comms" };

/** `t` is in milliseconds. */
export const pickFrame = (a: Art, t: number, speed = 220): Sprite => (Array.isArray(a) ? a[Math.abs(Math.floor(t / speed) || 0) % a.length]! : a);

const bmpCache = new WeakMap<Sprite, HTMLCanvasElement | null>();
/** The sprite as a canvas, or null where there is no 2D canvas (tests without one). */
export function bmp(s: Sprite): HTMLCanvasElement | null {
  const hit = bmpCache.get(s);
  if (hit !== undefined) return hit;
  let out: HTMLCanvasElement | null = null;
  try {
    const w = Math.max(1, ...s.rows.map((r) => r.length));
    const c = document.createElement("canvas");
    c.width = w; c.height = s.rows.length;
    const ctx = c.getContext("2d");
    if (ctx) { paint(ctx, s, 0, 0, 1); out = c; }
  } catch { out = null; }
  bmpCache.set(s, out);
  return out;
}

const urlCache = new Map<Sprite, string>();
/** A data URL of the sprite for `<img>` (icons, portraits); empty where canvas is missing. */
export function spriteUrl(s: Sprite): string {
  const hit = urlCache.get(s);
  if (hit !== undefined) return hit;
  const c = bmp(s);
  let url = "";
  try { url = c ? c.toDataURL() : ""; } catch { url = ""; }
  urlCache.set(s, url);
  return url;
}
