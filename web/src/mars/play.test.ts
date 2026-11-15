import { describe, expect, it } from "vitest";
import demoSource from "./demo.ts?raw";
import { DESIGN_FIXTURES, GOOD_DESIGN, POOR_DESIGN } from "./capabilities";
import { ScreenController, playSol } from "./controllers";
import { DemoController, demoControllers } from "./demo";
import { History, MemoryStorage, HISTORY_KEY } from "./history";
import { fresh, pick, step, strings } from "./testkit";
import { playSeed, seedRange, balance, formatTable } from "./balance";
import { MarsWorld } from "./world";
import { RUN_SOLS } from "./types";

// A likelihood: a percentage, or the words that talk about odds.
const ODDS = /\d\s*%|\bpercent|chance|\brisk|probab|\bodds\b|likel/i;

describe("nothing is telegraphed", () => {
  it("no view, briefing or in-run report contains odds or likelihoods", () => {
    let count = 0;
    for (const f of DESIGN_FIXTURES) for (let seed = 1; seed <= 6; seed++) {
      const w = new MarsWorld({ seed, design: f.design, extras: f.extras });
      const ctl = demoControllers();
      while (w.status === "running") {
        const all = [...w.views().flatMap((v) => strings(v)), ...w.views().flatMap((v) => v.briefing)];
        for (const s of all) { count++; expect(s, s).not.toMatch(ODDS); }
        playSol(w, ctl);
        const evening = [0, 1, 2, 3].flatMap((i) => strings(w.eveningFor(i as 0)));
        for (const s of [...evening, ...strings(w.lastReport)]) expect(s, s).not.toMatch(ODDS);
      }
    }
    expect(count).toBeGreaterThan(2000);
  }, 60000);

  it("does not leak the satellite's fault rate or the hazard schedule", () => {
    const text = JSON.stringify(fresh(3).views());
    for (const k of ["faultPerSol", "passSolFraction", "satPowerMargin", "warningLeadSols", "startSol"]) expect(text).not.toContain(k);
  });

  it("causes are named only after the run", () => {
    const w = fresh(3);
    expect(w.result()).toBeNull();
    expect(w.attempt()).toBeNull();
    const { result } = playSeed(3, GOOD_DESIGN);
    expect(result.causes.length).toBeGreaterThan(0);
    expect(result.causes.map((c) => c.text).join(" ")).toMatch(/dust|satellite|battery/i);
  });
});

describe("controllers", () => {
  it("the demo is a function of its own view: it imports neither the world nor the players", () => {
    expect(demoSource).not.toMatch(/from "\.\/(world|player|activities|hazards|score)"/);
  });

  it("given the same views, two demo controllers choose the same", () => {
    const w = fresh(2);
    const a = new DemoController(1), b = new DemoController(1);
    for (let i = 0; i < 5; i++) {
      const v = w.viewFor(1);
      expect(a.choose(v)).toEqual(b.choose(JSON.parse(JSON.stringify(v))));
      w.resolveSol();
    }
  });

  it("the demo chooses something sensible for a blind player and for one who is out", () => {
    const w = fresh(2);
    const view = { ...w.viewFor(2), shared: null, plans: null };
    const c = new DemoController(2).choose(view);
    expect(c).not.toBeNull();
    const out = { ...w.viewFor(2), self: { ...w.viewFor(2).self, status: "out" as const } };
    expect(new DemoController(2).choose(out)).toBeNull();
  });

  it("a person's choice at the screen is what the world gets; it is dropped after the sol", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    const screen = new ScreenController(1);
    screen.set({ activity: "build", target: { kind: "module", id: "array" } });
    const ctl = [screen, ...[0, 2, 3].map((i) => new DemoController(i as 0))];
    const r = playSol(w, ctl);
    expect(r.choices.find((c) => c.player === 1)).toMatchObject({ activity: "build" });
    expect(screen.choose()).toBeNull();
  });

  it("linked players can change their choice after seeing the others; the world keeps the last", () => {
    const w = fresh(1, GOOD_DESIGN, []);
    w.choose(pick(0, "rest")); w.choose(pick(0, "plan"));
    expect(w.viewFor(1).plans).toContainEqual({ player: 0, activity: "plan", target: { kind: "none" } });
    expect(w.viewFor(0).myChoice).toMatchObject({ activity: "plan" });
  });
});

