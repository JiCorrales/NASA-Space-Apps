// The demo script: plays one role sensibly from ITS OWN PlayerView and nothing else (no world, no other
// player's state). A cut-off player therefore really is blind: `view.shared` is null and it can use only
// what it saw and remembered. It keeps a small memory of the views it was given, as a person would.
import { TEAM } from "./data";
import type { Choice, PlayerController, PlayerId, PlayerView, Pos, SharedView, SiteId, Target } from "./types";

const NONE: Target = { kind: "none" };
const cheb = (a: Pos, b: Pos) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

interface Memory {
  base: Pos | null;
  sites: Map<SiteId, { pos: Pos; sampled: boolean }>;
  assigned: SiteId | null;
  lab: number;
  analyseTries: number;
  shared: SharedView | null;
}

export class DemoController implements PlayerController {
  private mem: Memory = { base: null, sites: new Map(), assigned: null, lab: 0, analyseTries: 0, shared: null };
  constructor(readonly player: PlayerId) {}

  choose(view: PlayerView): Choice | null {
    if (view.self.status === "out") return null;
    this.observe(view);
    const t = new Turn(view, this.mem);
    const c = view.shared ? t.linked() : t.blind();
    return { player: this.player, activity: c.activity, target: c.target };
  }

  private observe(v: PlayerView) {
    const m = this.mem;
    if (v.shared) {
      m.base = v.shared.map.base; m.shared = v.shared;
      for (const s of v.shared.sites) m.sites.set(s.id, { pos: s.pos, sampled: s.sampled });
    }
    for (const o of v.surroundings.objects) if (o.kind === "site") m.sites.set(o.id as SiteId, { pos: o.pos, sampled: o.state === "sampled" });
    if (!m.base) m.base = { x: v.self.position.x, y: v.self.position.y }; // everyone starts at the base
    if (v.self.carrying.samples.length > 0 && cheb(v.self.position, m.base) <= 2) m.lab += v.self.carrying.samples.length;
  }
}

class Turn {
  constructor(private v: PlayerView, private m: Memory) {}
  private get me() { return this.v.self; }
  private get base(): Pos { return this.m.base!; }
  private get atBase() { return cheb(this.me.position, this.base) <= 2; }
  private get nearBase() { return cheb(this.me.position, this.base) <= 3; }
  private ok(id: string) { return this.v.options.find((o) => o.id === id && !o.blocked); }
  private act(id: Choice["activity"], target: Target = NONE) { return { activity: id, target }; }
  private gauge(id: string) { return this.me.gauges.find((g) => g.id === id)?.value ?? 100; }
  private rest() { return this.act("rest"); }

  private weary(): boolean {
    const e = this.gauge("energy"), r = this.gauge("rest");
    return this.atBase ? e < 35 || r < 25 : e < 12 || r < 8;
  }

  // ----------------------------------------------------------------- field work (shared by all roles)

  private fieldSite(): SiteId | null {
    const unsampled = [...this.m.sites].filter(([, s]) => !s.sampled).map(([id, s]) => ({ id, d: cheb(s.pos, this.base) }));
    if (unsampled.length === 0) return null;
    const a = this.m.assigned;
    if (a && unsampled.some((u) => u.id === a)) return a;
    const claimed = new Set<SiteId>();
    const sh = this.v.shared;
    if (sh) {
      for (const c of sh.crew) {
        if (c.id === this.me.id || c.status === "out") continue;
        const last = c.known[c.known.length - 1];
        if (last?.activity === "sample" && last.target.kind === "site") claimed.add(last.target.id);
      }
      for (const p of this.v.plans ?? []) if (p.player < this.me.id && p.activity === "sample" && p.target.kind === "site") claimed.add(p.target.id);
    }
    const free = unsampled.filter((u) => !claimed.has(u.id)).sort((x, y) => x.d - y.d);
    const pick = free[0]?.id ?? null;
    this.m.assigned = pick;
    return pick;
  }

  private tripRations(id: SiteId): number {
    const d = cheb(this.m.sites.get(id)!.pos, this.base);
    return Math.min(TEAM.packMax.value, 2 * Math.ceil((d * 1.6) / TEAM.moveBudget.value) + 1);
  }

