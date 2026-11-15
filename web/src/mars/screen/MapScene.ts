// The map of one panel, drawn from the player's PlayerView and animated from the sol's events. Plain class: the
// canvas component feeds it through a ref and a requestAnimationFrame loop, so React never re-renders per frame.
// It draws only what the view says; the one thing it adds is a static roster (who wears which look) so that a
// character the player can see is drawn in the right suit.
import type { CrewSetup, ModuleId, ModuleStatus, ObjectView, PlayerId, PlayerView, Pos, SiteId, SolEvent, SolReport } from "../types";
import type { Sprite } from "../art/paint";
import { hash } from "../art/worldkit";
import { BASE_ART, CHARS, EXTRA, GEAR, HAZ, LOOK_ART, SAT, T, bmp, pickFrame } from "./sprites";

export const TILE = 16;
const WALK_TILES_PER_S = 6;

export interface SceneInput {
  view: PlayerView;
  roster: CrewSetup[];
  /** The view after the sol, known while the sol plays: modules reach their new look when their event arrives. */
  after: PlayerView | null;
  report: SolReport | null;
  /** Changes when a new sol starts to play. */
  playId: number;
  reduced: boolean;
  /** 1 normal, 4 fast forward. */
  speed: number;
  /** Phase of the sol: the sky darkens through playing and the evening. */
  phase: "briefing" | "choosing" | "playing" | "evening" | "ended";
  /** Players whose link just returned: what they did alone is shown on the others' maps. */
  reveals: { player: PlayerId; paths: Pos[][] }[];
  onBeat?: (e: SolEvent) => void;
  onDone?: () => void;
}

interface Beat { start: number; end: number; ev: SolEvent }
interface Walker { x: number; y: number; facing: "down" | "up" | "left" | "right"; mode: "stand" | "walk" | "work" | "rest"; bubble: { key: string; until: number } | null }
interface Ring { x: number; y: number; until: number; colour: string; from: number }

const SPEECH: Record<string, string> = { alert: "emote_alert", done: "emote_done", question: "emote_question" };

export class MapScene {
  input: SceneInput | null = null;
  private clock = 0;
  private playId = -1;
  private beats: Beat[] = [];
  private started = new Set<number>();
  private walkers = new Map<PlayerId, Walker>();
  private night = 0;
  private dust = 0;
  private moduleOverride = new Map<ModuleId, { status: ModuleStatus; progress: number }>();
  private dusty = false;
  private storm: { from: number; until: number } | null = null;
  private solarUntil = 0;
  private frostUntil = 0;
  private passUntil = 0;
  private passFrom = 0;
  private rings: Ring[] = [];
  private toast: { text: string; until: number } | null = null;
  private doneSent = true;
  private lastViewKey = "";
  private endAt = 0;

  /** Total length of the beats of the sol, seconds. */
  get length(): number { return this.endAt; }

  setInput(input: SceneInput): void {
    const prev = this.input;
    this.input = input;
    const key = `${input.view.sol}:${input.view.self.position.x},${input.view.self.position.y}:${input.phase === "playing" ? "p" : "n"}`;
    if (input.playId !== this.playId) { this.playId = input.playId; this.startSol(input); }
    else if (input.phase !== "playing" && (key !== this.lastViewKey || prev?.view !== input.view)) this.snapToView(input.view);
    this.lastViewKey = key;
  }

  /** Characters stand where the view says. */
  private snapToView(view: PlayerView): void {
    const seen = this.people(view);
    for (const [id, o] of seen) {
      const w = this.walkers.get(id) ?? { x: o.pos.x, y: o.pos.y, facing: "down", mode: "stand", bubble: null };
      w.x = o.pos.x; w.y = o.pos.y; w.mode = "stand"; w.bubble = null;
      this.walkers.set(id, w);
    }
    for (const id of [...this.walkers.keys()]) if (!seen.has(id)) this.walkers.delete(id);
    this.moduleOverride.clear();
    this.dusty = false; this.rings = []; this.toast = null;
  }

