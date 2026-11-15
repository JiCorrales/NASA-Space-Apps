/**
 * Preview page of the world art. B (16-bit), the version chosen for the game, comes first and largest: composed
 * scenes (day, night, dust storm) and every sprite. A and C follow, collapsed. Sprites are shown on the dark
 * background and on Mars ground, animated where they have frames; seamless tiles are also shown tiled.
 * `?scale=1|2|4` sets the sprite scale, `?only=<family>` shows one family, `?open=1` expands A and C.
 */
import type { Art, Sprite } from "./paint";
import { paint, spriteSize } from "./paint";
import { VERSION_NAME, type Ver } from "./marsPalette";
import * as terrain from "./terrain";
import * as base from "./base";
import * as satellite from "./satellite";
import * as hazards from "./hazards";
import * as vehicles from "./vehicles";
import { drawScene, SCENE_H, SCENE_W, type SceneMode } from "./sceneWorld";

type Mod = Record<Ver, Record<string, Art>>;
const FAMILIES: { id: string; title: string; mod: Mod; seamless?: readonly string[] }[] = [
  { id: "terrain", title: "Terrain", mod: terrain as unknown as Mod, seamless: terrain.SEAMLESS },
  { id: "base", title: "Base", mod: base as unknown as Mod },
  { id: "satellite", title: "Satellite", mod: satellite as unknown as Mod },
  { id: "hazards", title: "Hazards", mod: hazards as unknown as Mod },
  { id: "vehicles", title: "Vehicles and travel", mod: vehicles as unknown as Mod },
];

const BG = "#05070f";
const params = new URLSearchParams(location.search);
const frames = (a: Art): Sprite[] => (Array.isArray(a) ? a : [a]);
const colours = (a: Art) => new Set(frames(a).flatMap((s) => Object.values(s.palette))).size;

interface Live { el: HTMLElement; draw: (t: number) => void }
const live: Live[] = [];
let scale = Number(params.get("scale")) || 4;

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d")!];
}

function groundFill(ctx: CanvasRenderingContext2D, v: Ver, w: number, h: number, s: number): void {
  const tile = terrain[v].regolith2 as Sprite;
  for (let y = 0; y < h; y += 16 * s) for (let x = 0; x < w; x += 16 * s) paint(ctx, tile, x, y, s);
}

function shell(name: string, meta: string): [HTMLElement, HTMLElement] {
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `<div class="name">${name}</div><div class="meta">${meta}</div>`;
  const pair = document.createElement("div");
  pair.className = "pair";
  el.append(pair);
  return [el, pair];
}

function card(name: string, art: Art, v: Ver, seamless: boolean): HTMLElement {
  const fr = frames(art);
  const { w, h } = spriteSize(fr[0]!);
  const [el, pair] = shell(name, `${w}x${h}, ${colours(art)} colours${fr.length > 1 ? `, ${fr.length} frames` : ""}`);
  const [c1, x1] = canvas(w * scale, h * scale);
  const [c2, x2] = canvas(w * scale, h * scale);
  pair.append(c1, c2);
  const tiled = seamless ? canvas(w * scale * 2, h * scale * 2) : null;
  if (tiled) pair.append(tiled[0]);
  live.push({
    el,
    draw(t) {
      const s = fr[Math.floor(t / 180) % fr.length]!;
      x1.fillStyle = BG; x1.fillRect(0, 0, c1.width, c1.height);
      paint(x1, s, 0, 0, scale);
      groundFill(x2, v, c2.width, c2.height, scale);
      paint(x2, s, 0, 0, scale);
      if (tiled) for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) paint(tiled[1], s, i * w * scale, j * h * scale, scale);
    },
  });
  return el;
}