  private fieldWork(): { activity: Choice["activity"]; target: Target } | null {
    if (this.me.carrying.samples.length > 0) {
      if (this.atBase) return null; // deposited tonight; something else to do today
      return this.act("travel", { kind: "tile", x: this.base.x, y: this.base.y });
    }
    const id = this.fieldSite();
    if (!id) return null;
    if (this.nearBase && this.me.carrying.rations < this.tripRations(id)) {
      const commanderLoads = this.v.shared?.crew.some((c) => c.role === "commander" && c.status === "active" && c.linked) && this.me.role !== "commander";
      if (!commanderLoads && this.ok("moveSupplies")) return this.act("moveSupplies", { kind: "player", id: this.me.id });
    }
    return this.act("sample", { kind: "site", id });
  }

  // ----------------------------------------------------------------- linked: the shared picture

  linked() {
    const sh = this.v.shared!;
    if (this.weary()) return this.rest();
    const first = {
      commander: () => this.commander(sh), engineer: () => this.engineer(sh), scientist: () => this.scientist(sh), comms: () => this.comms(sh),
    }[this.me.role]();
    return first ?? this.rest();
  }

  private urgentNeed(sh: SharedView) {
    // everyone: a solar warning for tomorrow or today means shelter; the dose is not worth a sol of work
    const solar = sh.forecast.find((w) => w.hazard === "solar-storm" && w.inSols <= 1);
    return solar && this.atBase ? this.act("shelter") : null;
  }

  private mod(sh: SharedView, id: string) { return sh.modules.find((m) => m.id === id)!; }

  private commander(sh: SharedView) {
    const sheltered = this.urgentNeed(sh); if (sheltered) return sheltered;
    if (this.gauge("body") < 50 && this.ok("firstAid")) return this.act("firstAid", { kind: "player", id: this.me.id });
    for (const c of sh.crew) {
      if (c.status !== "active" || c.id === this.me.id || !c.health || !this.ok("firstAid")) continue;
      const body = c.health.find((g) => g.id === "body")?.value ?? 100, mor = c.health.find((g) => g.id === "morale")?.value ?? 100;
      if ((body < 50 || mor < 25) && cheb(c.position, this.base) <= 3 && this.atBase) return this.act("firstAid", { kind: "player", id: c.id });
    }
    const unsampled = sh.sites.some((s) => !s.sampled);
    if (unsampled && this.atBase && this.ok("moveSupplies")) {
      for (const c of sh.crew) {
        const fielder = c.role === "scientist" || (c.role === "engineer" && this.mod(sh, "array").status !== "absent" && this.mod(sh, "antenna").status === "working");
        if (c.status === "active" && c.linked && fielder && c.carrying && c.carrying.rations < 3 && c.carrying.samples.length === 0 && cheb(c.position, this.base) <= 2 && !sh.crew.every(() => false))
          return this.act("moveSupplies", { kind: "player", id: c.id });
      }
    }
    const work = this.fieldWork();
    if (work && this.v.sol >= 2) return work;
    if (this.ok("plan")) return this.act("plan");
    return null;
  }

  private engineer(sh: SharedView) {
    const sheltered = this.urgentNeed(sh); if (sheltered) return sheltered;
    const array = this.mod(sh, "array"), antenna = this.mod(sh, "antenna"), storage = this.mod(sh, "storage");
    const build = (id: string) => (this.ok("build") ? this.act("build", { kind: "module", id: id as "array" }) : null);
    if (this.me.carrying.samples.length === 0 && !this.atBase && cheb(this.me.position, this.base) > 3 && !this.m.assigned) return this.act("travel", { kind: "tile", x: this.base.x, y: this.base.y });
    if (array.status === "absent" || array.status === "building") { const b = build("array"); if (b) return b; }
    if (antenna.status === "absent" || antenna.status === "building") { const b = build("antenna"); if (b) return b; }
    if ((array.status === "damaged" || array.wear >= 30) && this.ok("repair")) return this.act("repair", { kind: "module", id: "array" });
    if (array.dust >= 0.2 && this.ok("clearDust")) return this.act("clearDust");
    for (const c of sh.crew) if (c.status === "active" && c.commHealth !== null && c.commHealth < 55 && this.ok("repair") && (c.id === this.me.id || cheb(c.position, this.me.position) <= 3)) return this.act("repair", { kind: "player", id: c.id });
    const work = this.fieldWork();
    if (work) return work;
    if (storage.status === "absent" && this.v.sol < 18) { const b = build("storage"); if (b) return b; }
    return null;
  }

