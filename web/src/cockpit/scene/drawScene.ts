/**
 * Canvas drawing for the cockpit window: stars, the Earth's horizon, the CubeSat, the markers,
 * the camera cone, the contact link and the solar storm.
 *
 * Ported from the team's reference animation (`admin-cockpit.html`). The reference drove every
 * value from a script clock; here the drawing reads a `SceneInput` built from the latest `SimFrame`,
 * and keeps only visual state of its own (scroll angle, easing, flash timers). It never decides a
 * simulation outcome: whether an image is captured, a link is up or a problem is active all come
 * from the frame.
 */

export const STAGE_W = 1280;
export const STAGE_H = 720;
const WINDOW_BOTTOM = 430;
const TAU = Math.PI * 2;

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** What the scene needs from the frame. Built by `sceneInputFromFrame`. */
export interface SceneInput {
  /** Mission week, 1 to 52 (0 before launch). Drives the seasonal colour of the target region. */
  week: number;
  speed: 'detail' | 'fast' | 'paused';
  capturing: boolean;
  contact: boolean;
  pointingError: number;
  /** Problems currently active, from `alert.code`. */
  storm: boolean;
  stationDown: boolean;
  attitudeFault: boolean;
  anyAlert: boolean;
  cameraPaused: boolean;
  safeMode: boolean;
  /** Week number shown in the capture label. */
  imageNumber: number;
  /** True once the report is showing: the scene keeps drifting slowly. */
  ended: boolean;
}

export const IDLE_SCENE: SceneInput = {
  week: 0,
  speed: 'paused',
  capturing: false,
  contact: false,
  pointingError: 0.2,
  storm: false,
  stationDown: false,
  attitudeFault: false,
  anyAlert: false,
  cameraPaused: false,
  safeMode: false,
  imageNumber: 0,
  ended: false,
};

/* ---------- Orbit geometry (stage pixels), as in the reference ---------- */
const CX = 640;
const R = 1500;
const LIMB = 268;
const CY = LIMB + R;
const P = 1.2; // angular period of the surface pattern
const AS = 0.05; // satellite angle
const RATE = 0.025; // surface scroll rate in detail speed, radians per second
const AG = 0.1125; // ground station offset from the target region
const wrap = (a: number) => a - P * Math.round(a / P);
const pt = (a: number, d: number): [number, number] => [CX + (R - d) * Math.sin(a), CY - (R - d) * Math.cos(a)];

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

interface Blob {
  a: number;
  d: number;
  w: number;
  h: number;
  tilt: number;
}

/* ---------- Scene content, generated once from a fixed seed ---------- */
const rnd = rng(7);
const STARS = Array.from({ length: 230 }, () => ({
  x: rnd() * STAGE_W,
  y: rnd() * 420,
  r: rnd() < 0.12 ? 2 : 1.2,
  a: 0.35 + rnd() * 0.65,
  v: 1.5 + rnd() * 4,
  tw: 0.6 + rnd() * 2,
  ph: rnd() * 6,
}));
const LANDCOL = ['#4a8f63', '#5f9566', '#7d9a62', '#8f8c5c'];
const LAND: (Blob & { col: string })[] = [];
(
  [
    [-0.5, 70],
    [-0.36, 110],
    [-0.2, 46],
    [AG, 45],
    [0.3, 96],
    [0.46, 60],
  ] as const
).forEach(([a, d], i) => {
  for (let k = 0; k < 4; k++) {
    const dd = clamp(d + (rnd() - 0.5) * 44, 14, 140);
    const f = 0.35 + (0.65 * dd) / 140;
    LAND.push({
      a: a + (rnd() - 0.5) * 0.07,
      d: dd,
      w: 60 + rnd() * 90,
      h: (16 + rnd() * 26) * f,
      tilt: (rnd() - 0.5) * 0.3,
      col: LANDCOL[(i + k) % 4]!,
    });
  }
});
const TARGET: Blob[] = [
  { a: 0, d: 78, w: 128, h: 34, tilt: 0 },
  { a: -0.018, d: 66, w: 70, h: 22, tilt: 0.1 },
  { a: 0.02, d: 90, w: 80, h: 24, tilt: -0.1 },
  { a: 0.008, d: 70, w: 60, h: 18, tilt: 0 },
];
const CLOUDS = Array.from({ length: 11 }, () => ({
  a: (rnd() - 0.5) * P,
  d: 12 + rnd() * 120,
  w: 70 + rnd() * 110,
  h: 6 + rnd() * 12,
  tilt: (rnd() - 0.5) * 0.2,
  al: 0.14 + rnd() * 0.16,
}));
const STREAKS = Array.from({ length: 70 }, () => ({
  x: rnd() * 1500,
  y: rnd() * 470,
  v: 0.7 + rnd() * 0.6,
  a: 0.4 + rnd() * 0.6,
}));

