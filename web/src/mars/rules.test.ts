import { describe, expect, it } from "vitest";
import { ACTIVITIES, ACTIVITY_IDS } from "./activities";
import { TASKS } from "./tasks";
import { MODULES } from "./modules";
import { GOOD_DESIGN, MIDDLING_DESIGN, POOR_DESIGN, DESIGN_FIXTURES, deriveCapabilities } from "./capabilities";
import { demoControllers } from "./demo";
import { playRun } from "./controllers";
import { RUN_SOLS, ROLES, type PlayerId } from "./types";
import { fresh, only, occ, pick, step } from "./testkit";
import { MarsWorld } from "./world";
import { Commander, Engineer, Scientist, CommsOfficer, Player } from "./player";
import { generateMap, findPath, dist } from "./map";
import { playSeed } from "./balance";

const BASE_TILE = (w: MarsWorld) => ({ kind: "tile" as const, x: w.map.base.x, y: w.map.base.y });

describe("structure", () => {
  it("has an abstract Player and one class per role with their own skills and activities", () => {
    const w = fresh();
    expect(w.players.map((p) => p.constructor)).toEqual([Commander, Engineer, Scientist, CommsOfficer]);
    for (const p of w.players) {
      expect(p).toBeInstanceOf(Player);
      expect(p.skills.length).toBeGreaterThan(0);
      expect(p.activities.length).toBeGreaterThan(3);
    }
    // each role's own list differs from the others'
    const own = w.players.map((p) => p.activities.map((a) => a.id).filter((id) => !["rest", "shelter", "travel", "handOver"].includes(id)).join());
    expect(new Set(own).size).toBe(4);
  });

  it("keeps looks separate from roles: any look with any role", () => {
    const crew = ROLES.map((role, i) => ({ name: `P${i}`, role, look: (["compact", "compact", "round", "broad"] as const)[i]! }));
    const w = new MarsWorld({ seed: 1, design: GOOD_DESIGN.design, crew });
    expect(w.viewFor(0).self.look).toBe("compact");
    expect(w.viewFor(1).self.look).toBe("compact");
    expect(w.viewFor(0).self.role).toBe("commander");
  });
});

describe("capabilities handed over by Act 1", () => {
  it("are used as given, even when the design ids are unknown to the table", () => {
    const given = { ...deriveCapabilities(GOOD_DESIGN.design, GOOD_DESIGN.extras), warningLeadSols: 3, mapRadiusStart: 33, spares: 9 };
    const design = { format: "mars-x", power: "mars-y", orbit: "mars-z", radio: "mars-w" };
    const w = new MarsWorld({ seed: 1, design, capabilities: given });
    expect(w.caps).toEqual(given);
    expect(w.knownRadius).toBe(33);
    const derived = new MarsWorld({ seed: 1, design });
    expect(derived.caps).not.toEqual(given);
    playRun(w, demoControllers());
    expect(w.attempt()!.capabilities).toEqual(given);
    expect(w.attempt()!.design).toEqual(design);
  });
});

describe("the map", () => {
  it("is made from the seed: same seed same map, three sites at growing distances, all reachable", () => {
    const a = generateMap(7), b = generateMap(7), c = generateMap(8);
    expect(a).toEqual(b);
    expect(a.tiles).not.toEqual(c.tiles);
    expect(a.width).toBe(40); expect(a.height).toBe(24);
    for (let s = 1; s < 40; s++) {
      const m = generateMap(s);
      const d = m.sites.map((x) => dist(x.pos, m.base));
      expect(d[0]!).toBeLessThan(d[1]!); expect(d[1]!).toBeLessThan(d[2]!);
      for (const site of m.sites) expect(findPath(m, m.base, site.pos)).not.toBeNull();
    }
  });

  it("makes rough ground cost more to cross", () => {
    const m = generateMap(2);
    const flat = { ...m, tiles: m.tiles.map((r) => r.map(() => "." as const)) };
    const rough = { ...m, tiles: m.tiles.map((r) => r.map(() => "~" as const)) };
    const to = { x: m.base.x + 6, y: m.base.y };
    expect(findPath(rough, m.base, to)!.cost).toBeGreaterThan(findPath(flat, m.base, to)!.cost);
  });
});

describe("determinism and length", () => {
  const run = (seed: number, f = GOOD_DESIGN) => { const { world } = playSeed(seed, f); return JSON.stringify([world.records, world.result()]); };

  it("replays the same run from the same seed, design and choices", () => {
    expect(run(3)).toBe(run(3));
    expect(run(9, POOR_DESIGN)).toBe(run(9, POOR_DESIGN));
    // replaying the recorded choices through a scripted controller gives the same run
    const original = playSeed(4, GOOD_DESIGN).world;
    const w = fresh(4);
    for (const rec of original.records) { for (const c of rec.choices) w.choose(c); w.resolveSol(); }
    expect(JSON.stringify(w.result())).toBe(JSON.stringify(original.result()));
  });

  it("differs with another seed", () => { expect(run(3)).not.toBe(run(4)); });

  it("never lasts more than 30 sols, and a finished run stays finished", () => {
    for (const f of DESIGN_FIXTURES) for (let s = 1; s <= 12; s++) {
      const { world } = playSeed(s, f);
      expect(world.result()!.endedOnSol).toBeLessThanOrEqual(RUN_SOLS);
      expect(world.records.length).toBeLessThanOrEqual(RUN_SOLS);
      const before = JSON.stringify(world.result());
      world.resolveSol();
      expect(JSON.stringify(world.result())).toBe(before);
      expect(world.choose(pick(0, "rest")).ok).toBe(false);
    }
  });
});

