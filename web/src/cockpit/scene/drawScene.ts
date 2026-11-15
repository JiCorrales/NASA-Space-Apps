/**
 * Canvas drawing for the cockpit window, as pixel art: stars, the Sun, the real Earth scrolling under
 * the CubeSat, the markers, the camera cone, the contact link and the three threats.
 *
 * Everything is drawn on the whole pixels of a 640 x 360 grid (half the 1280 x 720 stage; the browser
 * scales it up without smoothing), with a fixed palette, no gradients and no anti-aliasing. The Earth
 * comes from the NASA Blue Marble images through `earth.ts`; the sprites are code in `sprites.ts`.
 * What does not change is painted once into offscreen canvases; a frame is a few hundred blits.
 *
 * The drawing reads a `SceneInput` built from the latest `SimFrame` and keeps only visual state of its
 * own (scroll, easing, flash timers). It never decides a simulation outcome: whether an image is
 * captured, a link is up or a problem is active all come from the frame.
 */
import {
  AIR_ROWS, EARTH_COLOURS, EARTH_DEPTH, EARTH_PERIOD, REGION_LABEL, paintBand, paintClouds, regionPlaces, type RegionKey,
} from "./earth";
import {
  BOLT_ROWS, CROSS_ROWS, DISH_DOWN_ROWS, DISH_ROWS, FX_COLOURS, SAT_COLOURS, SAT_LENS, SAT_SIZE, SAT_STEP, SAT_TILTS, SMOKE_ROWS,
  cubeSatFrames, fxBitmap, sunBitmap, toCanvas, type Bitmap,
} from "./sprites";

export const STAGE_W = 1280;
export const STAGE_H = 720;

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** What the scene needs from the frame. Built by `sceneInputFromFrame`. */
export interface SceneInput {
  /** Mission week, 1 to 52 (0 before launch). */
  week: number;
  speed: "detail" | "fast" | "paused";
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
  /** Which region's land passes under the CubeSat (from `state.design.region`). Optional: Costa Rica. */
  region?: RegionKey;
}

export const IDLE_SCENE: SceneInput = {
  week: 0,
  speed: "paused",
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
  region: "costaRica",
};

/* ---------- Layout, in canvas pixels (640 x 360) ---------- */
const W = 640;
/** The window ends here; the console covers the rest. */
const WIN_BOTTOM = 204;
const CX = 320;
/** Radius of the drawn horizon and the row of its highest point. */
const RC = 640;
const LIMB = 118;
export const SAT_X = 348;
const SAT_Y = 72;
const SUN_X = 50;
const SUN_Y = 70;
/** Surface scroll in detail speed, pixels per second. */
const RATE = 19;
const wrapP = (a: number) => a - EARTH_PERIOD * Math.round(a / EARTH_PERIOD);
/** Row of the horizon at a column. */
export const limbY = (x: number) => Math.round(LIMB + RC - Math.sqrt(RC * RC - (x - CX) * (x - CX)));

/** Columns that share a horizon row: the Earth is blitted one run at a time. */
const RUNS: { x: number; w: number; y: number }[] = [];
for (let x = 0; x < W; ) {
  const y = limbY(x);
  let n = 1;
  while (x + n < W && limbY(x + n) === y) n++;
  RUNS.push({ x, w: n, y });
  x += n;
}