describe("score", () => {
  it("is only there after the run, and its components add up", () => {
    const w = fresh(4);
    expect(w.result()).toBeNull();
    for (const f of DESIGN_FIXTURES) for (let s = 1; s <= 8; s++) {
      const { result } = playSeed(s, f), sc = result.score;
      expect(sc.total).toBe(sc.components.tasks + sc.components.science + sc.components.resources + sc.components.decisions);
      expect(sc.tasksCompleted).toBe(result.tasks.filter((t) => t.done).length);
      expect(sc.perRole.map((r) => r.role)).toEqual(["commander", "engineer", "scientist", "comms"]);
      expect(sc.scienceDelivered.sites).toBeLessThanOrEqual(3);
      expect(result.outcome === "won").toBe(sc.tasksCompleted === sc.tasksTotal);
    }
  });

  it("rewards finishing more of the list", () => {
    const won = playSeed(1, GOOD_DESIGN).result.score.total, poor = playSeed(1, POOR_DESIGN).result.score.total;
    expect(won).toBeGreaterThan(poor);
  });
});

describe("history", () => {
  it("keeps every attempt and round-trips through storage", () => {
    const store = new MemoryStorage();
    const h = new History(store);
    expect(h.list()).toEqual([]);
    const a = playSeed(1, GOOD_DESIGN).world.attempt()!, b = playSeed(2, POOR_DESIGN).world.attempt()!;
    h.add(a); h.add(b);
    const back = new History(store).list();
    expect(back).toEqual(JSON.parse(JSON.stringify([a, b])));
    expect(back[0]!.design).toEqual(GOOD_DESIGN.design);
    expect(back[0]!.sols.length).toBe(a.result.endedOnSol);
    expect(back[0]!.result.outcome).toBe(a.result.outcome);
    h.clear();
    expect(h.list()).toEqual([]);
  });

  it("records who was cut off and what they did alone, with the cause", () => {
    let found = false;
    for (let s = 1; s <= 10 && !found; s++) {
      const at = playSeed(s, POOR_DESIGN).world.attempt()!;
      for (const rec of at.sols) for (const c of rec.cutOff) { found = true; expect(c.did.activity).toBeTruthy(); expect(c.cause).not.toBeUndefined(); }
      expect(at.sols.every((r) => r.choices.length > 0 && r.events.length >= 0)).toBe(true);
    }
    expect(found).toBe(true);
  });

  it("works with localStorage and survives a damaged entry", () => {
    localStorage.clear();
    const h = new History(localStorage);
    h.add(playSeed(5, GOOD_DESIGN).world.attempt()!);
    expect(new History(localStorage).list().length).toBe(1);
    localStorage.setItem(HISTORY_KEY, "{not json");
    expect(h.list()).toEqual([]);
    h.add(playSeed(5, GOOD_DESIGN).world.attempt()!);
    expect(h.list().length).toBe(1);
  });
});

describe("balance", () => {
  const n = 100; // raise for a closer look at the table
  it(`plays ${n} seeds per design: good wins clearly more often than not, poor loses most of the time`, () => {
    const rows = DESIGN_FIXTURES.map((f) => balance(f, seedRange(n)));
    console.log(`\n${formatTable(rows)}\n`);
    const [good, mid, poor] = rows as [typeof rows[0], typeof rows[0], typeof rows[0]];
    expect(good.winRate).toBeGreaterThanOrEqual(0.7);
    expect(poor.winRate).toBeLessThanOrEqual(0.15);
    expect(good.winRate).toBeGreaterThan(mid.winRate);
    expect(mid.winRate).toBeGreaterThan(poor.winRate);
    for (const t of rows) expect(Object.keys(t.endSols).length).toBeGreaterThan(0);
    expect(RUN_SOLS).toBe(30);
  }, 60000);
});

void step;