describe("the mission list", () => {
  it("power up the base: the engineer builds the array, spending materials and power over sols", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    const mats = w.stock.materials, battery = w.battery;
    step(w, pick(1, "build", { kind: "module", id: "array" }));
    expect(w.modules.array.built).toBe(false);
    expect(w.stock.materials).toBeLessThan(mats);
    for (let i = 0; i < 4 && !w.modules.array.built; i++) step(w, pick(1, "build", { kind: "module", id: "array" }));
    expect(w.modules.array.built).toBe(true);
    expect(TASKS.find((t) => t.id === "power-up")!.isDone(w)).toBe(true);
    expect(w.stock.materials).toBeCloseTo(mats - MODULES.array.materialsKg, 3);
    expect(w.battery).toBeLessThan(battery);
  });

  it("raise the antenna", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    for (let i = 0; i < 6 && !w.modules.antenna.built; i++) step(w, pick(1, "build", { kind: "module", id: "antenna" }));
    expect(TASKS.find((t) => t.id === "antenna")!.isDone(w)).toBe(true);
  });

  it("a good design with demo play finishes the whole list on most seeds; each task is done on a winning run", () => {
    let wins = 0;
    for (let s = 1; s <= 20; s++) {
      const r = playSeed(s, GOOD_DESIGN).result;
      if (r.outcome === "won") { wins++; expect(r.tasks.every((t) => t.done)).toBe(true); expect(r.endedOnSol).toBeLessThanOrEqual(RUN_SOLS); }
    }
    expect(wins).toBeGreaterThan(10);
  });

  it("a sample counts only once its data is sent home through the satellite", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    w.sites["site-1"].sampled = true; w.sites["site-1"].inLab = true;
    const samples = TASKS.find((t) => t.id === "samples")!;
    expect(samples.progress(w).done).toBe(0);
    w.modules.antenna.built = true;
    step(w, pick(2, "analyse"), pick(3, "rest"));
    step(w, pick(2, "analyse"));
    expect(w.sites["site-1"].analysed).toBe(true);
    expect(samples.progress(w).done).toBe(0); // analysed, not yet sent
    for (let i = 0; i < 6 && !w.siteDelivered("site-1"); i++) { if (!w.sat.passToday) w.sat.passToday = true, w.sat.passCapLeft = w.caps.relayMbPerSol; step(w, pick(3, "sendData")); }
    expect(w.siteDelivered("site-1")).toBe(true);
    expect(samples.progress(w).done).toBe(1);
  });

  it("save the satellite: a fault is diagnosed and recovered; left alone, the satellite is lost", () => {
    const w = fresh(1, GOOD_DESIGN, only(occ("satellite-fault", 1, 5)));
    w.modules.antenna.built = true;
    const task = TASKS.find((t) => t.id === "satellite")!;
    expect(w.sat.fault).not.toBeNull();
    for (let i = 0; i < 5 && !task.isDone(w); i++) step(w, pick(3, w.sat.fault?.diagnosed ? "recoverSatellite" : "diagnoseSatellite"));
    expect(task.isDone(w)).toBe(true);
    const lost = fresh(1, GOOD_DESIGN, only(occ("satellite-fault", 1, 5)));
    for (let i = 0; i < 6; i++) step(lost);
    expect(lost.sat.lost).toBe(true);
    expect(task.isFailed(lost)).toBe(true);
  });
});

describe("losing", () => {
  it("the window closes first", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    w.modules.array.built = true;
    while (w.status === "running") step(w);
    expect(w.result()).toMatchObject({ outcome: "lost", loseReason: "window-closed", endedOnSol: RUN_SOLS });
  });

  it("a vital resource runs out", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    w.stock.oxygen = 0;
    step(w);
    expect(w.result()).toMatchObject({ outcome: "lost", loseReason: "resource-exhausted" });
  });

  it("nobody is left able to work", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    for (const p of w.players) p.dose = 599.9;
    step(w);
    expect(w.result()).toMatchObject({ outcome: "lost", loseReason: "crew-lost" });
  });

  it("every lose condition and every hazard shows up in the balance runs", async () => {
    const reasons = new Set<string>(), hazards = new Set<string>();
    for (const f of DESIGN_FIXTURES) for (let s = 1; s <= 80; s++) {
      const r = playSeed(s, f).result;
      if (r.loseReason) reasons.add(r.loseReason);
      r.hazardsSeen.forEach((h) => hazards.add(h));
    }
    expect([...reasons].sort()).toEqual(["crew-lost", "resource-exhausted", "window-closed"]);
    expect([...hazards].sort()).toEqual(["cold-night", "dust-settling", "dust-storm", "satellite-fault", "solar-storm"]);
  });
});

