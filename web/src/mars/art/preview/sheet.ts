/**
 * The preview sheet: every asset in the three versions side by side, at 4x on the UI background and on
 * Mars ground, with 1x and 2x beside it, its name, size and number of colours, animated where it has frames.
 * Self-contained: no network, no fonts, no libraries.
 */
import { paint, spriteSize, type Sprite } from "../paint";
import { colourCount, type Version } from "../raster";

/** One frame is a stack of layers (a character with its gear, for example); the last layer is described. */
export type Frame = Sprite[];
export interface Entry {
  name: string;
  frames: Record<Version, Frame[]>;
  /** Milliseconds per frame. */
  ms?: number;
}
export interface Family {
  id: string;
  title: string;
  note?: string;
  entries: Entry[];
}

export const VERSION_TITLE: Record<Version, string> = { A: "A 8-bit", B: "B 16-bit", C: "C flat" };
const UI = { bg: "#05070f", panel: "#08111d", edge: "#2b3852", text: "#e4ecf5", text2: "#8394ab", accent: "#86dcf2" };

/** A Mars ground swatch per version, only for the preview (the terrain itself is the other half's work). */
export const PREVIEW_GROUND: Record<Version, { base: string; dots: string[] }> = {
  A: { base: "#b4532f", dots: ["#7a2f1d", "#d9884f"] },
  B: { base: "#a9502f", dots: ["#8a3d24", "#c26a3d", "#d98b55", "#6e2f1f"] },
  C: { base: "#bd6440", dots: ["#a8553a"] },
};

function ground(ctx: CanvasRenderingContext2D, v: Version, w: number, h: number, scale: number) {
  const g = PREVIEW_GROUND[v];
  ctx.fillStyle = g.base;
  ctx.fillRect(0, 0, w, h);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const n = Math.floor((w * h) / (scale * scale * 14));
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = g.dots[Math.floor(rnd() * g.dots.length)]!;
    const x = Math.floor(rnd() * (w / scale)) * scale, y = Math.floor(rnd() * (h / scale)) * scale;
    ctx.fillRect(x, y, scale * (rnd() < 0.3 ? 2 : 1), scale);
  }
}

const css = `
body{margin:0;background:${UI.bg};color:${UI.text};font:13px ui-monospace,"Cascadia Mono",Consolas,"Courier New",monospace}
h1{font-size:20px;margin:16px 20px 4px;color:${UI.accent}} p.lead{margin:0 20px 12px;color:${UI.text2}}
section.family{margin:12px 20px 28px;border-top:2px solid ${UI.edge};padding-top:8px}
section.family>h2{font-size:17px;margin:4px 0} section.family>p{color:${UI.text2};margin:2px 0 8px}
.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.col{background:${UI.panel};border:1px solid ${UI.edge};padding:8px}
.col>h3{margin:0 0 8px;font-size:15px;color:${UI.accent}}
.cells{display:flex;flex-wrap:wrap;gap:8px}
.cell{display:flex;flex-direction:column;gap:3px;width:min-content}
.cell .pics{display:flex;gap:4px;align-items:flex-end}
.cell canvas{image-rendering:pixelated;display:block}
.cell .name{color:${UI.text};font-size:11px;max-width:100%;overflow-wrap:anywhere}
.cell .meta{color:${UI.text2};font-size:10px}
`;

/** Draws the whole sheet into `root`. `#family=<id>` in the address shows one family only (for screenshots). */
export function renderSheet(root: HTMLElement, title: string, lead: string, families: Family[]): void {
  const only = new URLSearchParams(location.hash.slice(1)).get("family");
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  root.innerHTML = "";
  if (!only) {
    const h1 = document.createElement("h1");
    h1.textContent = title;
    const p = document.createElement("p");
    p.className = "lead";
    p.textContent = lead;
    root.append(h1, p);
  }
  const animated: (() => void)[] = [];
  for (const fam of families) {
    if (only && only !== fam.id) continue;
    const sec = document.createElement("section");
    sec.className = "family";
    sec.id = fam.id;
    const h2 = document.createElement("h2");
    h2.textContent = fam.title;
    sec.appendChild(h2);
    if (fam.note) {
      const p = document.createElement("p");
      p.textContent = fam.note;
      sec.appendChild(p);
    }
    const cols = document.createElement("div");
    cols.className = "cols";
    for (const v of ["A", "B", "C"] as Version[]) {
      const col = document.createElement("div");
      col.className = "col";
      const h3 = document.createElement("h3");
      h3.textContent = VERSION_TITLE[v];
      const cells = document.createElement("div");
      cells.className = "cells";
      for (const e of fam.entries) cells.appendChild(cell(e, v, animated));
      col.append(h3, cells);
      cols.appendChild(col);
    }
    sec.appendChild(cols);
    root.appendChild(sec);
  }
  const still = new URLSearchParams(location.hash.slice(1)).has("still");
  if (!still) setInterval(() => animated.forEach((f) => f()), 50);
}

function cell(e: Entry, v: Version, animated: (() => void)[]): HTMLElement {
  const frames = e.frames[v];
  const desc = frames[0]![frames[0]!.length - 1]!;
  const { w, h } = spriteSize(desc);
  const S = 4;
  const el = document.createElement("div");
  el.className = "cell";
  const pics = document.createElement("div");
  pics.className = "pics";
  const mk = (cw: number, ch: number) => {
    const c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    pics.appendChild(c);
    return c.getContext("2d")!;
  };
  const pad = 2;
  const dark = mk((w + pad * 2) * S, (h + pad * 2) * S);
  const mars = mk((w + pad * 2) * S, (h + pad * 2) * S);
  const small = mk(w * 3 + 12, h * 2 + 4);
  const draw = (i: number) => {
    const f = frames[i % frames.length]!;
    dark.fillStyle = UI.bg;
    dark.fillRect(0, 0, dark.canvas.width, dark.canvas.height);
    ground(mars, v, mars.canvas.width, mars.canvas.height, S);
    ground(small, v, small.canvas.width, small.canvas.height, 1);
    for (const layer of f) {
      paint(dark, layer, pad * S, pad * S, S);
      paint(mars, layer, pad * S, pad * S, S);
      paint(small, layer, 3, 2, 1);
      paint(small, layer, w + 8, 2, 2);
    }
  };
  draw(0);
  if (frames.length > 1) {
    const ms = e.ms ?? 300;
    let last = 0, i = 0;
    animated.push(() => {
      const now = performance.now();
      if (now - last >= ms) {
        last = now;
        draw(++i);
      }
    });
  }
  const name = document.createElement("div");
  name.className = "name";
  name.textContent = e.name;
  const meta = document.createElement("div");
  meta.className = "meta";
  const n = Math.max(...frames.map((f) => colourCount(f[f.length - 1]!)));
  meta.textContent = `${w}x${h} · ${n} col${frames.length > 1 ? ` · ${frames.length} fr` : ""}`;
  el.append(pics, name, meta);
  return el;
}
