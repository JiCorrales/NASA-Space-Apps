/**
 * The launch act in the cockpit window, as pixel art: a warm sky, stars, the curve of the planet, the
 * launch tower, the rocket climbing along its path with flames and exhaust, stage separation and falling
 * debris, the fairing halves, the shake at ignition, the dotted orbit, and the CubeSat leaving along it.
 * Adapted from Alexander's launch prototype.
 *
 * Drawn on the whole pixels of the same 640 x 360 grid as the space window (`scene/drawScene.ts`): the
 * browser scales the canvas up without smoothing. What does not move is painted once into an offscreen
 * canvas.
 *
 * Driven only by the `LaunchFrame`: the stage, the progress and the outcome all come from Unity. The scene
 * keeps visual state of its own (easing, particles, debris, the shake), and its randomness is cosmetic.
 * It draws no text.
 */
import type { LaunchFrame, LaunchStage } from "../../bridge/types";
import { STAGE_ORDER } from "./launchStatus";
import { BIGFLAME, FAIRING_HALVES, FLAME, SAT, SAT_OPEN, STAGE1, STAGE2, blit, paint, rocketBody, type Rows } from "./sprites";

type Ctx = CanvasRenderingContext2D;

/* ---------- Layout, in canvas pixels (640 x 360; the window is rows 18 to 202) ---------- */
const W = 640;
const WIN_BOTTOM = 204;
const CX = 320;
/** Planet radius and the row of the horizon at the centre. */
const R = 2200;
const GY0 = 168;
const CY = GY0 + R;
/** Row of the orbit at its highest point. */
const ORBIT_TOP = 50;
const RO = CY - ORBIT_TOP;
/** Launch pad, mission building and orbit insertion columns: each clear of the window struts. */
const XP = 300;
const XB = 246;
const XI = 540;

export const surfaceY = (x: number) => Math.round(CY - Math.sqrt(R * R - (x - CX) ** 2));
export const orbitY = (x: number) => Math.round(CY - Math.sqrt(RO * RO - (x - CX) ** 2));

/** Point and direction of the ascent at t (0 to 1): a curve from the pad up and over to the orbit. */
export function ascent(t: number) {
  const p0 = { x: XP, y: surfaceY(XP) - 3 };
  const p2 = { x: XI, y: orbitY(XI) };
  const p1 = { x: XP, y: p2.y + 4 };
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    dx: 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
    dy: 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
  };
}

/** Sky bands, dark at the top, warm at the horizon. */
const SKY = ["#04060d", "#0a1024", "#141a3a", "#241a52", "#3e2163", "#5e2766", "#8c3263", "#c24a5a", "#f27c4b"];
const Q = Math.PI / 8;
const snap = (a: number) => Math.round(a / Q) * Q;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const GREY = "#6b778a";

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}
const rnd = rng(11);
const STARS = Array.from({ length: 150 }, () => ({ x: Math.floor(rnd() * W), y: 18 + Math.floor(rnd() * 90), p: rnd() * 10, big: rnd() < 0.08 }));
const CLOUDS = Array.from({ length: 6 }, () => ({ x: rnd() * W, y: Math.round(118 + rnd() * 34), len: 14 + Math.floor(rnd() * 22), v: 1.5 + rnd() * 2.5 }));

function newCanvas(w: number, h: number): { cv: HTMLCanvasElement; c: Ctx } | null {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  let c: Ctx | null = null;
  try { c = cv.getContext("2d"); } catch { c = null; }
  return c ? { cv, c } : null;
}