describe("hazards", () => {
  const built = (h: ReturnType<typeof occ>[]) => { const w = fresh(1, GOOD_DESIGN, h); w.modules.array.built = true; return w; };

  it("a dust storm cuts the array's output and settles dust on it", () => {
    const calm = built([]), storm = built(only(occ("dust-storm", 1, 6, 1)));
    step(calm); step(storm); step(calm); step(storm); // the second sol of a storm is at full strength
    expect(storm.lastPower.generatedWh).toBeLessThan(calm.lastPower.generatedWh * 0.5);
    expect(storm.dust).toBeGreaterThan(calm.dust);
  });

  it("a cold night drains the battery", () => {
    const calm = built([]), cold = built(only(occ("cold-night", 1)));
    step(calm); step(cold);
    expect(cold.battery).toBeLessThan(calm.battery);
  });

  it("dust settles on the array every sol, and clearing it brings the output back", () => {
    const w = built([]);
    for (let i = 0; i < 8; i++) step(w, pick(1, "rest"));
    const dusty = w.dust, out = w.lastPower.generatedWh;
    expect(dusty).toBeGreaterThan(0.1);
    step(w, pick(1, "clearDust"));
    step(w, pick(1, "clearDust"));
    expect(w.dust).toBeLessThan(dusty);
    expect(w.lastPower.generatedWh).toBeGreaterThan(out);
  });

  it("a solar storm gives dose unless sheltered, and shelter gives much less", () => {
    const w = built(only(occ("solar-storm", 1)));
    step(w, pick(0, "travel", { kind: "tile", x: w.map.base.x + 3, y: w.map.base.y }), pick(1, "shelter"), pick(2, "rest"));
    const [outside, sheltered, indoors] = [w.players[0]!.dose, w.players[1]!.dose, w.players[2]!.dose];
    expect(outside).toBeGreaterThan(200);
    expect(indoors).toBeLessThan(outside);
    expect(sheltered).toBeLessThan(indoors);
  });

  it("a warning that arrives in time lets players shelter", () => {
    const w = built(only(occ("solar-storm", 4)));
    expect(w.caps.warningLeadSols).toBeGreaterThan(0);
    const shared = () => w.views().find((v) => v.shared)!.shared!;
    step(w); // sol 1 resolved; sol 2 begins
    expect(shared().forecast[0]).toMatchObject({ hazard: "solar-storm", inSols: 2 });
    step(w); // sol 2 resolved; sol 3 begins
    expect(shared().forecast[0]).toMatchObject({ hazard: "solar-storm", inSols: 1 });
    step(w, pick(0, "rest"), pick(1, "rest"), pick(2, "rest"), pick(3, "rest")); // sol 3
    step(w, pick(0, "shelter"), pick(1, "shelter"), pick(2, "shelter"), pick(3, "rest")); // sol 4: the storm
    expect(w.players[0]!.dose).toBeLessThan(40);
    expect(w.players[3]!.dose).toBeGreaterThan(w.players[0]!.dose);
  });

  it("the satellite's own faults cost the crew its passes", () => {
    const w = fresh(1, GOOD_DESIGN, only(occ("satellite-fault", 1, 5)));
    expect(w.sat.fault).not.toBeNull();
    expect(w.sat.passToday).toBe(false);
    expect(w.viewFor(0).shared!.satellite.state).toBe("trouble");
  });
});