  private scientist(sh: SharedView) {
    const sheltered = this.urgentNeed(sh); if (sheltered) return sheltered;
    if (this.atBase && sh.labSamples.length > 0 && this.ok("analyse")) return this.act("analyse");
    if (this.atBase && sh.sites.length < 3 && this.ok("readMap") && this.v.sol <= 6) return this.act("readMap");
    const work = this.fieldWork();
    if (work) return work;
    if (sh.sites.length < 3 && sh.sites.every((s) => s.sampled)) return this.explore();
    return null;
  }

  private comms(sh: SharedView) {
    const sheltered = this.urgentNeed(sh); if (sheltered) return sheltered;
    if (sh.satellite.state === "trouble") {
      if (this.ok("diagnoseSatellite")) return this.act("diagnoseSatellite");
      if (this.ok("recoverSatellite")) return this.act("recoverSatellite");
    }
    const range = this.mod(sh, "antenna").status === "working" ? TEAM.antennaRange.value : TEAM.handheldRange.value;
    for (const c of sh.crew) {
      if (c.status === "active" && !c.linked && c.id !== this.me.id && cheb(c.position, this.base) < range - 2 && this.ok("restoreLink")) return this.act("restoreLink", { kind: "player", id: c.id });
    }
    const buffer = sh.resources.find((r) => r.kind === "data")?.value ?? 0;
    if (buffer > 0 && this.atBase) {
      if (sh.satellite.passToday && this.ok("sendData")) return this.act("sendData");
      if (!sh.satellite.passToday && this.ok("schedulePass")) return this.act("schedulePass");
    }
    if (this.atBase && sh.labSamples.length > 0 && !sh.crew.some((c) => c.role === "scientist" && c.status === "active" && c.linked && cheb(c.position, this.base) <= 2) && this.ok("analyse")) return this.act("analyse");
    if (this.mod(sh, "antenna").status !== "working" && this.mod(sh, "array").status === "working" && this.ok("build") && sh.crew.every((c) => c.role !== "engineer" || c.status === "out")) return this.act("build", { kind: "module", id: "antenna" });
    // second pair of hands in the field once the base is up
    if (this.mod(sh, "antenna").status === "working") { const work = this.fieldWork(); if (work) return work; }
    return null;
  }

  private explore() {
    const me = this.me.position;
    return this.act("travel", { kind: "tile", x: Math.min(39, me.x + 8), y: me.y });
  }

  // ----------------------------------------------------------------- blind: surroundings, own gauges, memory

  blind() {
    if (this.weary()) return this.rest();
    const objs = this.v.surroundings.objects;
    const mod = (id: string) => objs.find((o) => o.kind === "module" && o.id === id);
    const role = this.me.role;
    if (this.gauge("body") < 45 && this.ok("firstAid")) return this.act("firstAid", { kind: "player", id: this.me.id });
    if (role === "comms" && this.ok("restoreLink") && cheb(this.me.position, this.base) <= TEAM.handheldRange.value - 2) return this.act("restoreLink", { kind: "player", id: this.me.id });
    if (this.atBase && this.m.lab > 0 && (role === "scientist" || role === "comms") && this.ok("analyse") && this.m.analyseTries < 2 * this.m.lab) {
      this.m.analyseTries++;
      if (this.m.analyseTries >= 2) { this.m.lab--; this.m.analyseTries = 0; }
      return this.act("analyse");
    }
    if (role === "engineer" && this.atBase) {
      for (const id of ["array", "antenna"]) { const o = mod(id); if (o && (o.state === "absent" || o.state === "building") && this.ok("build")) return this.act("build", { kind: "module", id: id as "array" }); }
      const a = mod("array");
      if (a?.state === "damaged" && this.ok("repair")) return this.act("repair", { kind: "module", id: "array" });
      if (a?.state === "dusty" && this.ok("clearDust")) return this.act("clearDust");
    }
    const work = this.fieldWork();
    if (work) return work;
    if (!this.atBase) return this.act("travel", { kind: "tile", x: this.base.x, y: this.base.y });
    return this.rest();
  }
}

/** One demo controller per player. */
export const demoControllers = (): DemoController[] => ([0, 1, 2, 3] as PlayerId[]).map((i) => new DemoController(i));