/** Sky, Sun, ground, orbit and the tower: everything that does not move. Painted once. */
function paintBackdrop(c: Ctx): void {
  const bh = Math.ceil(GY0 / SKY.length);
  SKY.forEach((col, i) => { c.fillStyle = col; c.fillRect(0, i * bh, W, bh + 1); });
  // Dithered seams between the bands.
  for (let i = 1; i < SKY.length; i++) {
    c.fillStyle = SKY[i]!;
    for (let y = i * bh - 2; y < i * bh; y++) for (let x = y % 2; x < W; x += 2) c.fillRect(x, y, 1, 1);
  }
  c.fillRect(0, SKY.length * bh, W, WIN_BOTTOM);
  // The Sun, half under the horizon on the right.
  const sx0 = 590, sy0 = surfaceY(sx0) - 1, sr = 15;
  for (let y = -sr; y <= 0; y++) {
    if (y > -sr * 0.55 && (y & 3) === 0) continue;
    const hw = Math.round(Math.sqrt(sr * sr - y * y));
    c.fillStyle = y < -sr * 0.55 ? "#ffd23f" : "#ff9a3c";
    c.fillRect(sx0 - hw, sy0 + y, hw * 2, 1);
  }
  // The planet: a thin bright atmosphere line, land on the left, sea on the right.
  for (let x = 0; x < W; x++) {
    const top = surfaceY(x), land = x < W * 0.58;
    c.fillStyle = "#7fd8ff";
    if (x % 2 === 0) c.fillRect(x, top - 1, 1, 1);
    c.fillStyle = land ? "#62d394" : "#6fb8ff";
    c.fillRect(x, top, 1, 1);
    c.fillStyle = land ? "#2f8f5b" : "#2f6fd8";
    c.fillRect(x, top + 1, 1, 4);
    c.fillStyle = land ? "#1e5e42" : "#1c3f8f";
    c.fillRect(x, top + 5, 1, WIN_BOTTOM - top);
    c.fillStyle = land ? "#2f8f5b" : "#2f6fd8";
    c.fillRect(x, top + 5 + (x % 2), 1, 1);
  }
  // The orbit, dotted.
  c.fillStyle = "#48c6ff";
  for (let x = 0; x < W; x += 3) c.fillRect(x, orbitY(x), 1, 1);
  // Mission building beside the pad.
  const yb = surfaceY(XB);
  c.fillStyle = "#3a4458";
  c.fillRect(XB - 10, yb - 16, 20, 16);
  c.fillRect(XB + 10, yb - 9, 9, 9);
  c.fillStyle = "#8fa3b8";
  c.fillRect(XB - 11, yb - 17, 22, 1);
  c.fillRect(XB - 4, yb - 8, 8, 8);
  c.fillStyle = "#05070f";
  c.fillRect(XB - 3, yb - 7, 6, 7);
  // Launch pad and tower.
  const yp = surfaceY(XP);
  c.fillStyle = "#8fa3b8";
  c.fillRect(XP - 9, yp - 2, 18, 2);
  c.fillStyle = "#4b5a6b";
  c.fillRect(XP - 8, yp - 32, 2, 30);
  for (let k = 0; k < 10; k++) c.fillRect(XP - 8, yp - 30 + k * 3, 4, 1);
}

interface Particle { x: number; y: number; vx: number; vy: number; life: number; white?: boolean }
interface Debris { rows: Rows; x: number; y: number; vx: number; vy: number; rot: number; vr: number; life: number }

const burning = (s: LaunchStage) => s === "liftoff" || s === "maxq" || s === "staging" || s === "fairing" || s === "orbit";

/** Visual state of the launch window. One per canvas; `step` advances it, `draw` paints it. No React here. */
export class LaunchScene {
  t = 0;
  /** Displayed progress along the ascent, eased towards the frame's. */
  p = 0;
  /** Separation, 0 to 1: the upper stage drifts away. */
  sep = 0;
  /** How far the CubeSat has gone along the orbit, 0 to 1. */
  sat = 0;
  shake = 0;
  parts: Particle[] = [];
  debris: Debris[] = [];
  /** The vehicle broke up: its pieces are debris now. */
  broken = false;
  private last: LaunchFrame | null = null;
  private backdrop: HTMLCanvasElement | null | undefined;

  private reset() {
    this.p = 0; this.sep = 0; this.sat = 0; this.shake = 0; this.parts = []; this.debris = []; this.broken = false;
  }