describe("crew gauges", () => {
  const gauge = (w: MarsWorld, p: PlayerId, id: string) => w.viewFor(p).self.gauges.find((g) => g.id === id)!.value;

  it("radiation: raised by a solar storm, treated by first aid", () => {
    const w = fresh(1, GOOD_DESIGN, only(occ("solar-storm", 1)));
    step(w, pick(2, "travel", { kind: "tile", x: w.map.base.x + 4, y: w.map.base.y }));
    const hit = gauge(w, 2, "radiation");
    expect(hit).toBeGreaterThan(100);
    step(w, pick(2, "travel", BASE_TILE(w)));
    step(w, pick(0, "firstAid", { kind: "player", id: 2 }));
    expect(gauge(w, 2, "radiation")).toBeLessThan(hit);
  });

  it("energy and rest: lowered by hard work, restored by a quiet sol", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    const e0 = w.players[1]!.energy;
    w.players[1]!.energy = 60; // after hard work the night's sleep does not make it all back
    step(w, pick(1, "build", { kind: "module", id: "array" }));
    w.players[1]!.rest = 50;
    const worked = gauge(w, 1, "energy"), r1 = gauge(w, 1, "rest");
    expect(worked).toBeLessThan(e0);
    expect(r1).toBeLessThan(100);
    step(w, pick(1, "rest"));
    expect(gauge(w, 1, "rest")).toBeGreaterThan(r1);
    expect(gauge(w, 1, "energy")).toBeGreaterThan(worked);
  });

  it("air, water and food: lowered away from the stores, restored at the base", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    const p = w.players[2]!;
    p.position = { x: w.map.base.x + 6, y: w.map.base.y };
    step(w, pick(2, "rest"));
    for (const id of ["air", "water", "food"]) expect(gauge(w, 2, id)).toBeLessThan(100);
    p.position = { ...w.map.base };
    step(w, pick(2, "rest")); step(w, pick(2, "rest"));
    for (const id of ["air", "water", "food"]) expect(gauge(w, 2, id)).toBe(100);
  });

  it("body: lowered when the base runs out of power, restored by first aid", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    w.battery = 0; // no array yet: the lander's panels cannot carry the base load
    step(w);
    const hurt = gauge(w, 1, "body");
    expect(hurt).toBeLessThan(100);
    w.modules.array.built = true; w.battery = 9000; // power is back
    step(w, pick(0, "firstAid", { kind: "player", id: 1 }));
    expect(gauge(w, 1, "body")).toBeGreaterThan(hurt);
  });

  it("morale: lowered while cut off, restored by rest and first aid", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    const p = w.players[2]!;
    p.position = { x: w.map.base.x + 14, y: w.map.base.y };
    step(w); step(w); step(w);
    expect(gauge(w, 2, "morale")).toBeLessThan(gauge(w, 0, "morale")); // she was cut off, they were not
    p.morale = 40;
    p.position = { ...w.map.base }; p.linkGuard = true;
    step(w, pick(2, "rest")); // back at the base, resting
    step(w, pick(2, "rest"));
    expect(gauge(w, 2, "morale")).toBeGreaterThan(40);
  });

  it("a low gauge slows a player: the same job gets less done", () => {
    const a = fresh(1, GOOD_DESIGN, []), b = fresh(1, GOOD_DESIGN, []);
    b.players[1]!.energy = 20; b.players[1]!.morale = 20; b.players[1]!.body = 20;
    step(a, pick(1, "build", { kind: "module", id: "array" }));
    step(b, pick(1, "build", { kind: "module", id: "array" }));
    expect(b.modules.array.progress).toBeLessThan(a.modules.array.progress);
  });

  it("a gauge that runs out puts the player out for the rest of the run; the others cover", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    w.players[1]!.body = 0.5; w.battery = 0;
    step(w);
    const dev = w.players[1]!;
    expect(dev.out).not.toBeNull();
    expect(w.viewFor(1).self.status).toBe("out");
    expect(w.viewFor(1).options).toEqual([]);
    expect(w.choose(pick(1, "build", { kind: "module", id: "array" })).ok).toBe(false);
    w.battery = 9000;
    for (let i = 0; i < 12 && !w.modules.array.built; i++) step(w, pick(0, "build", { kind: "module", id: "array" }), pick(3, "build", { kind: "module", id: "array" }));
    expect(w.modules.array.built).toBe(true); // built by the commander and the comms officer, with the engineer out
    expect(w.players[1]!.out).not.toBeNull();
  });
});

describe("any role may attempt any activity", () => {
  it("offers every activity to every role, marking the role's own and the skilled", () => {
    const w = fresh(1);
    for (const p of w.players) {
      const v = w.viewFor(p.id);
      expect(v.options.map((o) => o.id).sort()).toEqual([...ACTIVITY_IDS].sort());
      expect(v.options.filter((o) => o.own).length).toBe(p.activities.length);
    }
    expect(w.viewFor(1).options.find((o) => o.id === "build")).toMatchObject({ own: true, skilled: true });
    expect(w.viewFor(0).options.find((o) => o.id === "build")).toMatchObject({ own: false, skilled: false });
    expect(ACTIVITIES.build.skill).toBe("construction");
  });

  it("without the skill a job takes longer and goes wrong more often", () => {
    let engProgress = 0, cmdProgress = 0, engFail = 0, cmdFail = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const w = fresh(seed, GOOD_DESIGN, []);
      const r = step(w, pick(0, "build", { kind: "module", id: "array" }), pick(1, "build", { kind: "module", id: "array" }));
      const evs = r.events.filter((e) => e.kind === "work");
      cmdFail += evs.some((e) => e.players[0] === 0 && e.ok === false) ? 1 : 0;
      engFail += evs.some((e) => e.players[0] === 1 && e.ok === false) ? 1 : 0;
      // progress split: run each alone
      const a = fresh(seed, GOOD_DESIGN, []); step(a, pick(1, "build", { kind: "module", id: "array" })); engProgress += a.modules.array.progress;
      const b = fresh(seed, GOOD_DESIGN, []); step(b, pick(0, "build", { kind: "module", id: "array" })); cmdProgress += b.modules.array.progress;
    }
    expect(cmdProgress).toBeLessThan(engProgress);
    expect(cmdFail).toBeGreaterThan(engFail);
  });

  it("every activity can be attempted by every role without breaking the world", () => {
    for (const id of ACTIVITY_IDS) for (const role of [0, 1, 2, 3] as PlayerId[]) {
      const w = fresh(2, GOOD_DESIGN, []);
      w.modules.array.built = true;
      const target = w.viewFor(role).options.find((o) => o.id === id)!.targets[0] ?? (id === "travel" ? BASE_TILE(w) : { kind: "none" as const });
      w.choose(pick(role, id, target));
      expect(() => w.resolveSol()).not.toThrow();
    }
  });
});