const FONT_D = '600 12px "Chakra Petch","Segoe UI",system-ui,sans-serif';
const FONT_M = '500 11px "IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace';

/** Seasonal colour of the target region: green early in the year, ochre late. Symbolic only. */
export function seasonColour(week: number): string {
  const s = clamp((week - 1) / 51);
  return `rgb(${Math.round(lerp(63, 186, s))},${Math.round(lerp(155, 148, s))},${Math.round(lerp(99, 85, s))})`;
}

/**
 * Visual state of the window. One instance per canvas; `step` advances it with wall-clock time
 * and `draw` paints it. Nothing here touches React.
 */
export class CockpitScene {
  t = 0;
  /** Surface rotation. */
  rot = AS;
  storm = 0;
  flash = -1;
  private wasCapturing = false;
  private capLabel = 0;

  step(dt: number, s: SceneInput): void {
    dt = Math.min(dt, 0.1);
    this.t += dt;
    this.storm = clamp(this.storm + (s.storm ? 1 : -1) * dt * 1.2);

    // The surface drifts left. A capture pulls the target region under the CubeSat and a contact
    // pass pulls the ground station under it, so what the window shows matches the frame.
    const k = Math.min(1, dt * 3);
    if (s.capturing) this.rot -= wrap(this.rot) * k;
    else if (s.contact || (s.stationDown && s.speed !== 'paused')) {
      const d = wrap(AG + this.rot);
      if (s.contact || Math.abs(d) < 0.2) this.rot -= d * k;
      else this.rot -= RATE * dt;
    } else {
      const rate = s.speed === 'paused' ? 0 : s.speed === 'fast' ? 6 : 1;
      this.rot -= RATE * rate * (s.ended ? 0.2 : 1) * dt;
    }
    if (Math.abs(this.rot) > 1000) this.rot = wrap(this.rot);

    if (s.capturing && !this.wasCapturing && !s.cameraPaused) {
      this.flash = 0;
      this.capLabel = 1.6;
    }
    this.wasCapturing = s.capturing;
    if (this.flash >= 0) {
      this.flash += dt;
      if (this.flash > 0.8) this.flash = -1;
    }
    this.capLabel = Math.max(0, this.capLabel - dt);
  }