/** The round crater pieces assembled: n x n tiles. */
function craterCard(n: 3 | 5, v: Ver): HTMLElement {
  const size = n * 16 * scale;
  const [el, pair] = shell(`crater${n} (${n * n} tiles)`, `${n * 16}x${n * 16}, assembled from crater${n}_<row><col>`);
  const [c1, x1] = canvas(size, size);
  const [c2, x2] = canvas(size, size);
  pair.append(c1, c2);
  live.push({
    el,
    draw() {
      x1.fillStyle = BG; x1.fillRect(0, 0, size, size);
      groundFill(x2, v, size, size, scale);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const t = (terrain[v] as unknown as Record<string, Sprite>)[`crater${n}_${j}${i}`]!;
        paint(x1, t, i * 16 * scale, j * 16 * scale, scale);
        paint(x2, t, i * 16 * scale, j * 16 * scale, scale);
      }
    },
  });
  return el;
}

function sceneCard(v: Ver, mode: SceneMode): HTMLElement {
  const sc = scale >= 4 ? 3 : Math.max(2, scale);
  const [c, x] = canvas(SCENE_W * sc, SCENE_H * sc);
  const el = document.createElement("div");
  el.className = "card scene";
  el.innerHTML = `<div class="name">${VERSION_NAME[v]}: ${mode === "day" ? "day" : mode === "night" ? "night" : "medium dust storm"}</div>`;
  el.append(c);
  live.push({ el, draw: (t) => drawScene(x, v, t, sc, mode) });
  return el;
}

function versionBlock(v: Ver, host: HTMLElement, primary: boolean): void {
  const only = params.get("only");
  const modes: SceneMode[] = primary ? ["day", "night", "storm"] : ["day"];
  if (!only || only === "scenes") {
    const h3 = document.createElement("h3");
    h3.id = primary ? "scenes" : `scenes-${v}`; h3.textContent = "Composed scenes (320 x 180, the crew are placeholders)";
    const grid = document.createElement("div");
    grid.className = "grid";
    for (const m of modes) grid.append(sceneCard(v, m));
    host.append(h3, grid);
  }
  for (const fam of FAMILIES) {
    if (only && only !== fam.id) continue;
    const h3 = document.createElement("h3");
    if (primary) h3.id = fam.id;
    h3.textContent = fam.title;
    const grid = document.createElement("div");
    grid.className = "grid";
    for (const [k, art] of Object.entries(fam.mod[v])) {
      if (/^crater[35]_/.test(k)) continue;
      grid.append(card(k, art, v, fam.seamless?.includes(k) ?? false));
    }
    if (fam.id === "terrain") grid.append(craterCard(3, v), craterCard(5, v));
    host.append(h3, grid);
  }
}

function render(): void {
  live.length = 0;
  const root = document.getElementById("root")!;
  root.replaceChildren();
  for (const v of ["B", "A", "C"] as Ver[]) {
    if (v === "B") {
      const h2 = document.createElement("h2");
      h2.id = "B"; h2.textContent = `${VERSION_NAME.B}: the version chosen for the game`;
      root.append(h2);
      versionBlock(v, root, true);
    } else {
      const d = document.createElement("details");
      d.id = v;
      if (params.get("open")) d.open = true;
      const sum = document.createElement("summary");
      sum.textContent = `${VERSION_NAME[v]} (not chosen)`;
      d.append(sum);
      versionBlock(v, d, false);
      root.append(d);
    }
  }
}

function bar(): void {
  const b = document.getElementById("bar")!;
  const link = (href: string, text: string) => { const a = document.createElement("a"); a.href = href; a.textContent = text; b.append(a); };
  link("#scenes", "Scenes");
  for (const f of FAMILIES) link(`#${f.id}`, f.title);
  link("#A", "A 8-bit"); link("#C", "C flat");
  for (const s of [1, 2, 4]) {
    const btn = document.createElement("button");
    btn.textContent = `${s}x`; btn.setAttribute("aria-pressed", String(s === scale));
    btn.onclick = () => { scale = s; document.querySelectorAll("header button").forEach((e) => e.setAttribute("aria-pressed", String(e === btn))); render(); };
    b.append(btn);
  }
}

// A and C are collapsed by default: a closed <details> has no layout box, so they are skipped while hidden.
bar(); render();
const loop = (t: number) => { for (const l of live) if (l.el.offsetParent !== null) l.draw(t); requestAnimationFrame(loop); };
requestAnimationFrame(loop);