describe("links", () => {
  /** Put player 2 out of range of the handheld communicator and let a sol pass, so their link is down. */
  function cutOff(seed = 1) {
    const w = fresh(seed, GOOD_DESIGN, []);
    w.players[2]!.position = { x: w.map.base.x + 12, y: w.map.base.y };
    step(w, pick(2, "rest"));
    return w;
  }

  it("distance from the base antenna cuts a link", () => {
    const w = cutOff();
    expect(w.players[2]!.linked).toBe(false);
    expect(w.players[2]!.linkCause).toBe("distance");
    expect(w.stats.linkCuts.distance).toBeGreaterThan(0);
  });

  it("the antenna reaches farther out", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    w.modules.antenna.built = true;
    w.players[2]!.position = { x: w.map.base.x + 12, y: w.map.base.y };
    step(w);
    expect(w.players[2]!.linked).toBe(true);
  });

  it("a dust storm, a solar storm and the satellite in trouble each cut links", () => {
    const total = (h: ReturnType<typeof occ>) => {
      let n = 0;
      for (let s = 1; s <= 30; s++) { const w = fresh(s, GOOD_DESIGN, only(h)); step(w); step(w); n += Object.entries(w.stats.linkCuts).filter(([k]) => k === h.hazard).reduce((a, [, v]) => a + v, 0); }
      return n;
    };
    expect(total(occ("dust-storm", 1, 5))).toBeGreaterThan(0);
    expect(total(occ("solar-storm", 1))).toBeGreaterThan(0);
    expect(total(occ("satellite-fault", 1, 5))).toBeGreaterThan(0);
  });

  it("the antenna shortens failures", () => {
    const cuts = (antenna: boolean) => {
      let n = 0;
      for (let s = 1; s <= 25; s++) {
        const w = fresh(s, GOOD_DESIGN, only(occ("dust-storm", 1, 9, 1)));
        w.modules.antenna.built = antenna;
        for (let i = 0; i < 8; i++) { step(w); n += w.players.filter((p) => !p.linked).length; }
      }
      return n;
    };
    expect(cuts(true)).toBeLessThan(cuts(false));
  });

  it("the communications officer restores a link; the engineer repairs the hardware", () => {
    let restored = 0, tries = 0;
    for (let s = 1; s <= 40; s++) {
      const w = fresh(s, GOOD_DESIGN, []);
      const p = w.players[0]!;
      p.linked = false; p.linkCause = "hardware"; p.linkDownSols = 3; // a failed communicator at the base
      w.choose(pick(3, "restoreLink", { kind: "player", id: 0 }));
      w.resolveSol();
      tries++; if (w.players[0]!.linked) restored++;
    }
    expect(restored / tries).toBeGreaterThan(0.6);
    const w = fresh(1, GOOD_DESIGN, []);
    w.players[0]!.commIntegrity = 30;
    const spares = w.stock.spares;
    for (let i = 0; i < 4 && w.players[0]!.commIntegrity <= 30; i++) step(w, pick(1, "repair", { kind: "player", id: 0 }));
    expect(w.players[0]!.commIntegrity).toBeGreaterThan(30);
    expect(w.stock.spares).toBeLessThan(spares);
  });
});