  private people(view: PlayerView): Map<PlayerId, { pos: Pos; out: boolean }> {
    // a character is drawn in the suit of the roster; `o.id` is the player's id (its `state` is the role)
    const out = new Map<PlayerId, { pos: Pos; out: boolean }>();
    out.set(view.self.id, { pos: view.self.position, out: view.self.status === "out" });
    if (view.shared) for (const c of view.shared.crew) { if (c.id !== view.self.id) out.set(c.id, { pos: c.position, out: c.status === "out" }); }
    else for (const o of view.surroundings.objects) if (o.kind === "player") out.set(Number(o.id) as PlayerId, { pos: o.pos, out: o.state === "out" });
    return out;
  }

  /** Whether this player may see the event with their own eyes or through the team link. */
  private visible(ev: SolEvent, view: PlayerView): boolean {
    if (ev.players.includes(view.self.id)) return true;
    if (view.self.linked) return ev.scope === "team";
    return ev.kind === "hazard" || ev.kind === "sky";
  }

  private startSol(input: SceneInput): void {
    this.beats = []; this.started.clear(); this.rings = []; this.toast = null; this.clock = 0; this.endAt = 0;
    this.snapToView(input.view);
    if (!input.report || input.phase !== "playing") { this.doneSent = true; return; }
    const events = input.report.events.filter((e) => this.visible(e, input.view));
    const free = new Map<number, number>();
    let barrier = 0, all = 0;
    const per = (ev: SolEvent): number => ev.kind === "move" ? Math.max(0.5, (ev.path?.length ?? 1) / WALK_TILES_PER_S) : ev.kind === "work" ? 1.1 : ev.kind === "hazard" ? 1.8 : ev.kind === "pass" ? 1.8 : 0.7;
    for (const ev of events) {
      const d = input.reduced ? 0.05 : per(ev);
      const mine = ev.players.length > 0 && (ev.kind === "move" || ev.kind === "work" || ev.kind === "gauge");
      const start = mine ? Math.max(barrier, ...ev.players.map((p) => free.get(p) ?? 0)) : Math.max(barrier, all);
      const end = start + d;
      this.beats.push({ start, end, ev });
      if (mine) ev.players.forEach((p) => free.set(p, end)); else barrier = end;
      all = Math.max(all, end);
    }
    this.endAt = all + (input.reduced ? 0.05 : 0.6);
    this.doneSent = false;
  }

  step(dt: number): void {
    const input = this.input; if (!input) return;
    const view = input.view;
    const targetNight = input.phase === "evening" || input.phase === "ended" ? 0.85 : input.phase === "playing" ? Math.min(0.4, this.clock / Math.max(1, this.endAt) * 0.4) : 0;
    const frostNight = this.clock < this.frostUntil ? 1 : 0;
    this.night += (Math.max(targetNight, frostNight * 0.8) - this.night) * Math.min(1, dt * 1.5);
    const sky = view.surroundings.sky;
    const stormNow = this.storm && this.clock >= this.storm.from && this.clock < this.storm.until;
    const targetDust = Math.max(sky === "hazy" ? 0.25 : sky === "dust" ? 0.6 : sky === "dark" ? 1 : 0, stormNow ? 0.7 : 0);
    this.dust += (targetDust - this.dust) * Math.min(1, dt * 1.2);
    if (input.phase !== "playing") { this.clock += dt; return; }
    this.clock += dt * input.speed;
    for (const b of this.beats) {
      const idx = b.ev.order;
      if (!this.started.has(idx) && this.clock >= b.start) { this.started.add(idx); this.begin(b); }
      const w = b.ev.players.length === 1 ? this.walkers.get(b.ev.players[0]!) : undefined;
      if (w && this.clock >= b.start && this.clock < b.end) this.during(b, w);
      else if (w && this.clock >= b.end && this.started.has(idx) && w.mode !== "stand" && b.ev.kind !== "move") w.mode = "stand";
    }
    if (!this.doneSent && this.clock >= this.endAt) { this.doneSent = true; this.input?.onDone?.(); }
  }

