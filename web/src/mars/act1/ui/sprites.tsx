// Version B of the art only (the owner's choice): characters, role gear and badges, vehicles.
import { useEffect, useRef } from "react";
import * as characters from "../../art/characters";
import * as gear from "../../art/gear";
import * as vehicles from "../../art/vehicles";
import { paint, spriteSize, type Art, type Sprite } from "../../art/paint";
import type { Look, Role } from "../types";

export const CHARS = characters.B;
export const GEAR = gear.B;
export const VEHICLES = vehicles.B;

export const framesOf = (a: Art): Sprite[] => (Array.isArray(a) ? a : [a]);

/** Draws layered sprites (a character, then its gear) on one small canvas, whole pixels. */
export function SpriteCanvas({ layers, scale, label, className }: { layers: Sprite[]; scale: number; label?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const w = Math.max(...layers.map((s) => spriteSize(s).w));
  const h = Math.max(...layers.map((s) => spriteSize(s).h));
  useEffect(() => {
    let c: CanvasRenderingContext2D | null = null;
    try { c = ref.current?.getContext("2d") ?? null; } catch { c = null; }
    if (!c) return;
    c.clearRect(0, 0, w * scale, h * scale);
    for (const s of layers) paint(c, s, 0, 0, scale);
  });
  return (
    <canvas ref={ref} className={className} width={w * scale} height={h * scale} role={label ? "img" : undefined}
      aria-label={label} aria-hidden={label ? undefined : true} style={{ imageRendering: "pixelated" }} />
  );
}

/** A crew member as drawn in setup and on the board: the look's body with the role's gear on top. */
export function Crewman({ look, role, scale = 5, label }: { look: Look; role: Role; scale?: number; label?: string }) {
  return <SpriteCanvas layers={[CHARS[look].poses.stand_down[0]!, GEAR[role].overlays[look].stand_down[0]!]} scale={scale} label={label} />;
}

export const Badge = ({ role, scale = 3 }: { role: Role; scale?: number }) => <SpriteCanvas layers={[GEAR[role].badge]} scale={scale} />;