describe("the cut-off rule", () => {
  function setup() {
    const w = fresh(1, GOOD_DESIGN, []);
    w.players[2]!.position = { x: w.map.base.x + 12, y: w.map.base.y };
    step(w, pick(2, "rest")); // sol 1: she is out of range; sol 2 begins with her link down
    return w;
  }

  it("a cut-off player's view has their surroundings and gauges, and none of the shared picture", () => {
    const w = setup();
    const blind = w.viewFor(2), seeing = w.viewFor(0);
    expect(blind.self.linked).toBe(false);
    expect(blind.shared).toBeNull();
    expect(blind.plans).toBeNull();
    expect(blind.surroundings.patch.rows.length).toBeGreaterThan(0);
    expect(blind.self.gauges.length).toBe(8);
    expect(blind.options.length).toBe(ACTIVITY_IDS.length);
    expect(blind.briefing.join(" ")).not.toMatch(/forecast|expected|storm front/i);
    expect(JSON.stringify(blind)).not.toMatch(/"(forecast|resources|tasks|crew|satellite|news)"/);
    expect(seeing.shared).not.toBeNull();
    expect(seeing.shared!.crew[2]).toMatchObject({ linked: false, plan: null, health: null });
  });

  it("a blind player can still act on anything; the team does not see the choice until the link returns", () => {
    const w = setup();
    expect(w.choose(pick(2, "travel", { kind: "tile", x: w.map.base.x + 6, y: w.map.base.y })).ok).toBe(true);
    w.choose(pick(0, "plan"));
    expect(w.viewFor(0).plans!.some((p) => p.player === 2)).toBe(false);
    expect(w.viewFor(2).plans).toBeNull();
    expect(w.viewFor(2).myChoice).toMatchObject({ activity: "travel" });
    const report = w.resolveSol();
    // the team's evening report leaves out what she did
    const team = w.eveningFor(0);
    expect(team.events.some((e) => e.players.includes(2) && e.kind !== "link")).toBe(false);
    expect(team.lines.join(" ")).not.toMatch(/Ines (walked|rested)/);
    expect(report.events.some((e) => e.players.includes(2) && e.kind === "move" && e.scope === "solo")).toBe(true);
    // she reads her own sol
    expect(w.eveningFor(2).events.some((e) => e.kind === "move")).toBe(true);
    expect(w.viewFor(0).shared!.crew[2]!.known.filter((k) => k.sol >= 2)).toEqual([]);
  });

  it("when the link returns, what they did alone appears for the team", () => {
    const w = setup();
    w.choose(pick(2, "travel", BASE_TILE(w)));
    w.players[2]!.position = { x: w.map.base.x + 3, y: w.map.base.y }; // (she is walking in)
    w.players[2]!.linkGuard = true; // as if her communicator comes back tonight
    w.resolveSol(); // sol 2: she walked in, within range; sol 3 begins with her link up
    const v = w.viewFor(0);
    expect(v.shared!.crew[2]!.linked).toBe(true);
    expect(v.shared!.crew[2]!.known.some((k) => k.activity === "travel")).toBe(true);
    expect(w.news.join(" ")).toMatch(/Ines is back in contact after 1 sol alone/);
    expect(v.briefing.join(" ")).toMatch(/Ines is back in contact/);
  });

  it("the demo's cut-off player really is blind: it plays from its own view", () => {
    const w = setup();
    const view = w.viewFor(2);
    const ctl = demoControllers()[2]!;
    const c = ctl.choose(view);
    expect(c).not.toBeNull();
    expect(c!.player).toBe(2);
  });
});

describe("the satellite shapes what the crew has", () => {
  it("derives capabilities that rise from the poor to the middling to the good design", () => {
    const [good, mid, poor] = [GOOD_DESIGN, MIDDLING_DESIGN, POOR_DESIGN].map((f) => deriveCapabilities(f.design, f.extras)) as [ReturnType<typeof deriveCapabilities>, ReturnType<typeof deriveCapabilities>, ReturnType<typeof deriveCapabilities>];
    for (const k of ["mapRadiusStart", "relayMbPerSol", "dsnMbPerSol", "warningLeadSols", "satPowerMargin", "relayStorageMb", "supplyDays", "materialsKg", "spares", "passSolFraction"] as const) {
      expect(good[k], k).toBeGreaterThanOrEqual(mid[k]);
      expect(mid[k], k).toBeGreaterThanOrEqual(poor[k]);
    }
    expect(good.faultPerSol).toBeLessThan(poor.faultPerSol);
    expect(good.passesPerSol).toBeLessThanOrEqual(4); expect(poor.passesPerSol).toBeGreaterThanOrEqual(2);
    expect(good.passMinutes).toBeLessThanOrEqual(17); expect(poor.passMinutes).toBeGreaterThanOrEqual(10);
    expect(good.relayRateMbps).toBeLessThanOrEqual(2);
  });

  it("a better instrument reveals more of the map and more sites before anyone walks", () => {
    const known = (f: typeof GOOD_DESIGN) => {
      let tiles = 0, sites = 0;
      for (let seed = 1; seed <= 8; seed++) {
        const v = fresh(seed, f, []).views().find((x) => x.shared)!.shared!;
        tiles += v.map.rows.join("").split("").filter((c) => c !== "?").length; sites += v.sites.length;
      }
      return { tiles, sites };
    };
    const [g, m, p] = [known(GOOD_DESIGN), known(MIDDLING_DESIGN), known(POOR_DESIGN)];
    expect(g.tiles).toBeGreaterThan(m.tiles); expect(m.tiles).toBeGreaterThanOrEqual(p.tiles);
    expect(g.sites).toBeGreaterThanOrEqual(m.sites); expect(m.sites).toBeGreaterThanOrEqual(p.sites);
    expect(g.sites).toBeGreaterThan(p.sites);
  });

  it("a better radio brings the storm warning earlier", () => {
    const firstWarning = (radio: string) => {
      const w = fresh(1, { ...GOOD_DESIGN, design: { ...GOOD_DESIGN.design, radio } }, only(occ("solar-storm", 8)));
      for (let s = 1; s < 8; s++) { if (w.viewFor(0).shared!.forecast.length) return s; step(w); }
      return 99;
    };
    expect(firstWarning("sband")).toBeLessThan(firstWarning("uhf"));
  });

  it("a poor design's warning is shorter than a good design's", () => {
    expect(POOR_DESIGN.name).toBe("poor");
    expect(fresh(1, POOR_DESIGN).caps.warningLeadSols).toBeLessThan(fresh(1, GOOD_DESIGN).caps.warningLeadSols);
  });

  it("orbit, storage and radio change what a pass can carry", () => {
    const w = fresh(1, GOOD_DESIGN, []), p = fresh(1, POOR_DESIGN, []);
    expect(w.viewFor(3).shared!.satellite.storageMb).toBeGreaterThan(p.viewFor(3).shared!.satellite.storageMb);
    expect(w.caps.relayMbPerSol).toBeGreaterThan(p.caps.relayMbPerSol);
  });
});