  private begin(b: Beat): void {
    const ev = b.ev, input = this.input!, now = this.clock;
    input.onBeat?.(ev);
    const ring = (at: Pos | undefined, colour: string, dur = 0.9) => { if (at) this.rings.push({ x: at.x, y: at.y, until: now + dur, from: now, colour }); };
    const w = ev.players.length === 1 ? this.walkers.get(ev.players[0]!) : undefined;
    switch (ev.kind) {
      case "move": if (w && ev.path?.length) { w.mode = "walk"; } break;
      case "work": if (w) { w.mode = ev.activity === "rest" || ev.activity === "shelter" ? "rest" : "work"; } break;
      case "hazard":
        if (ev.hazard === "dust-storm") this.storm = { from: b.start, until: b.start + 4 };
        if (ev.hazard === "solar-storm") this.solarUntil = b.end + 1.5;
        if (ev.hazard === "cold-night") this.frostUntil = b.end + 3;
        if (ev.hazard === "dust-settling") this.dusty = true;
        this.toast = { text: ev.text, until: now + 2.2 };
        break;
      case "pass": this.passFrom = now; this.passUntil = now + 2.4; this.toast = { text: "Satellite pass", until: now + 1.8 }; break;
      case "link":
        if (w) { w.bubble = { key: ev.ok ? "emote_done" : "emote_question", until: now + 2 }; ring(w ? { x: w.x, y: w.y } : ev.at, ev.ok ? "#62d394" : "#ff6464", 1.4); }
        this.toast = { text: ev.text, until: now + 2 };
        break;
      case "module": {
        ring(ev.at, "#f3c04f", 1);
        const m = ev.module && input.after?.shared?.modules.find((x) => x.id === ev.module);
        if (m && ev.module) this.moduleOverride.set(ev.module, { status: m.status, progress: m.progress });
        else if (ev.module) { const o = input.after?.surroundings.objects.find((x) => x.kind === "module" && x.id === ev.module); if (o) this.moduleOverride.set(ev.module, { status: asStatus(o.state), progress: 1 }); }
        break;
      }
      case "task": ring(input.view.shared?.map.base ?? input.view.self.position, "#86dcf2", 1.4); this.toast = { text: ev.text, until: now + 2 }; break;
      case "data": ring(ev.at ?? (ev.site ? sitePos(input.view, ev.site) : undefined), "#86dcf2", 1); break;
      case "out": if (w) w.mode = "stand"; break;
      default: break;
    }
    if (ev.kind === "work" && w && ev.ok === true && ev.activity === "clearDust") this.dusty = false;
    if (ev.kind === "work" && w) w.bubble = { key: ev.ok === false ? "emote_alert" : "emote_done", until: b.end + 0.8 };
  }

  private during(b: Beat, w: Walker): void {
    const ev = b.ev;
    if (ev.kind !== "move" || !ev.path?.length) return;
    const full = [ev.from ?? ev.path[0]!, ...ev.path];
    const k = Math.min(1, (this.clock - b.start) / Math.max(0.01, b.end - b.start)) * (full.length - 1);
    const i = Math.min(full.length - 2, Math.floor(k)), f = k - i;
    const a = full[i]!, c = full[i + 1]!;
    w.x = a.x + (c.x - a.x) * f; w.y = a.y + (c.y - a.y) * f;
    const dx = c.x - a.x, dy = c.y - a.y;
    w.facing = Math.abs(dx) >= Math.abs(dy) && dx !== 0 ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : dy < 0 ? "up" : w.facing;
    w.mode = "walk";
    if (this.clock >= b.end - 0.02) { w.x = full.at(-1)!.x; w.y = full.at(-1)!.y; w.mode = "stand"; }
  }

  /* ------------------------------------------------------------ map reads */

  private tileChar(view: PlayerView, x: number, y: number): string {
    const sh = view.shared?.map;
    if (sh && x >= 0 && y >= 0 && x < sh.width && y < sh.height) { const c = sh.rows[y]?.[x]; if (c && c !== "?") return c; }
    const p = view.surroundings.patch, i = x - p.x0, j = y - p.y0;
    if (i >= 0 && j >= 0 && i < p.width && j < p.height) return p.rows[j]?.[i] ?? "?";
    return "?";
  }

  private ground(c: string, x: number, y: number, night: boolean): Sprite | null {
    const h = hash(x, y, 3);
    switch (c) {
      case ",": return pickFrame(T[night ? "nightRocky" : "rocky"]!, 0);
      case "~": return pickFrame(T[night ? "nightRipples" : "ripples"]!, 0);
      case "#": return pickFrame(T.cliff!, 0);
      case "?": return null;
      default: return pickFrame(T[`${night ? "nightRegolith" : "regolith"}${1 + Math.floor(h * 3)}`]!, 0);
    }
  }