  step(dt: number, l: LaunchFrame): void {
    dt = clamp(dt, 0, 0.1);
    this.t += dt;
    const prev = this.last;
    const at = STAGE_ORDER[l.stage];
    // A new attempt: the clock is counting again, or the progress went back.
    if (prev && ((at === 0 && STAGE_ORDER[prev.stage] > 0) || l.progress < prev.progress - 0.2)) this.reset();
    if (!prev || prev.stage !== l.stage) {
      const pose = ascent(clamp(this.p));
      const a = Math.atan2(pose.dy, pose.dx);
      if (l.stage === "liftoff") this.shake = 1.2;
      if (l.stage === "staging") {
        this.debris.push({ rows: STAGE1, x: pose.x - Math.cos(a) * 12, y: pose.y - Math.sin(a) * 12, vx: -Math.cos(a) * 4, vy: 2, rot: a + Math.PI / 2, vr: 0.9, life: 1 });
      }
      if (l.stage === "fairing") {
        [-1, 1].forEach((side, i) => this.debris.push({ rows: FAIRING_HALVES[i]!, x: pose.x + Math.cos(a) * 14, y: pose.y + Math.sin(a) * 14,
          vx: -Math.sin(a) * 10 * side, vy: Math.cos(a) * 10 * side, rot: a + Math.PI / 2, vr: 2.5 * side, life: 1 }));
      }
    }
    // The vehicle is lost during the climb: it breaks up where it is.
    const vehicleLost = l.outcome === "lost" && at >= 1 && at < STAGE_ORDER.separation;
    if (vehicleLost && !this.broken) {
      this.broken = true;
      const pose = ascent(clamp(this.p));
      const pieces: Rows[] = [rocketBody(l.vehicle, { booster: false, fairing: false }).slice(0, 6), STAGE2, ...(at < 3 ? [STAGE1] : []), ...FAIRING_HALVES];
      for (const rows of pieces) {
        this.debris.push({ rows, x: pose.x, y: pose.y - 10, vx: (Math.random() - 0.5) * 24, vy: -4 - Math.random() * 6,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6, life: 1.6 });
      }
      for (let i = 0; i < 60; i++) {
        const ang = Math.random() * Math.PI * 2, v = 6 + Math.random() * 22;
        this.parts.push({ x: pose.x, y: pose.y - 10, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, life: 1 });
      }
      this.shake = 0.5;
    }
    this.last = l;

    // Easing: the drawing catches up with the frame, it never runs ahead of it.
    const target = clamp(l.progress);
    this.p += (target - this.p) * Math.min(1, dt * 4);
    if (Math.abs(target - this.p) < 0.0005) this.p = target;
    if (at >= STAGE_ORDER.separation) this.sep = Math.min(1, this.sep + dt / 1.1);
    const satEnd = l.outcome === "lost" ? 0.55 : at >= STAGE_ORDER.deploy ? 1 : 0.15;
    if (at >= STAGE_ORDER.separation) this.sat = Math.min(satEnd, this.sat + dt * 0.14);
    this.shake = Math.max(0, this.shake - dt);

    // Exhaust while an engine burns, a white venting cloud while the vehicle waits on the pad.
    const pose = ascent(clamp(this.p));
    const ang = Math.atan2(pose.dy, pose.dx);
    if (burning(l.stage) && l.outcome === null && this.p < 0.999) {
      const pad = this.p < 0.05;
      const n = Math.ceil((pad ? 300 : 120) * dt);
      for (let i = 0; i < n; i++) {
        this.parts.push({ x: pose.x, y: pose.y + 2, vx: -Math.cos(ang) * 8 + (Math.random() - 0.5) * (pad ? 60 : 10),
          vy: -Math.sin(ang) * 8 + (Math.random() - 0.5) * 6, life: 1 });
      }
    } else if (at === 0 && l.outcome === null && Math.random() < dt * 6) {
      this.parts.push({ x: XP + (Math.random() < 0.5 ? -4 : 4), y: pose.y - 14 - Math.random() * 6, vx: (Math.random() - 0.5) * 6, vy: -3, life: 0.8, white: true });
    }
    this.parts = this.parts.filter((q) => (q.life -= dt * 0.8) > 0);
    for (const q of this.parts) {
      q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.97; q.vy = q.vy * 0.97 - 1.5 * dt;
    }
    this.debris = this.debris.filter((b) => (b.life -= dt * 0.35) > 0);
    for (const b of this.debris) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 9 * dt; b.rot += b.vr * dt;
    }
  }

  draw(c: Ctx, l: LaunchFrame, K: number): void {
    const t = this.t;
    c.setTransform(K * 2, 0, 0, K * 2, 0, 0);
    c.imageSmoothingEnabled = false;
    if (this.shake > 0) c.translate(Math.round((Math.random() - 0.5) * 2), Math.round((Math.random() - 0.5) * 2));

    if (this.backdrop === undefined) {
      const made = newCanvas(W, WIN_BOTTOM);
      if (made) paintBackdrop(made.c);
      this.backdrop = made?.cv ?? null;
    }
    if (this.backdrop) c.drawImage(this.backdrop, 0, 0);
    else paintBackdrop(c);

    for (const s of STARS) {
      const on = Math.sin(t * 2 + s.p) > -0.3;
      c.fillStyle = on ? "#eef1f6" : "#56657c";
      c.fillRect(s.x, s.y, 1, 1);
      if (s.big && on) {
        c.fillStyle = "#aab8d0";
        c.fillRect(s.x - 1, s.y, 1, 1); c.fillRect(s.x + 1, s.y, 1, 1); c.fillRect(s.x, s.y - 1, 1, 1); c.fillRect(s.x, s.y + 1, 1, 1);
      }
    }
    for (const cl of CLOUDS) {
      const x = Math.round(((cl.x + t * cl.v) % (W + 60)) - 30);
      c.fillStyle = "#ff8fb1";
      c.fillRect(x, cl.y, cl.len, 2);
      c.fillRect(x + 3, cl.y - 1, cl.len - 7, 1);
      c.fillStyle = "#c24a5a";
      c.fillRect(x + 1, cl.y + 2, cl.len - 2, 1);
    }

    const at = STAGE_ORDER[l.stage];
    const blink = Math.floor(t * 1.7) % 2 === 0;
    // Tower light: red while counting, amber blinking in a hold, steady red once scrubbed.
    const yp = surfaceY(XP);
    c.fillStyle = l.outcome === "scrubbed" ? "#ff6464" : l.stage === "hold" ? (blink ? "#f3c04f" : "#5e4a1a") : blink ? "#ff6464" : "#5e2a30";
    c.fillRect(XP - 8, yp - 34, 2, 2);
    // Lights in the mission building, busy while the count goes on.
    const yb = surfaceY(XB);
    c.fillStyle = at <= 1 && Math.floor(t * 3.3) % 2 ? "#ffd23f" : "#ff9a3c";
    for (let i = 0; i < 3; i++) c.fillRect(XB - 8 + i * 6, yb - 13, 3, 2);

    // The trail of the climb so far.
    if (this.p > 0) {
      for (let u = 0; u < this.p; u += 0.012) {
        const q = ascent(u);
        c.fillStyle = u > this.p - 0.08 && !this.broken ? "#ffd23f" : "#c24a5a";
        c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1);
      }
    }

    for (const q of this.parts) {
      c.fillStyle = q.white ? (q.life > 0.4 ? "#eef1f6" : "#8fa3b8")
        : q.life > 0.85 ? "#ffd23f" : q.life > 0.7 ? "#ff7a2e" : q.life > 0.35 ? "#c9c3e8" : "#6e66a0";
      const sz = q.life > 0.7 && !q.white ? 1 : 2;
      c.fillRect(Math.round(q.x), Math.round(q.y), sz, sz);
    }
    for (const b of this.debris) {
      if (b.life > 0.2 || Math.floor(t * 12) % 2) blit(c, b.rows, b.x, b.y, snap(b.rot), undefined, undefined, this.broken ? GREY : undefined);
    }

    // The rocket.
    const pose = ascent(clamp(this.p));
    const ang = Math.atan2(pose.dy, pose.dx);
    const rot = this.p <= 0.001 ? 0 : snap(ang + Math.PI / 2);
    const body = rocketBody(l.vehicle, { booster: at < STAGE_ORDER.staging, fairing: at < STAGE_ORDER.fairing });
    if (!this.broken) {
      const fire = burning(l.stage) && l.outcome === null && this.p < 0.999;
      const flame = fire ? (at < STAGE_ORDER.staging ? BIGFLAME : FLAME)[Math.floor(t * 11) % 2]! : [];
      let rx = pose.x, ry = pose.y;
      if (this.sep > 0) {
        rx += Math.cos(ang) * this.sep * 22;
        ry += Math.sin(ang) * this.sep * 22 - this.sep * 6;
      }
      if (this.sep < 1) blit(c, [...body, ...flame], rx, ry, rot, 3, body.length - 1);
      else if (Math.floor(t * 6) % 2) blit(c, body, rx, ry, rot, 3, body.length - 1, GREY);
    }

    // The CubeSat, leaving along the orbit after separation.
    if (at >= STAGE_ORDER.separation) {
      for (let x = XI; x < XI + this.sat * 80; x++) {
        c.fillStyle = "#ffd23f";
        c.fillRect(x, orbitY(x), 1, 1);
      }
      const sx = Math.round(XI + this.sat * 80), sy = orbitY(sx);
      const lost = l.outcome === "lost";
      if (lost) blit(c, SAT, sx, sy, Math.round(t * 6.7) * (Math.PI / 4), 1, 1, GREY);
      else {
        // The wings show open only once Unity says the deployment is done.
        const open = at > STAGE_ORDER.deploy || l.outcome === "ok";
        paint(c, open ? SAT_OPEN : SAT, sx - (open ? 4 : 1), sy - 1);
        if (Math.floor(t * 2.5) % 2) { c.fillStyle = "#62d394"; c.fillRect(sx, sy - 4, 1, 1); }
      }
    }
  }
}