/** The window struts drawn over the canvas (`CockpitView.tsx`): left edge of each at a row, 8 pixels wide. */
const strutLeft = (y: number) => 216 - ((y - 18) * 22) / 182;
const strutRight = (y: number) => 416 + ((y - 18) * 22) / 182;
/** Moves a label of width `w` sideways if a strut would cover part of it. Returns its new left edge. */
export function clearOfStruts(x: number, w: number, y: number): number {
  for (const sx of [strutLeft(y), strutRight(y)]) {
    const a = sx - 4, b = sx + 12;
    if (x < b && x + w > a) return x + w / 2 < sx + 4 ? Math.floor(a - w) : Math.ceil(b);
  }
  return x;
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Scene content, generated once from a fixed seed ---------- */
const rnd = rng(7);
/** kind 0: dim point, 1: bright point, 2: a plus-shaped star that twinkles. */
const STARS = Array.from({ length: 120 }, () => {
  const k = rnd();
  return { x: Math.floor(rnd() * W), y: 18 + Math.floor(rnd() * 150), kind: k < 0.6 ? 0 : k < 0.9 ? 1 : 2, v: 0.4 + rnd() * 1.6, ph: rnd() * 6 };
});

const COL = {
  space: "#04060d",
  spaceLow: "#0a1830",
  starDim: "#4d5b78",
  star: "#aab8d0",
  starHot: "#ffffff",
  ice: "#86dcf2",
  iceDim: "#5aa9c4",
  ok: "#62d394",
  okDim: "#46a874",
  warn: "#f3c04f",
  crit: "#ff6464",
  critDim: "#b04650",
  text: "#e4ecf5",
  dim: "#8394ab",
  shadow: "#05070f",
  white: "#ffffff",
  flare: "#f08a2c",
};
const FONT = '8px "Press Start 2P",ui-monospace,monospace';
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Colour of a delivered week in the report's film strip: green early in the year, ochre late. Symbolic only. */
export function seasonColour(week: number): string {
  const s = clamp((week - 1) / 51);
  return `rgb(${Math.round(lerp(63, 186, s))},${Math.round(lerp(155, 148, s))},${Math.round(lerp(99, 85, s))})`;
}

type Ctx = CanvasRenderingContext2D;
type Sprite = HTMLCanvasElement | null;

function newCanvas(w: number, h: number): { cv: HTMLCanvasElement; c: Ctx } | null {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  let c: Ctx | null = null;
  try { c = cv.getContext("2d"); } catch { c = null; }
  return c ? { cv, c } : null;
}

/** Paints palette indices (255 = transparent) on a canvas `extra` columns wider than the data, repeating the first columns. */
function indexedCanvas(px: Uint8Array, w: number, h: number, extra: number): Sprite {
  const made = newCanvas(w + extra, h);
  if (!made) return null;
  const img = made.c.createImageData?.(w + extra, h);
  if (!img?.data) return null; // a stub context (tests)
  const rgb = EARTH_COLOURS.map((hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w + extra; x++) {
      const v = px[y * w + (x % w)]!;
      if (v === 255) continue;
      const o = (y * (w + extra) + x) * 4;
      const col = rgb[v]!;
      img.data[o] = col[0]!;
      img.data[o + 1] = col[1]!;
      img.data[o + 2] = col[2]!;
      img.data[o + 3] = 255;
    }
  }
  made.c.putImageData(img, 0, 0);
  return made.cv;
}

/** Space: flat, with a dithered lighter band towards the horizon. Painted once. */
function skyCanvas(): Sprite {
  const made = newCanvas(W, WIN_BOTTOM);
  if (!made) return null;
  const c = made.c;
  c.fillStyle = COL.space;
  c.fillRect(0, 0, W, WIN_BOTTOM);
  c.fillStyle = COL.spaceLow;
  for (let y = 60; y < WIN_BOTTOM; y++) {
    const level = Math.min(16, Math.floor(((y - 60) / 90) * 17));
    for (let x = 0; x < W; x++) if (BAYER[(y & 3) * 4 + (x & 3)]! < level) c.fillRect(x, y, 1, 1);
  }
  return made.cv;
}

interface Sprites {
  sky: Sprite;
  /** CubeSat frames by tilt, per variant (status light and lens ring colour). */
  sat: Map<string, Sprite[]>;
  satFrames: Bitmap[];
  dish: Sprite;
  dishDown: Sprite;
  cross: Sprite;
  smoke: Sprite[];
  bolt: Sprite[];
  sun: Sprite[];
  sunStorm: Sprite[];
}

function buildSprites(): Sprites {
  const fx = (rows: readonly string[]) => toCanvas(fxBitmap(rows), FX_COLOURS);
  return {
    sky: skyCanvas(),
    sat: new Map(),
    satFrames: cubeSatFrames(),
    dish: fx(DISH_ROWS),
    dishDown: fx(DISH_DOWN_ROWS),
    cross: fx(CROSS_ROWS),
    smoke: SMOKE_ROWS.map(fx),
    bolt: BOLT_ROWS.map(fx),
    sun: [0, 1].map((f) => toCanvas(sunBitmap(f, false), FX_COLOURS)),
    sunStorm: [0, 1, 2, 3].map((f) => toCanvas(sunBitmap(f, true), FX_COLOURS)),
  };
}

interface EarthLayers {
  ground: Sprite;
  clouds: Sprite;
  target: { col: number; row: number };
  station: { col: number; row: number };
}

function px(c: Ctx, x: number, y: number, w = 1, h = 1) {
  c.fillRect(x, y, w, h);
}

/** Corner brackets of a box, one pixel thick, arms `n` long. */
function brackets(c: Ctx, x: number, y: number, w: number, h: number, n: number) {
  for (const [bx, by, sx, sy] of [[x, y, 1, 1], [x + w - 1, y, -1, 1], [x, y + h - 1, 1, -1], [x + w - 1, y + h - 1, -1, -1]] as const) {
    c.fillRect(sx > 0 ? bx : bx - n + 1, by, n, 1);
    c.fillRect(bx, sy > 0 ? by : by - n + 1, 1, n);
  }
}

/** `brackets` with a dark one-pixel outline, so the marker still shows on white sea ice and on bright land. */
function outlined(c: Ctx, x: number, y: number, w: number, h: number, n: number, colour: string) {
  const prev = c.fillStyle;
  c.fillStyle = COL.shadow;
  brackets(c, x - 1, y - 1, w + 2, h + 2, n + 1);
  brackets(c, x + 1, y + 1, w - 2, h - 2, n - 1);
  c.fillStyle = colour;
  brackets(c, x, y, w, h, n);
  c.fillStyle = prev;
}

/** Left edge of the ground station's label: beside the dish, on the side away from the target, clear of the broken-link cross. */
export function stationLabelX(dishX: number, targetX: number, text: string, down: boolean): number {
  return dishX < targetX ? dishX - 10 - text.length * 8 : dishX + (down ? 22 : 18);
}

/** Text in the pixel font at its native 8 pixels, with a dark drop shadow, kept clear of the window struts. */
function label(c: Ctx, text: string, x: number, y: number, colour: string, align: "left" | "center" = "left") {
  const w = text.length * 8;
  const left = clearOfStruts(Math.round(align === "center" ? x - w / 2 : x), w, y - 4);
  c.font = FONT;
  c.textAlign = "left";
  c.textBaseline = "alphabetic";
  // A dark outline: the text stays readable over white ice, bright land and dark sea alike.
  c.fillStyle = COL.shadow;
  for (const [dx, dy] of [[1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]] as const) c.fillText(text, left + dx, y + dy);
  c.fillStyle = colour;
  c.fillText(text, left, y);
}

/**
 * Visual state of the window. One instance per canvas; `step` advances it with wall-clock time
 * and `draw` paints it. Nothing here touches React.
 */
export class CockpitScene {
  t = 0;
  /** Column of the Earth band under the CubeSat. */
  u = EARTH_PERIOD / 2 - 46;
  storm = 0;
  flash = -1;
  private wasCapturing = false;
  private capLabel = 0;
  private sprites: Sprites | null = null;
  private earth = new Map<RegionKey, EarthLayers>();

  private layers(region: RegionKey): EarthLayers {
    let e = this.earth.get(region);
    if (!e) {
      const places = regionPlaces(region);
      e = {
        ...places,
        ground: indexedCanvas(paintBand(region), EARTH_PERIOD, AIR_ROWS + EARTH_DEPTH, W),
        clouds: indexedCanvas(paintClouds(region), EARTH_PERIOD, EARTH_DEPTH, W),
      };
      this.earth.set(region, e);
    }
    return e;
  }

  step(dt: number, s: SceneInput): void {
    dt = Math.min(dt, 0.1);
    this.t += dt;
    this.storm = clamp(this.storm + (s.storm ? 1 : -1) * dt * 1.2);
    const { target, station } = regionPlaces(s.region ?? "costaRica");

    // The surface drifts left. A capture pulls the target region under the CubeSat and a contact
    // pass pulls the ground station under it, so what the window shows matches the frame.
    const k = Math.min(1, dt * 3);
    if (s.capturing) this.u += wrapP(target.col - this.u) * k;
    else if (s.contact || (s.stationDown && s.speed !== "paused")) {
      const d = wrapP(station.col - this.u);
      if (s.contact || Math.abs(d) < 150) this.u += d * k;
      else this.u += RATE * dt;
    } else {
      const rate = s.speed === "paused" ? 0 : s.speed === "fast" ? 6 : 1;
      this.u += RATE * rate * (s.ended ? 0.2 : 1) * dt;
    }
    this.u = mod(this.u, EARTH_PERIOD);

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

  draw(c: Ctx, s: SceneInput, K: number): void {
    const t = this.t;
    const S = this.storm;
    const region = s.region ?? "costaRica";
    const sp = (this.sprites ??= buildSprites());
    const earth = this.layers(region);
    // The scene is drawn in canvas pixels: at K = 0.5 (a 640 x 360 canvas) this is the identity.
    c.setTransform(K * 2, 0, 0, K * 2, 0, 0);
    c.imageSmoothingEnabled = false;

    /* Space and stars */
    if (sp.sky) c.drawImage(sp.sky, 0, 0);
    else {
      c.fillStyle = COL.space;
      c.fillRect(0, 0, W, WIN_BOTTOM);
    }
    for (const st of STARS) {
      const x = mod(st.x - Math.floor(t * st.v), W);
      if (st.kind === 2) {
        const big = Math.sin(t * 1.3 + st.ph) > 0;
        c.fillStyle = COL.star;
        if (big) { px(c, x - 1, st.y); px(c, x + 1, st.y); px(c, x, st.y - 1); px(c, x, st.y + 1); }
        c.fillStyle = COL.starHot;
        px(c, x, st.y);
      } else {
        c.fillStyle = st.kind === 1 ? COL.star : COL.starDim;
        px(c, x, st.y);
      }
    }

    /* The Sun. In a solar storm it flares and throws arcs of charged particles across the window. */
    const stormy = S > 0.3;
    const sun = stormy ? sp.sunStorm[Math.floor(t * 8) % 4] : sp.sun[Math.floor(t * 1.5) % 2];
    if (S > 0.01) {
      const fronts = Math.ceil(S * 7);
      for (let i = 0; i < fronts; i++) {
        const r = mod(t * 80 + i * 80, 560) + 24;
        const n = Math.max(6, Math.floor(r * 0.3));
        c.fillStyle = i % 2 ? COL.flare : COL.warn;
        const size = r < 200 ? 2 : r < 380 ? 2 : 1;
        for (let j = 0; j <= n; j++) {
          // A dashed arc: two dots, a gap. The dashes crawl along the front.
          if ((j + i + Math.floor(t * 6)) % 3 === 0) continue;
          const a = -0.62 + (1.42 * j) / n;
          px(c, Math.round(SUN_X + Math.cos(a) * r), Math.round(SUN_Y + Math.sin(a) * r), size, size);
        }
      }
    }
    if (sun) c.drawImage(sun, SUN_X - 20, SUN_Y - 20);

    /* The Earth: the band scrolls in whole pixels and follows the curve of the horizon run by run. */
    const U = Math.floor(this.u);
    const gx0 = mod(U - SAT_X, EARTH_PERIOD);
    const cx0 = mod(Math.floor(this.u * 1.15 + t * 1.5) - SAT_X, EARTH_PERIOD);
    if (earth.ground) {
      for (const run of RUNS) {
        const top = run.y - AIR_ROWS;
        const h = Math.min(AIR_ROWS + EARTH_DEPTH, WIN_BOTTOM - top);
        if (h > 0) c.drawImage(earth.ground, gx0 + run.x, 0, run.w, h, run.x, top, run.w, h);
      }
    }
    if (earth.clouds) {
      for (const run of RUNS) {
        const h = Math.min(EARTH_DEPTH, WIN_BOTTOM - run.y);
        if (h > 0) c.drawImage(earth.clouds, cx0 + run.x, 0, run.w, h, run.x, run.y, run.w, h);
      }
    }
    /** Window position of a place on the band. */
    const place = (p: { col: number; row: number }) => {
      const x = SAT_X + wrapP(p.col - U);
      return { x, y: limbY(clamp(x, 0, W - 1)) + p.row };
    };

    /* Satellite pose. A storm rattles it; an attitude fault swings it off the target in steps. */
    const e = s.pointingError;
    let tilt = 0;
    if (s.attitudeFault) tilt = Math.round(clamp(e / 3, 0.5, 1) * SAT_TILTS * Math.sin(t * 0.9));
    else if (e > 1) tilt = [0, 1, 0, -1][Math.floor(t * 2.5) % 4]!;
    const rattle = S > 0.5 ? [0, 1, 0, -1][Math.floor(t * 14) % 4]! : 0;
    const xs = SAT_X + Math.round(2 * Math.sin(t * 0.5)) + rattle;
    const ys = SAT_Y + Math.round(1.5 * Math.sin(t * 0.37 + 1));
    const ang = (tilt * SAT_STEP * Math.PI) / 180;
    // The sprite turns clockwise for a positive tilt: the lens swings to the left.
    const lensX = Math.round(xs - Math.sin(ang) * SAT_LENS);
    const lensY = Math.round(ys + Math.cos(ang) * SAT_LENS);

    /* Target marker */
    const tp = place(earth.target);
    const onTarget = Math.abs(tp.x - SAT_X) < 40;
    const cone = s.capturing && !s.cameraPaused && !s.safeMode && onTarget;
    const TW = 48, TH = 26;
    if (Math.abs(tp.x - SAT_X) < 300) {
      const mark = cone ? COL.ice : COL.iceDim;
      outlined(c, tp.x - TW / 2, tp.y - TH / 2, TW, TH, 6, mark);
      c.fillStyle = COL.shadow;
      px(c, tp.x - 3, tp.y - 1, 7, 3);
      px(c, tp.x - 1, tp.y - 3, 3, 7);
      c.fillStyle = mark;
      px(c, tp.x - 2, tp.y, 5, 1);
      px(c, tp.x, tp.y - 2, 1, 5);
    }

    /* Ground station */
    const gp = place(earth.station);
    const stationSeen = Math.abs(gp.x - SAT_X) < 300;
    const blink = Math.floor(t * 4) % 2 === 0;
    if (stationSeen) {
      const dish = s.stationDown ? sp.dishDown : sp.dish;
      // The sprite has a one-pixel margin; its base sits on the station's pixel.
      if (dish) c.drawImage(dish, gp.x - 6, gp.y - 11);
      if (s.stationDown) {
        const smoke = sp.smoke[Math.floor(t * 5) % 3];
        if (smoke) c.drawImage(smoke, gp.x - 5, gp.y - 22);
        if (blink && sp.cross) c.drawImage(sp.cross, gp.x + 7, gp.y - 13);
      }
    }
    const tipX = gp.x, tipY = gp.y - 11;

    /* Camera cone and footprint. With a pointing fault the footprint lands beside the target. */
    if (cone) {
      const footX = Math.round(lensX - Math.tan(ang) * (tp.y - lensY));
      const half = 13;
      const miss = Math.abs(footX - tp.x) > 9;
      const rows = tp.y - lensY;
      const scan = Math.floor(t * 30);
      for (let j = 2; j < rows; j++) {
        const y = lensY + j;
        const mid = lerp(lensX, footX, j / rows);
        const hw = (half * j) / rows;
        const xl = Math.round(mid - hw), xr = Math.round(mid + hw);
        // Sparse dither inside, a brighter scan line travelling down.
        if (mod(j - scan, 14) < 2) {
          c.fillStyle = COL.ice;
          for (let x = xl + 1; x < xr; x += 2) px(c, x, y);
        } else if (j % 2 === 0) {
          c.fillStyle = COL.iceDim;
          for (let x = xl + 1 + (((j >> 1) & 1) * 2); x < xr; x += 4) px(c, x, y);
        }
        c.fillStyle = COL.shadow;
        px(c, xl - 1, y);
        px(c, xr + 1, y);
        c.fillStyle = COL.ice;
        px(c, xl, y);
        px(c, xr, y);
      }
      c.fillStyle = miss ? COL.crit : COL.white;
      px(c, footX - half, tp.y, half * 2 + 1, 1);
      px(c, footX - half, tp.y - 2, 1, 5);
      px(c, footX + half, tp.y - 2, 1, 5);
      if (miss && blink && sp.cross) c.drawImage(sp.cross, footX - 5, tp.y + 3);
    }

    /* Capture flash: the shutter. A dithered white frame, then brackets stepping outwards. */
    if (this.flash >= 0) {
      const f = Math.floor(this.flash / 0.1);
      if (f === 0) {
        c.fillStyle = COL.white;
        for (let y = 0; y < TH; y++) for (let x = (y & 1); x < TW; x += 2) px(c, tp.x - TW / 2 + x, tp.y - TH / 2 + y);
      } else if (f < 7) {
        const grow = (f - 1) * 4;
        c.fillStyle = f < 3 ? COL.white : f < 5 ? COL.ice : COL.iceDim;
        brackets(c, tp.x - TW / 2 - grow, tp.y - TH / 2 - grow, TW + grow * 2, TH + grow * 2, 6 + f);
      }
    }

    /* Contact link: packets of data stepping down from the CubeSat to the dish. */
    if (s.contact && !s.stationDown && stationSeen) {
      const len = Math.hypot(tipX - xs, tipY - (ys + 18));
      const phase = mod(t * 40, 8);
      for (let d = phase, i = 0; d < len - 3; d += 8, i++) {
        const u = d / len;
        c.fillStyle = (i + Math.floor(t * 5)) % 3 === 0 ? COL.white : COL.ok;
        px(c, Math.round(lerp(xs, tipX, u)) - 1, Math.round(lerp(ys + 18, tipY, u)) - 1, 2, 2);
      }
      // Radio waves leaving the dish, three frames.
      c.fillStyle = COL.ok;
      const waves = 1 + (Math.floor(t * 6) % 3);
      for (let w = 1; w <= waves; w++) {
        const r = 3 + w * 4;
        for (let a = -2.3; a <= -0.84; a += 0.9 / r) px(c, Math.round(tipX + Math.cos(a) * r), Math.round(tipY + Math.sin(a) * r));
      }
    } else if (s.stationDown && stationSeen && Math.abs(gp.x - SAT_X) < 220) {
      // The pass happens but nobody answers: the packets stop halfway at a cross and fall away.
      const x0 = xs, y0 = ys + 18;
      const bx = Math.round(lerp(x0, tipX, 0.5)), by = Math.round(lerp(y0, tipY, 0.5));
      const len = Math.hypot(bx - x0, by - y0);
      const phase = mod(t * 26, 8);
      c.fillStyle = COL.crit;
      for (let d = phase; d < len - 6; d += 8) {
        const u = d / len;
        px(c, Math.round(lerp(x0, bx, u)) - 1, Math.round(lerp(y0, by, u)) - 1, 2, 2);
      }
      if (sp.cross) c.drawImage(sp.cross, bx - 5, by - 5);
      c.fillStyle = COL.critDim;
      const fall = Math.floor(t * 8) % 4;
      px(c, bx - 6 - fall, by + 7 + fall * 2, 2, 2);
      px(c, bx + 5 + fall, by + 8 + fall * 2, 2, 2);
      px(c, bx, by + 9 + fall * 3, 1, 1);
    }

    /* Labels on the ground */
    if (Math.abs(tp.x - SAT_X) < 220) {
      if (this.capLabel > 0) label(c, `IMAGE ${String(s.imageNumber).padStart(2, "0")} CAPTURED`, tp.x, tp.y + TH / 2 + 12, COL.white, "center");
      else label(c, REGION_LABEL[region], tp.x, tp.y + TH / 2 + 12, cone ? COL.ice : COL.iceDim, "center");
    }
    if (stationSeen && (s.contact || s.stationDown || Math.abs(gp.x - SAT_X) < 150)) {
      // Beside the dish on the side away from the target, so the two labels never share a place.
      const col = s.stationDown ? (blink ? COL.crit : COL.critDim) : s.contact ? COL.ok : COL.okDim;
      const lx = stationLabelX(gp.x, tp.x, "STATION", s.stationDown);
      label(c, "STATION", lx, gp.y - 14, col);
      if (s.stationDown) label(c, "OFFLINE", lx, gp.y - 3, col);
    }

    /* CubeSat */
    const variant = `${s.anyAlert ? (blink ? "r" : "o") : "g"}${s.cameraPaused || s.safeMode ? "a" : "c"}`;
    let frames = sp.sat.get(variant);
    if (!frames) {
      const pal = SAT_COLOURS.slice();
      pal[11] = variant[0] === "g" ? COL.ok : variant[0] === "r" ? COL.crit : COL.critDim;
      pal[10] = variant[1] === "a" ? COL.warn : "#7ce7ff";
      frames = sp.satFrames.map((b) => toCanvas(b, pal));
      sp.sat.set(variant, frames);
    }
    const sat = frames[tilt + SAT_TILTS];
    if (sat) c.drawImage(sat, xs - SAT_SIZE / 2, ys - SAT_SIZE / 2);

    /* Attitude fault: two arrows circle the CubeSat, the sign of a spin it did not ask for. */
    if (s.attitudeFault) {
      c.fillStyle = e > 2 ? COL.crit : COL.warn;
      const base = (Math.floor(t * 6) % 8) * (Math.PI / 8);
      const r = 33;
      for (const half of [0, Math.PI]) {
        const a0 = base + half;
        for (let a = a0; a < a0 + 1.15; a += 0.062) px(c, Math.round(xs + Math.cos(a) * r) - 1, Math.round(ys + Math.sin(a) * r * 0.82) - 1, 2, 2);
        // Arrow head at the leading end.
        const hx = Math.round(xs + Math.cos(a0 + 1.15) * r), hy = Math.round(ys + Math.sin(a0 + 1.15) * r * 0.82);
        const tx = -Math.sin(a0 + 1.15), ty = Math.cos(a0 + 1.15);
        for (let k = 1; k <= 4; k++) {
          px(c, Math.round(hx - tx * k - ty * k) - 1, Math.round(hy - ty * k + tx * k) - 1, 2, 2);
          px(c, Math.round(hx - tx * k + ty * k) - 1, Math.round(hy - ty * k - tx * k) - 1, 2, 2);
        }
      }
    }

    /* Solar storm: bolts strike around the CubeSat. */
    if (stormy) {
      const tick = Math.floor(t * 9);
      for (let i = 0; i < 3; i++) {
        const h = Math.imul(tick + i * 31, 2654435761) >>> 0;
        const bolt = sp.bolt[(h >>> 3) % 2];
        if (bolt && (h & 3) !== 0) c.drawImage(bolt, xs - 30 + ((h >>> 5) % 54), ys - 30 + ((h >>> 12) % 48));
      }
    }

    /* HUD reticle and label: cyan, amber when drifting, red when off target */
    const hud = e > 2 ? COL.crit : e > 1 ? COL.warn : COL.ice;
    c.fillStyle = hud;
    brackets(c, SAT_X - 44, SAT_Y - 36, 88, 70, 7);
    px(c, SAT_X + 44, SAT_Y - 1, 10, 1);
    // The label sits to the right of the right strut.
    label(c, "EW-1 3U CUBESAT", SAT_X + 104, SAT_Y - 2, hud);
    label(c, "10 x 10 x 34 cm", SAT_X + 104, SAT_Y + 10, COL.dim);
  }
}