  /* ------------------------------------------------------------ drawing */

  /** Draws the map into a canvas of `w` x `h` logical pixels (the caller sets the integer scale). */
  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const input = this.input; if (!input) return;
    const view = input.view, T0 = this.clock * 1000;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#05070f"; ctx.fillRect(0, 0, w, h);
    const me = this.walkers.get(view.self.id) ?? { x: view.self.position.x, y: view.self.position.y };
    const cx = Math.round((me.x + 0.5) * TILE - w / 2), cy = Math.round((me.y + 0.5) * TILE - h / 2);
    const blit = (s: Sprite, px: number, py: number, alpha = 1) => {
      const b = bmp(s); if (!b) return;
      if (alpha !== 1) ctx.globalAlpha = alpha;
      ctx.drawImage(b, Math.round(px - cx), Math.round(py - cy));
      if (alpha !== 1) ctx.globalAlpha = 1;
    };
    const night = this.night > 0.5;
    const x0 = Math.floor(cx / TILE), y0 = Math.floor(cy / TILE), x1 = Math.ceil((cx + w) / TILE), y1 = Math.ceil((cy + h) / TILE);
    for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) {
      const c = this.tileChar(view, tx, ty);
      const g = this.ground(c, tx, ty, night);
      if (!g) { this.fog(ctx, tx * TILE - cx, ty * TILE - cy); continue; }
      blit(g, tx * TILE, ty * TILE);
      if (c === "^") blit(pickFrame(T.boulder!, 0), tx * TILE, ty * TILE);
    }
    // objects sorted by their feet so the nearer ones cover the farther
    const items: { y: number; draw: () => void }[] = [];
    const baseP = view.shared?.map.base;
    if (baseP) items.push({ y: baseP.y - 1, draw: () => blit(pickFrame(BASE_ART.lander!, T0), baseP.x * TILE - 16, (baseP.y + 1) * TILE - 48 - 8) });
    for (const m of this.moduleList(view)) items.push({ y: m.pos.y, draw: () => this.drawModule(blit, m.id, m.pos, m.status, m.progress, T0, m.dust) });
    for (const s of this.siteList(view)) items.push({ y: s.pos.y - 0.2, draw: () => blit(pickFrame(T[s.sampled ? "siteSampled" : "siteFound"]!, T0), s.pos.x * TILE, s.pos.y * TILE) });
    for (const [id, wk] of this.walkers) items.push({ y: wk.y + 0.5, draw: () => this.drawPerson(blit, id, wk, T0) });
    items.sort((a, b) => a.y - b.y).forEach((i) => i.draw());
    // reveal of what a returned player did alone: their route, pulsing
    for (const r of input.reveals) for (const path of r.paths) path.forEach((p, i) => {
      if ((Math.floor(T0 / 250) + i) % 3 !== 0) return;
      blit(pickFrame(T.routeMarker!, T0), p.x * TILE, p.y * TILE, 0.9);
    });
    // rings (a module finishing, a link dropping or returning)
    for (const r of this.rings) if (this.clock < r.until) {
      const k = (this.clock - r.from) / (r.until - r.from), rad = 6 + Math.round(k * 12);
      ctx.strokeStyle = r.colour; ctx.lineWidth = 1; ctx.globalAlpha = 1 - k;
      ctx.strokeRect(Math.round((r.x + 0.5) * TILE - cx - rad), Math.round((r.y + 0.5) * TILE - cy - rad), rad * 2, rad * 2);
      ctx.globalAlpha = 1;
    }
    this.weather(ctx, w, h, T0);
    // the satellite's pass arc over the top of the map (only when the player can see the pass)
    if (this.clock < this.passUntil) {
      const k = (this.clock - this.passFrom) / Math.max(0.1, this.passUntil - this.passFrom);
      const arc = bmp(pickFrame(SAT.passArc!, 0)); if (arc) ctx.drawImage(arc, Math.round(w / 2 - 32), 2);
      const pt = bmp(pickFrame(SAT.satPoint!, T0)); const u = Math.min(1, Math.max(0, k)) * 2 - 1;
      if (pt) ctx.drawImage(pt, Math.round(w / 2 - 8 + u * 28), Math.round(2 + 20 - 19 * (1 - u * u) - 6));
    }
    if (this.toast && this.clock < this.toast.until) this.caption(ctx, this.toast.text, w);
  }

  private fog(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    ctx.fillStyle = "#0a0f1c"; ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#121a2c";
    for (let i = 0; i < TILE; i += 4) for (let j = (i / 4) % 2 ? 2 : 0; j < TILE; j += 4) ctx.fillRect(px + i, py + j, 1, 1);
  }

  private weather(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const input = this.input!;
    if (this.dust > 0.02) {
      ctx.fillStyle = `rgba(196,104,52,${(this.dust * 0.38).toFixed(3)})`; ctx.fillRect(0, 0, w, h);
      const sprite = bmp(pickFrame(HAZ[this.dust > 0.75 ? "dustStorm3" : this.dust > 0.4 ? "dustStorm2" : "dustStorm1"]!, t, 260));
      if (sprite) { ctx.globalAlpha = Math.min(0.85, this.dust); const o = Math.floor(t / 1000 * 18) % 32; for (let y = -32; y < h; y += 32) for (let x = -32; x < w + 32; x += 32) ctx.drawImage(sprite, x + o, y + Math.floor(o / 3) % 32 - 32); ctx.globalAlpha = 1; }
    }
    if (this.storm && this.clock >= this.storm.from && this.clock < this.storm.from + 2.2) {
      const f = bmp(pickFrame(HAZ.stormFront!, t)); const k = (this.clock - this.storm.from) / 2.2;
      if (f) for (let y = 0; y < h; y += 32) ctx.drawImage(f, Math.round(-64 + k * (w + 128)), y);
    }
    if (this.clock < this.solarUntil) {
      const sky = bmp(pickFrame(HAZ.solarStormSky!, t, 180)); if (sky) for (let x = 0; x < w; x += 64) ctx.drawImage(sky, x, 0);
      const r = bmp(pickFrame(HAZ.radiationOverlay!, t, 160)); if (r) { ctx.globalAlpha = 0.35; for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) ctx.drawImage(r, x, y); ctx.globalAlpha = 1; }
    }
    if (this.night > 0.02) { ctx.fillStyle = `rgba(6,10,44,${(this.night * 0.5).toFixed(3)})`; ctx.fillRect(0, 0, w, h); }
    if (input.view.self.status === "out") { ctx.fillStyle = "rgba(5,7,15,0.55)"; ctx.fillRect(0, 0, w, h); }
  }

  private caption(ctx: CanvasRenderingContext2D, text: string, w: number): void {
    ctx.font = "8px 'Press Start 2P', monospace";
    const tw = Math.min(w - 8, Math.ceil(ctx.measureText(text).width) + 8);
    ctx.fillStyle = "rgba(5,7,15,0.85)"; ctx.fillRect(Math.round((w - tw) / 2), 36, tw, 12);
    ctx.fillStyle = "#e4ecf5"; ctx.textBaseline = "middle"; ctx.fillText(text, Math.round((w - tw) / 2) + 4, 42, tw - 8);
  }

  private moduleList(view: PlayerView): { id: ModuleId; pos: Pos; status: ModuleStatus; progress: number; dust: boolean }[] {
    const out: { id: ModuleId; pos: Pos; status: ModuleStatus; progress: number; dust: boolean }[] = [];
    if (view.shared) for (const m of view.shared.modules) out.push({ id: m.id, pos: m.pos, status: m.status, progress: m.needed ? m.progress / m.needed : 0, dust: m.dust > 0.2 });
    else for (const o of view.surroundings.objects) if (o.kind === "module") out.push({ id: o.id as ModuleId, pos: o.pos, status: asStatus(o.state), progress: asStatus(o.state) === "working" ? 1 : 0.5, dust: o.state === "dusty" });
    return out.map((m) => { const ov = this.moduleOverride.get(m.id); return ov ? { ...m, status: ov.status, progress: ov.status === "working" ? 1 : ov.progress / (view.shared?.modules.find((x) => x.id === m.id)?.needed || 3) } : m; });
  }

  private siteList(view: PlayerView): { id: SiteId; pos: Pos; sampled: boolean }[] {
    const raw = view.shared ? view.shared.sites.map((s) => ({ id: s.id, pos: s.pos, sampled: s.sampled })) : view.surroundings.objects.filter((o: ObjectView) => o.kind === "site").map((o) => ({ id: o.id as SiteId, pos: o.pos, sampled: o.state === "sampled" }));
    // a site is only drawn where its tile is known: fog hides it
    return raw.filter((s) => this.tileChar(view, s.pos.x, s.pos.y) !== "?");
  }

  private drawModule(blit: (s: Sprite, x: number, y: number, a?: number) => void, id: ModuleId, pos: Pos, status: ModuleStatus, progress: number, t: number, dirty: boolean): void {
    let key: string | null = null;
    const ant = this.clock < this.passUntil;
    if (status === "absent") { return; }
    switch (id) {
      case "habitat": key = status === "damaged" ? "habitatDamaged" : status === "building" ? (progress < 0.5 ? "habitatFrame" : "habitatShell") : "habitatPowered"; break;
      case "array": key = status === "damaged" ? "solarDamaged" : status === "building" ? "solarStowed" : dirty || this.dusty || this.dust > 0.5 ? "solarDusty" : "solarClean"; break;
      case "antenna": key = status === "damaged" ? "antennaDamaged" : status === "building" ? (progress < 0.5 ? "antenna1" : "antenna2") : ant ? "antennaTransmit" : "antenna3"; break;
      case "storage": key = status === "damaged" ? "storageDamaged" : status === "building" ? "storage1" : "storage2"; break;
    }
    const s = pickFrame(BASE_ART[key!] ?? BASE_ART.storage1!, t, 300);
    const w = s.rows[0]?.length ?? 16, hh = s.rows.length;
    blit(s, pos.x * TILE + 8 - Math.floor(w / 2), (pos.y + 1) * TILE - hh);
    if (this.clock < this.frostUntil) blit(pickFrame(HAZ.frostModule!, 0), pos.x * TILE + 8 - 16, (pos.y + 1) * TILE - 32, 0.6);
  }

  private drawPerson(blit: (s: Sprite, x: number, y: number, a?: number) => void, id: PlayerId, wk: Walker, t: number): void {
    const who = this.input!.roster[id]; if (!who) return;
    const look = CHARS[LOOK_ART[who.look]], gear = GEAR[who.role];
    const out = (this.people(this.input!.view).get(id)?.out) ?? false;
    const self = id === this.input!.view.self.id;
    const cut = self && !this.input!.view.self.linked;
    let pose = out ? "out" : wk.mode === "walk" ? `walk_${wk.facing}` : wk.mode === "work" ? "work" : wk.mode === "rest" ? "rest" : cut ? "cutoff" : self && this.input!.view.self.carrying.samples.length ? "carry" : `stand_${wk.facing}`;
    const frames = look.poses[pose as keyof typeof look.poses] ?? look.poses.stand_down;
    const fi = Math.floor(t / 160) % frames.length;
    const px = Math.round(wk.x * TILE + 8 - 8), py = Math.round(wk.y * TILE + TILE - 24 - 1);
    // a soft shadow keeps the figure on the ground
    blit({ rows: ["..aaaaaa..", ".aaaaaaaa."], palette: { a: "rgba(5,7,15,0.35)" } }, px + 3, py + 22);
    blit(frames[fi]!, px, py);
    if (!out) { const g = (gear.overlays[LOOK_ART[who.look]] as Record<string, Sprite[]>)[pose]; if (g) blit(g[fi % g.length]!, px, py); }
    if (wk.bubble && this.clock < wk.bubble.until) { const e = EXTRA[wk.bubble.key]; if (e?.[0]) blit(e[0], px + 2, py - 12); }
    else if (cut && !out) blit(EXTRA.emote_question![0]!, px + 2, py - 12);
    void SPEECH;
  }
}

const asStatus = (s: string): ModuleStatus => (s === "dusty" ? "working" : s === "working" || s === "building" || s === "damaged" || s === "absent" ? s : "working");
const sitePos = (v: PlayerView, id: SiteId): Pos | undefined => v.shared?.sites.find((s) => s.id === id)?.pos ?? v.surroundings.objects.find((o) => o.id === id)?.pos;