  draw(c: CanvasRenderingContext2D, s: SceneInput, K: number): void {
    const t = this.t;
    const S = this.storm;
    c.setTransform(K, 0, 0, K, 0, 0);
    let g = c.createLinearGradient(0, 0, 0, WINDOW_BOTTOM);
    g.addColorStop(0, '#03050b');
    g.addColorStop(1, '#0a1526');
    c.fillStyle = g;
    c.fillRect(0, 0, STAGE_W, WINDOW_BOTTOM);
    g = c.createRadialGradient(120, 40, 0, 120, 40, 400);
    g.addColorStop(0, `rgba(255,214,150,${0.2 + 0.25 * S})`);
    g.addColorStop(1, 'rgba(255,214,150,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, STAGE_W, WINDOW_BOTTOM);
    for (const st of STARS) {
      const x = (((st.x - t * st.v) % STAGE_W) + STAGE_W) % STAGE_W;
      c.fillStyle = `rgba(225,235,255,${st.a * (0.7 + 0.3 * Math.sin(t * st.tw + st.ph))})`;
      c.fillRect(x, st.y, st.r, st.r);
    }
    const r = this.rot;

    // Atmosphere, then the planet
    g = c.createRadialGradient(CX, CY, R - 4, CX, CY, R + 30);
    g.addColorStop(0, 'rgba(120,195,255,.55)');
    g.addColorStop(1, 'rgba(120,195,255,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(CX, CY, R + 30, 0, TAU);
    c.fill();
    c.save();
    c.beginPath();
    c.arc(CX, CY, R, 0, TAU);
    c.clip();
    g = c.createLinearGradient(0, LIMB, 0, WINDOW_BOTTOM);
    g.addColorStop(0, '#3d8fd0');
    g.addColorStop(0.25, '#2468a8');
    g.addColorStop(1, '#103257');
    c.fillStyle = g;
    c.fillRect(0, LIMB - 2, STAGE_W, 170);
    for (const b of LAND) this.blob(c, b, r, b.col);
    const tcol = seasonColour(Math.max(1, s.week));
    for (const b of TARGET) this.blob(c, b, r, tcol);
    for (const b of CLOUDS) this.blob(c, b, r * 1.18 + 0.2, `rgba(255,255,255,${b.al})`);
    g = c.createLinearGradient(0, 0, STAGE_W, 0);
    g.addColorStop(0, 'rgba(2,6,14,0)');
    g.addColorStop(0.55, 'rgba(2,6,14,0)');
    g.addColorStop(1, 'rgba(2,6,14,.6)');
    c.fillStyle = g;
    c.fillRect(0, LIMB - 2, STAGE_W, 170);
    c.strokeStyle = 'rgba(175,225,255,.5)';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(CX, CY, R - 1, 0, TAU);
    c.stroke();
    c.restore();

    // Satellite pose. A storm shakes it; an attitude fault turns it slowly off the target.
    const e = s.pointingError;
    const xs0 = CX + (R + 95) * Math.sin(AS);
    const ys0 = CY - (R + 95) * Math.cos(AS);
    const shake = S * 2.5 * Math.sin(t * 23);
    const xs = xs0 + 4 * Math.sin(t * 0.5) + shake;
    const ys = ys0 + 3 * Math.sin(t * 0.37 + 1);
    const drift = s.attitudeFault ? clamp(e / 3) * 0.35 * Math.sin(t * 0.45) : 0;
    const satRot = AS + 0.012 * Math.sin(t * 0.7) + Math.max(0, e - 0.2) * 0.06 * Math.sin(t * 5) + drift;
    const camX = xs - 34 * Math.sin(satRot);
    const camY = ys + 34 * Math.cos(satRot);

    // Target marker
    const AT = wrap(r);
    const [tx, ty] = pt(AT, 78);
    const cone = s.capturing && !s.cameraPaused && !s.safeMode ? clamp(1 - Math.abs(AT) / 0.09) : 0;
    if (Math.abs(AT) < 0.5) {
      c.save();
      c.translate(tx, ty);
      c.rotate(AT);
      c.strokeStyle = `rgba(134,220,242,${0.45 + 0.5 * cone})`;
      c.lineWidth = 1.5;
      brackets(c, -76, -28, 152, 56, 10);
      c.restore();
      c.font = FONT_D;
      c.textAlign = 'center';
      c.fillStyle = `rgba(134,220,242,${0.6 + 0.4 * cone})`;
      c.fillText('TARGET REGION', tx, ty + 46);
    }

    // Ground station marker and link
    const AGw = wrap(AG + r);
    const [gx, gy] = pt(AGw, 45);
    const blinkRed = s.stationDown && Math.sin(t * 8) > 0;
    if (Math.abs(AGw) < 0.5) {
      const col = s.stationDown ? (blinkRed ? '#ff6464' : '#7a2a30') : '#e4ecf5';
      c.save();
      c.translate(gx, gy);
      c.rotate(AGw);
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(-5, 4);
      c.lineTo(5, 4);
      c.lineTo(0, -5);
      c.closePath();
      c.fill();
      c.strokeStyle = col;
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(0, -8, 5, Math.PI * 0.15, Math.PI * 0.85);
      c.stroke();
      c.restore();
      const near = Math.abs(AGw) < 0.2;
      if (s.contact || near || s.stationDown) {
        c.font = FONT_D;
        c.textAlign = 'left';
        c.fillStyle = s.stationDown ? '#ff6464' : `rgba(98,211,148,${s.contact ? 1 : 0.6})`;
        c.fillText(s.stationDown ? 'GROUND STATION · OFFLINE' : 'GROUND STATION', gx + 14, gy + 4);
      }
    }
    if (s.contact && !s.stationDown) {
      c.save();
      c.strokeStyle = 'rgba(98,211,148,.16)';
      c.lineWidth = 7;
      c.beginPath();
      c.moveTo(xs, ys);
      c.lineTo(gx, gy);
      c.stroke();
      c.strokeStyle = 'rgba(98,211,148,.95)';
      c.lineWidth = 2;
      c.setLineDash([7, 8]);
      c.lineDashOffset = -t * 46;
      c.beginPath();
      c.moveTo(xs, ys);
      c.lineTo(gx, gy);
      c.stroke();
      c.restore();
    } else if (s.stationDown && Math.abs(AGw) < 0.12) {
      // The pass happens but the link is cut: a short red stub that stops halfway.
      c.save();
      c.strokeStyle = 'rgba(255,100,100,.9)';
      c.lineWidth = 2;
      c.setLineDash([5, 9]);
      c.lineDashOffset = -t * 30;
      c.beginPath();
      c.moveTo(xs, ys);
      c.lineTo(lerp(xs, gx, 0.45), lerp(ys, gy, 0.45));
      c.stroke();
      c.restore();
    }

    // Camera footprint. With a pointing fault it lands beside the target.
    if (cone > 0.01) {
      const off = s.attitudeFault || e > 1 ? clamp(e / 3, 0, 1.5) * 0.06 * (Math.sin(t * 0.45) >= 0 ? 1 : -1) : 0;
      const [ax, ay] = pt(AT - 0.032 + off, 78);
      const [bx, by] = pt(AT + 0.032 + off, 78);
      g = c.createLinearGradient(camX, camY, tx, ty);
      g.addColorStop(0, `rgba(134,220,242,${0.34 * cone})`);
      g.addColorStop(1, `rgba(134,220,242,${0.07 * cone})`);
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(camX, camY);
      c.lineTo(ax, ay);
      c.lineTo(bx, by);
      c.closePath();
      c.fill();
      c.strokeStyle = `rgba(134,220,242,${0.5 * cone})`;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(ax, ay);
      c.lineTo(camX, camY);
      c.lineTo(bx, by);
      c.stroke();
    }
    if (this.flash >= 0) {
      const u = this.flash / 0.8;
      c.strokeStyle = `rgba(255,255,255,${1 - u})`;
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(tx, ty, 10 + 70 * u, 0, TAU);
      c.stroke();
    }
    if (this.capLabel > 0 && Math.abs(AT) < 0.3) {
      c.font = FONT_D;
      c.textAlign = 'right';
      c.fillStyle = `rgba(255,255,255,${clamp(this.capLabel)})`;
      c.fillText(`IMAGE ${String(s.imageNumber).padStart(2, '0')} CAPTURED`, tx - 92, ty + 4);
    }

    // CubeSat: 3U body (10 x 10 x 34 cm proportions), camera facing Earth, two solar wings
    c.save();
    c.translate(xs, ys);
    c.rotate(satRot);
    c.scale(1.25, 1.25);
    for (const sx of [-1, 1]) {
      const x0 = sx < 0 ? -58 : 12;
      c.fillStyle = s.safeMode ? '#173d78' : '#1d4c96';
      c.fillRect(x0, -9, 46, 18);
      c.strokeStyle = 'rgba(134,220,242,.65)';
      c.lineWidth = 0.8;
      c.strokeRect(x0, -9, 46, 18);
      c.beginPath();
      for (let i = 1; i < 4; i++) {
        c.moveTo(x0 + i * 11.5, -9);
        c.lineTo(x0 + i * 11.5, 9);
      }
      c.moveTo(x0, 0);
      c.lineTo(x0 + 46, 0);
      c.moveTo(sx * 8, 0);
      c.lineTo(sx * 12, 0);
      c.stroke();
    }
    g = c.createLinearGradient(-8, 0, 8, 0);
    g.addColorStop(0, '#eef3f9');
    g.addColorStop(1, '#8e9cb3');
    c.fillStyle = g;
    c.fillRect(-8, -27, 16, 54);
    c.strokeStyle = '#0b1220';
    c.lineWidth = 0.8;
    c.strokeRect(-8, -27, 16, 54);
    c.beginPath();
    c.moveTo(-8, -9);
    c.lineTo(8, -9);
    c.moveTo(-8, 9);
    c.lineTo(8, 9);
    c.stroke();
    c.strokeStyle = '#c9d4e2';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, -27);
    c.lineTo(0, -40);
    c.moveTo(-5, -40);
    c.lineTo(5, -40);
    c.stroke();
    c.fillStyle = '#0b1220';
    c.beginPath();
    c.arc(0, 27, 4.2, 0, TAU);
    c.fill();
    c.strokeStyle = s.cameraPaused || s.safeMode ? '#f3c04f' : '#86dcf2';
    c.lineWidth = 1.2;
    c.stroke();
    c.fillStyle = s.anyAlert ? '#ff6464' : '#62d394';
    c.beginPath();
    c.arc(0, -18, 1.9, 0, TAU);
    c.fill();
    c.restore();

    // HUD reticle and label: cyan, amber when drifting, red when off target
    const hud = e > 2 ? '255,100,100' : e > 1 ? '243,192,79' : '134,220,242';
    c.strokeStyle = `rgba(${hud},.8)`;
    c.lineWidth = 1.5;
    brackets(c, xs0 - 84, ys0 - 58, 168, 116, 13);
    c.beginPath();
    c.moveTo(xs0 - 84, ys0);
    c.lineTo(xs0 - 100, ys0);
    c.stroke();
    c.textAlign = 'right';
    c.font = FONT_D;
    c.fillStyle = `rgba(${hud},1)`;
    c.fillText('EW-1 · 3U CUBESAT', xs0 - 106, ys0 - 3);
    c.font = FONT_M;
    c.fillStyle = 'rgba(131,148,171,1)';
    c.fillText('10 × 10 × 34 cm', xs0 - 106, ys0 + 13);

    // Solar storm
    if (S > 0.01) {
      c.lineWidth = 1.4;
      for (const st of STREAKS) {
        const x = ((st.x + t * st.v * 900) % 1500) - 110;
        const y = ((st.y + t * st.v * 290) % 470) - 20;
        c.strokeStyle = `rgba(255,196,110,${0.55 * S * st.a})`;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + 30, y + 9.6);
        c.stroke();
      }
      c.fillStyle = `rgba(255,150,60,${0.08 * S})`;
      c.fillRect(0, 0, STAGE_W, WINDOW_BOTTOM);
    }
  }

  private blob(c: CanvasRenderingContext2D, b: Blob, r: number, col: string) {
    const A = wrap(b.a + r);
    if (Math.abs(A) > 0.56) return;
    const [x, y] = pt(A, b.d);
    c.save();
    c.translate(x, y);
    c.rotate(A + b.tilt);
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(0, 0, b.w / 2, b.h / 2, 0, 0, TAU);
    c.fill();
    c.restore();
  }
}

function brackets(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, n: number) {
  c.beginPath();
  c.moveTo(x, y + n);
  c.lineTo(x, y);
  c.lineTo(x + n, y);
  c.moveTo(x + w - n, y);
  c.lineTo(x + w, y);
  c.lineTo(x + w, y + n);
  c.moveTo(x + w, y + h - n);
  c.lineTo(x + w, y + h);
  c.lineTo(x + w - n, y + h);
  c.moveTo(x + n, y + h);
  c.lineTo(x, y + h);
  c.lineTo(x, y + h - n);
  c.stroke();
}
