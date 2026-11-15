// The cruise and the arrival as pixel scenes. Drawn on a 320 x 180 grid and scaled up without smoothing; the sprites
// are version B of the art. Every number shown comes from `progress` (0 to 1), which the caller owns.
import { useEffect, useRef } from "react";
import { paint, spriteSize } from "../../art/paint";
import { VEHICLES, framesOf } from "./sprites";
import * as satellite from "../../art/satellite";

const W = 320, H = 180;
const SAT = satellite.B;

type Draw = (c: CanvasRenderingContext2D, p: number, t: number) => void;

/** A canvas redrawn every animation frame from `draw(progress, seconds)`; `still` draws one frame (reduced motion). */
function Scene({ draw, progress, label }: { draw: Draw; progress: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const p = useRef(progress);
  p.current = progress;
  useEffect(() => {
    let c: CanvasRenderingContext2D | null = null;
    try { c = ref.current?.getContext("2d") ?? null; } catch { c = null; }
    if (!c) return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => { c!.setTransform(1, 0, 0, 1, 0, 0); draw(c!, p.current, (now - t0) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);
  return <canvas ref={ref} className="a1-scene" width={W} height={H} role="img" aria-label={label} />;
}

/** Stars that stay put: positions from a fixed hash, a few twinkle. */
function stars(c: CanvasRenderingContext2D, t: number, drift = 0) {
  c.fillStyle = "#05070f"; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    const x = ((i * 97 + 31) % W - drift * (1 + (i % 3)) + W * 4) % W, y = (i * 53 + 17) % H;
    c.fillStyle = (i + Math.floor(t * 2)) % 7 === 0 ? "#8394ab" : i % 4 === 0 ? "#e4ecf5" : "#2b3852";
    c.fillRect(Math.floor(x), y, 1, 1);
  }
}

const mars = [VEHICLES.marsStep1, VEHICLES.marsStep2, VEHICLES.marsStep3].map((a) => framesOf(a)[0]!);
const ship = framesOf(VEHICLES.transferShip);

/** The crossing: the transfer ship flies right; Earth shrinks behind it and Mars grows ahead, in three steps. */
const drawCruise: Draw = (c, p, t) => {
  stars(c, t, p * 40);
  // Earth, a blue dot that shrinks
  const er = Math.max(2, Math.round(14 * (1 - p)));
  c.fillStyle = "#2b5fae"; c.beginPath(); c.arc(30, 120, er, 0, 7); c.fill();
  c.fillStyle = "#62d394"; c.fillRect(30 - Math.floor(er / 3), 120 - Math.floor(er / 3), Math.ceil(er / 2), Math.ceil(er / 3));
  // Mars grows
  const m = p < 0.34 ? mars[0]! : p < 0.67 ? mars[1]! : mars[2]!;
  const ms = spriteSize(m).w;
  paint(c, m, Math.round(W - 40 - ms), Math.round(90 - ms / 2), 1);
  // the ship, bobbing
  const s = ship[Math.floor(t * 3) % ship.length]!;
  const sz = spriteSize(s);
  paint(c, s, Math.round(W / 2 - sz.w / 2 - 20 + p * 30), Math.round(70 + Math.sin(t * 1.5) * 2), 1);
};

export function CruiseScene({ progress }: { progress: number }) {
  return <Scene draw={drawCruise} progress={progress} label="The crew's transfer ship crossing from Earth to Mars" />;
}

/** Arrival, then landing. Progress 0 to 0.45: the satellite is captured into orbit. Then the lander descends. */
const GROUND = 150;
const drawArrival: Draw = (c, p, t) => {
  if (p < 0.45) {
    const q = p / 0.45;
    stars(c, t);
    const big = framesOf(VEHICLES.marsStep3)[0]!;
    const sz = spriteSize(big).w;
    const S = 2;
    const cx = W / 2, cy = 92;
    paint(c, big, Math.round(cx - (sz * S) / 2), Math.round(cy - (sz * S) / 2), S);
    // the orbit, dotted, and the satellite on it: it arrives from the left and settles into the ellipse
    const rx = 100, ry = 30;
    c.fillStyle = "#86dcf2";
    for (let a = 0; a < 6.28; a += 0.12) c.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
    const ang = Math.PI + q * Math.PI * 2.4;
    const approach = Math.max(0, 1 - q * 2.2);
    const sat = SAT.satPoint ? framesOf(SAT.satPoint)[0]! : framesOf(SAT.passArc)[0]!;
    const ss = spriteSize(sat);
    const sx = cx + Math.cos(ang) * (rx + approach * 120) - ss.w / 2, sy = cy + Math.sin(ang) * (ry + approach * 30) - ss.h / 2;
    paint(c, sat, Math.round(sx), Math.round(sy), 1);
    return;
  }
  // landing: dusk-orange sky over a flat plain; the lander comes down on its engine
  const q = (p - 0.45) / 0.55;
  const g = c.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, "#1a1426"); g.addColorStop(1, "#7a3b24");
  c.fillStyle = g; c.fillRect(0, 0, W, GROUND);
  for (let i = 0; i < 40; i++) { c.fillStyle = "#e4ecf5"; c.fillRect((i * 83) % W, (i * 29) % 60, 1, 1); }
  c.fillStyle = "#8f3a22"; c.fillRect(0, GROUND, W, H - GROUND);
  c.fillStyle = "#6e2a1a";
  for (let x = 0; x < W; x += 10) c.fillRect(x, GROUND + ((x * 7) % 25) + 4, 6, 2);
  const dust = framesOf(VEHICLES.touchdownDust);
  const lander = framesOf(VEHICLES.descent);
  const ls = spriteSize(lander[0]!);
  const down = Math.min(1, q / 0.8);
  const ease = 1 - (1 - down) * (1 - down);
  const ly = Math.round(Math.min(GROUND - ls.h + 4, -ls.h + (GROUND + 4) * ease));
  const lx = Math.round(W / 2 - ls.w / 2);
  paint(c, lander[down < 1 ? Math.floor(t * 8) % lander.length : 0]!, lx, ly, 1);
  if (down >= 0.85) {
    const d = dust[Math.min(dust.length - 1, Math.floor(((down - 0.85) / 0.15 + (q > 0.8 ? (q - 0.8) / 0.2 : 0)) * dust.length))]!;
    const ds = spriteSize(d);
    paint(c, d, Math.round(W / 2 - ds.w / 2), GROUND - ds.h + 6, 1);
  }
};

export function ArrivalScene({ progress }: { progress: number }) {
  return <Scene draw={drawArrival} progress={progress} label={progress < 0.45 ? "The satellite is captured into orbit around Mars" : "The crew's lander descends to the surface"} />;
}