describe("four people are four visible people", () => {
  it("start on four different tiles around the lander", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const w = fresh(seed);
      const keys = new Set(w.players.map((p) => `${p.position.x},${p.position.y}`));
      expect(keys.size).toBe(4);
      for (const p of w.players) expect(w.atBase(p)).toBe(true);
    }
  });

  it("never end a move on the same tile when a free tile is next to them", () => {
    for (let seed = 1; seed <= 12; seed++) {
      const w = fresh(seed, GOOD_DESIGN, []);
      const site = w.siteOf("site-1").pos;
      for (let i = 0; i < 6; i++) {
        step(w, ...([0, 1, 2, 3] as PlayerId[]).map((id) => pick(id, "travel", { kind: "tile", x: site.x, y: site.y })));
        const keys = w.players.filter((p) => p.active).map((p) => `${p.position.x},${p.position.y}`);
        expect(new Set(keys).size).toBe(keys.length);
      }
    }
  });
});

describe("supplies: who the base feeds and when a pack is used", () => {
  const far = (w: MarsWorld) => ({ kind: "tile" as const, x: Math.min(38, w.map.base.x + 25), y: w.map.base.y });

  it("a player who walks out without loading is not out of air, water and food within four sols", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    w.modules.array.built = true;
    for (let i = 0; i < 4; i++) step(w, pick(1, "travel", far(w)));
    const dev = w.players[1]!;
    expect(dev.out).toBeNull();
    expect(Math.min(dev.air, dev.water, dev.food)).toBeGreaterThan(0);
    expect(w.atBase(dev)).toBe(false);
  });

  it("the base feeds everyone within three tiles from its stores and leaves their pack alone", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    w.modules.array.built = true;
    const stock = w.stock.oxygen;
    step(w, pick(1, "moveSupplies", { kind: "player", id: 1 }));
    const loaded = w.players[1]!.carry.rations;
    expect(loaded).toBeGreaterThan(0);
    step(w, pick(1, "rest"));
    expect(w.players[1]!.carry.rations).toBe(loaded);
    expect(w.stock.oxygen).toBeLessThan(stock);
  });

  it("away from the base the pack is used, one sol of supplies a sol", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    w.modules.array.built = true;
    w.players[1]!.carry.rations = 3;
    w.players[1]!.position = { x: w.map.base.x + 6, y: w.map.base.y };
    step(w, pick(1, "rest"));
    expect(w.players[1]!.carry.rations).toBe(2);
    expect(w.players[1]!.air).toBe(100);
  });
});

describe("what the screen needs the view to say", () => {
  const shared = (w: MarsWorld) => w.views().find((v) => v.shared)!.shared!;

  it("tells a located site from a visited, sampled, analysed and sent one, and counts the ones under fog", () => {
    const w = fresh(3, MIDDLING_DESIGN, []);
    w.modules.antenna.built = true; // so the player who walks out keeps contact and the team sees what they see
    const sh = shared(w);
    expect(sh.sites.length + sh.hiddenSites).toBe(3);
    const located = sh.sites.find((s) => s.state === "located");
    expect(located).toBeDefined();
    expect(located!.visited).toBe(false);
    const id = located!.id;
    w.players[2]!.position = { ...w.siteOf(id).pos };
    step(w, pick(2, "rest"));
    expect(shared(w).sites.find((s) => s.id === id)!.state).toBe("visited");
    w.sites[id].sampled = true;
    expect(shared(w).sites.find((s) => s.id === id)!.state).toBe("sampled");
    w.sites[id].analysed = true;
    expect(shared(w).sites.find((s) => s.id === id)!.state).toBe("analysed");
    w.sites[id].sentMb = 100;
    expect(shared(w).sites.find((s) => s.id === id)!.state).toBe("sent");
    w.sites[id].earthMb = 800;
    expect(shared(w).sites.find((s) => s.id === id)!.state).toBe("delivered");
  });

  it("shows a teammate who is out as collapsed to anyone who can see them", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    w.players[1]!.out = "body";
    const seen = w.viewFor(0).surroundings.objects.find((o) => o.kind === "player" && o.id === "1")!;
    expect(seen).toMatchObject({ out: true, look: "broad" });
    const other = w.viewFor(0).surroundings.objects.find((o) => o.kind === "player" && o.id === "2")!;
    expect(other.out).toBe(false);
  });

  it("reports gauge changes in the events as they happen, with the player, the gauge and the new value", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    w.modules.array.built = true;
    const r = step(w, pick(1, "build", { kind: "module", id: "antenna" }), pick(2, "travel", { kind: "tile", x: w.map.base.x + 6, y: w.map.base.y }));
    const g = r.events.filter((e) => e.kind === "gauge" && e.gauge);
    expect(g.some((e) => e.players[0] === 1 && e.gauge === "energy" && typeof e.value === "number")).toBe(true);
    const e1 = g.find((e) => e.players[0] === 1 && e.gauge === "energy")!;
    expect(e1.value).toBeLessThan(100);
    // order: the sol's work comes first, so gauge events are interleaved with it, not only at the end
    const firstGauge = r.events.findIndex((e) => e.gauge), lastWork = r.events.map((e) => e.kind).lastIndexOf("work");
    expect(firstGauge).toBeLessThan(r.events.length - 1);
    expect(lastWork).toBeGreaterThan(-1);
    // evening lines stay readable: no gauge spam
    expect(r.lines.join(" ")).not.toMatch(/is now/);
  });
});

describe("helping each other", () => {
  const near = (w: MarsWorld, d: number) => ({ x: w.map.base.x + d, y: w.map.base.y });

  it("a player hands a teammate beside them what they carry: samples, supplies and a spare part", () => {
    const w = fresh(2, GOOD_DESIGN, []);
    const [a, b] = [w.players[2]!, w.players[1]!];
    a.position = near(w, 5); b.position = { x: a.position.x, y: a.position.y + 1 };
    a.carry = { rations: 6, samples: ["site-1"], spares: 1 };
    w.choose(pick(2, "handOver", { kind: "player", id: 1 }));
    w.resolveSol();
    expect(b.carry.samples).toEqual(["site-1"]);
    expect(a.carry.samples).toEqual([]);
    expect(b.carry.rations).toBe(2); // 3 handed over, 1 eaten tonight (away from the base)
    expect(a.carry.rations).toBe(2); // 6 - 3 handed over - 1 eaten
    expect(b.carry.spares).toBe(1);
  });

  it("any role can hand over, and the sample reaches the base sooner by relay", () => {
    for (const giver of [0, 1, 2, 3] as PlayerId[]) {
      const w = fresh(2, GOOD_DESIGN, []);
      const p = w.players[giver]!, q = w.players[(giver + 1) % 4]!;
      p.position = near(w, 8); q.position = { x: p.position.x, y: p.position.y + 1 };
      p.carry.samples = ["site-2"];
      expect(w.choose(pick(giver, "handOver", { kind: "player", id: q.id })).ok).toBe(true);
      w.resolveSol();
      expect(q.carry.samples).toEqual(["site-2"]);
    }
  });

  it("nothing to hand over is refused", () => {
    const w = fresh(2, GOOD_DESIGN, []);
    expect(w.choose(pick(2, "handOver", { kind: "player", id: 1 })).ok).toBe(false);
  });

  it("brings supplies out to a teammate away from the base and restores their air, water and food", () => {
    for (const bringer of [0, 3] as PlayerId[]) {
      const w = fresh(2, GOOD_DESIGN, []);
      w.modules.array.built = true;
      const far = w.players[2]!;
      far.position = near(w, 5); far.air = far.water = far.food = 20;
      const stock = w.rationsInStock();
      expect(w.choose(pick(bringer, "bringSupplies", { kind: "player", id: 2 })).ok).toBe(true);
      const r = w.resolveSol();
      expect(r.events.some((e) => e.kind === "supplies" && /loaded/.test(e.text))).toBe(true);
      expect(w.rationsInStock()).toBeLessThan(stock); // loaded at the base
      expect(far.carry.rations).toBeGreaterThan(0);
      expect(far.air).toBeGreaterThan(20);
      expect(far.water).toBeGreaterThan(20);
      expect(far.food).toBeGreaterThan(20);
    }
  });

  it("the commander's logistics carries more in one load", () => {
    const load = (who: PlayerId) => { const w = fresh(2, GOOD_DESIGN, []); w.players[2]!.position = near(w, 4); w.choose(pick(who, "bringSupplies", { kind: "player", id: 2 })); w.resolveSol(); return w.players[2]!.carry.rations; };
    expect(load(0)).toBeGreaterThan(load(3));
  });

  it("a spare part loaded for someone can be used by them away from the stores", () => {
    const w = fresh(2, GOOD_DESIGN, []);
    w.players[1]!.carry.spares = 1; w.stock.spares = 0;
    w.players[0]!.commIntegrity = 20;
    w.choose(pick(1, "repair", { kind: "player", id: 0 }));
    w.resolveSol();
    expect(w.players[1]!.carry.spares).toBe(0);
    expect(w.players[0]!.commIntegrity).toBeGreaterThan(20);
  });
});
