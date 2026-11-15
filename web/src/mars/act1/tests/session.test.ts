import type { Group, MissionState, PageToUnity, ResourceKind, Step } from "../../../bridge/types";
import { BUDGET_DEFAULT_USD, GROUP_DEFS, MARS_SUN_FACTOR, REQUIREMENT_DEFS, WINDOW_MONTHS } from "../data";
import { GOOD_DESIGN, MIDDLING_DESIGN, POOR_DESIGN } from "../fixtures";
import { evaluate, defaultRequirements } from "../model";
import { MarsSession, STEPS } from "../session";

const choose = (group: Group, id: string): PageToUnity => ({ type: "choose", payload: { group, id } });
const toggle = (group: Group, id: string): PageToUnity => ({ type: "toggle", payload: { group, id } });
const complete = (step: Step): PageToUnity => ({ type: "completeStep", payload: { step } });
const statuses = (s: MissionState) => Object.fromEntries(s.steps.map((x) => [x.step, x.status]));
const res = (s: MissionState, k: ResourceKind) => s.resources.find((r) => r.kind === k)!;

/** A session with a whole design chosen through messages, as the screens would send them. */
function withDesign(design: Record<string, unknown>): MarsSession {
  const m = new MarsSession();
  for (const [g, v] of Object.entries(design)) {
    if (Array.isArray(v)) v.forEach((id) => m.handle(toggle(g as Group, id)));
    else if (typeof v === "string") m.handle(choose(g as Group, v));
  }
  return m;
}

describe("Mars session: the messages", () => {
  it("answers ready with a state the screens can draw, and pushes a state after every change", () => {
    const m = new MarsSession();
    const seen: MissionState[] = [];
    m.subscribe((s) => seen.push(s));
    m.handle({ type: "ready", payload: {} });
    expect(seen).toHaveLength(1);
    const s = seen[0]!;
    expect(s.mission.name).toBe("Mars Relay");
    expect(s.steps.map((x) => x.step)).toEqual(STEPS);
    expect(s.resources.map((r) => r.kind)).toEqual(["mass", "power", "budget", "data", "communications", "time"]);
    expect(s.worlds!.filter((w) => w.open).map((w) => w.id)).toEqual(["mars"]);
    expect(s.worlds!.length).toBeGreaterThan(1);
    expect(s.missions!.find((x) => x.open)!.world).toBe("mars");
    for (const g of GROUP_DEFS) expect(s.groups.find((x) => x.group === g.group)!.options.length).toBeGreaterThanOrEqual(2);
    m.handle(choose("region", "gale"));
    expect(seen).toHaveLength(2);
    expect(seen[1]!.design.region).toBe("gale");
  });

  it("choose sets single groups; unknown groups and ids are ignored", () => {
    const m = new MarsSession();
    m.handle(choose("orbit", "low-sso"));
    m.handle(choose("orbit", "areostationary"));
    expect(m.state().design.orbit).toBe("areostationary");
    m.handle(choose("orbit", "nope"));
    expect(m.state().design.orbit).toBe("areostationary");
    m.handle(choose("tests", "vibration")); // multi group: choose does nothing
    expect(m.state().design.tests).toEqual([]);
  });

  it("toggle adds and removes tests", () => {
    const m = new MarsSession();
    m.handle(toggle("tests", "vibration"));
    m.handle(toggle("tests", "ditl"));
    expect(m.state().design.tests).toEqual(["vibration", "ditl"]);
    m.handle(toggle("tests", "vibration"));
    expect(m.state().design.tests).toEqual(["ditl"]);
    m.handle(toggle("orbit", "low-sso")); // single group: toggle does nothing
    expect(m.state().design.orbit).toBeUndefined();
  });

  it("setRequirement clamps to the requirement's range; setReserve to 0..1", () => {
    const m = new MarsSession();
    m.handle({ type: "setRequirement", payload: { id: "dataPerSol", value: 400 } });
    expect(m.state().requirements.find((r) => r.id === "dataPerSol")!.value).toBe(400);
    m.handle({ type: "setRequirement", payload: { id: "dataPerSol", value: 99999 } });
    expect(m.state().requirements.find((r) => r.id === "dataPerSol")!.value).toBe(1000);
    m.handle({ type: "setRequirement", payload: { id: "deadline", value: -5 } });
    expect(m.state().requirements.find((r) => r.id === "deadline")!.value).toBe(12);
    m.handle({ type: "setRequirement", payload: { id: "unknown", value: 3 } });
    expect(m.state().requirements.map((r) => r.id)).toEqual(REQUIREMENT_DEFS.map((r) => r.id));
    m.handle({ type: "setReserve", payload: { fraction: 1.7 } });
    expect(m.state().reserve).toBe(1);
    m.handle({ type: "setReserve", payload: { fraction: 0.2 } });
    expect(m.state().reserve).toBe(0.2);
  });

  it("a budget requirement changes the budget resource, and the reserve takes its share", () => {
    const m = new MarsSession();
    m.handle({ type: "setRequirement", payload: { id: "budget", value: 3_000_000 } });
    m.handle({ type: "setReserve", payload: { fraction: 0.2 } });
    expect(res(m.state(), "budget").available).toBe(2_400_000);
  });

  it("close goes to the board and pushes no state", () => {
    const m = new MarsSession();
    const onClose = vi.fn();
    const push = vi.fn();
    m.setOnClose(onClose);
    m.subscribe(push);
    m.handle({ type: "close", payload: {} });
    expect(onClose).toHaveBeenCalledOnce();
    expect(push).not.toHaveBeenCalled();
  });

  it("every requirement has how it is checked and a source", () => {
    for (const r of new MarsSession().state().requirements) {
      expect(r.check.length).toBeGreaterThan(10);
      expect(r.source).toBeDefined();
      expect(r.min).toBeLessThanOrEqual(r.value);
      expect(r.max).toBeGreaterThanOrEqual(r.value);
    }
  });
});

describe("Mars session: the step rules", () => {
  it("forces the order the first time: only goals is open at the start", () => {
    expect(statuses(new MarsSession().state())).toEqual({
      goals: "open", concept: "locked", requirements: "locked", design: "locked", build: "locked", fly: "locked",
    });
  });

  it("finishing a step opens the next; a locked step cannot be finished", () => {
    const m = new MarsSession();
    m.handle(complete("design"));
    expect(statuses(m.state()).design).toBe("locked");
    m.handle(choose("region", "jezero"));
    m.handle(complete("goals"));
    expect(statuses(m.state())).toMatchObject({ goals: "done", concept: "open", requirements: "locked" });
  });

  it("a step finished with a choice skipped shows a problem, reported on that step; choosing clears it", () => {
    const m = new MarsSession();
    m.handle(complete("goals"));
    let s = m.state();
    expect(statuses(s).goals).toBe("problem");
    expect(statuses(s).concept).toBe("open"); // nothing is blocked
    expect(s.issues.find((i) => i.code === "region.missing")!.step).toBe("goals");
    m.handle(choose("region", "elysium"));
    s = m.state();
    expect(statuses(s).goals).toBe("done");
    expect(s.issues.some((i) => i.code === "region.missing")).toBe(false);
  });

  it("finished steps can be reopened and changed; they stay finished", () => {
    const m = withDesign(GOOD_DESIGN);
    for (const st of ["goals", "concept", "requirements", "design", "build"] as Step[]) m.handle(complete(st));
    expect(statuses(m.state()).fly).toBe("open");
    m.handle(choose("orbit", "high-circular"));
    m.handle(complete("concept"));
    expect(statuses(m.state())).toMatchObject({ concept: "done", fly: "open" });
  });

  it("a critical issue makes a finished design step a problem", () => {
    const m = withDesign({ ...GOOD_DESIGN, format: "3u" });
    for (const st of ["goals", "concept", "requirements", "design"] as Step[]) m.handle(complete(st));
    expect(statuses(m.state()).design).toBe("problem");
  });
});

describe("Mars session: the checks and the resources", () => {
  it("panels give 43% of their Earth power at Mars", () => {
    expect(MARS_SUN_FACTOR).toBeCloseTo(0.4307, 3);
    const m = withDesign({ power: "deploy" });
    expect(res(m.state(), "power").available).toBeCloseTo(6.2, 1);
    expect(res(m.state(), "power").known).toBe(true);
    const card = m.state().groups.find((g) => g.group === "power")!.options.find((o) => o.id === "deploy")!;
    expect(card.stats.find((x) => x.label === "At Mars")!.value).toBe(6.2);
    expect(card.stats.find((x) => x.label === "At Earth")!.value).toBe(14.4);
  });

  it("resources are 'not set yet' until the choice that sets their limit", () => {
    const s = new MarsSession().state();
    expect(res(s, "mass").known).toBe(false);
    expect(res(s, "power").known).toBe(false);
    expect(res(s, "data").known).toBe(false);
    expect(res(s, "communications").known).toBe(false);
    expect(res(s, "budget").known).toBe(true);
    expect(res(s, "time")).toMatchObject({ known: true, available: WINDOW_MONTHS });
  });

  it("mass: the parts plus propellant against the format, or the mass requirement if lower", () => {
    const m = withDesign(GOOD_DESIGN);
    const mass = res(m.state(), "mass");
    expect(mass.available).toBe(12);
    expect(mass.used).toBeCloseTo(8.0, 0);
    m.handle({ type: "setRequirement", payload: { id: "mass", value: 7 } });
    expect(res(m.state(), "mass").available).toBe(7);
    expect(m.state().issues.find((i) => i.code === "mass.over")!.severity).toBe("critical");
    // carried to orbit: no thruster, no propellant
    m.handle(choose("launch", "cargo-carried"));
    expect(res(m.state(), "mass").used).toBeCloseTo(mass.used - 2.1, 1);
  });

  it("power over the panels at Mars is critical", () => {
    const m = withDesign({ ...GOOD_DESIGN, power: "body" });
    const i = m.state().issues.find((x) => x.code === "power.over")!;
    expect(i.severity).toBe("critical");
    expect(i.message).toMatch(/at Mars/);
  });

  it("budget: over the reserve is a warning, over the whole budget is critical", () => {
    const m = withDesign(GOOD_DESIGN);
    m.handle({ type: "setRequirement", payload: { id: "budget", value: 2_100_000 } });
    expect(m.state().issues.find((i) => i.code === "budget.reserve")!.severity).toBe("warning");
    m.handle({ type: "setRequirement", payload: { id: "budget", value: 1_500_000 } });
    expect(m.state().issues.find((i) => i.code === "budget.over")!.severity).toBe("critical");
  });

  it("time: build and test months against the deadline", () => {
    const m = withDesign(GOOD_DESIGN);
    expect(res(m.state(), "time").used).toBeLessThanOrEqual(WINDOW_MONTHS);
    m.handle({ type: "setRequirement", payload: { id: "deadline", value: 12 } });
    expect(m.state().issues.find((i) => i.code === "time.over")).toBeDefined();
  });

  it("data: storage against three sols of data; communications: the smaller of passes and Deep Space Network", () => {
    const m = withDesign({ ...MIDDLING_DESIGN, instrument: "mapping-multi" });
    m.handle({ type: "setRequirement", payload: { id: "dataPerSol", value: 800 } });
    const s = m.state();
    expect(res(s, "data")).toMatchObject({ used: 3 * (600 + 800), available: 4000 });
    expect(s.issues.find((i) => i.code === "data.storage")!.resource).toBe("data");
    const e = evaluate({ ...MIDDLING_DESIGN }, defaultRequirements());
    expect(e.earthMbPerSol).toBe(Math.min(e.relayMbPerSol, e.dsnMbPerSol));
    expect(res(withDesign(MIDDLING_DESIGN).state(), "communications").available).toBe(e.earthMbPerSol);
  });

  it("large panels on a 3U are reported", () => {
    const m = withDesign({ format: "3u", power: "large" });
    expect(m.state().issues.find((i) => i.code === "power.format")!.severity).toBe("critical");
  });

  it("requirements the design does not meet are reported on the design step, with both numbers", () => {
    const m = withDesign(MIDDLING_DESIGN);
    const issues = m.state().issues;
    expect(issues.find((i) => i.code === "req.mapDetail")!.message).toMatch(/1,600 m per pixel; the requirement is 50 m/);
    expect(issues.find((i) => i.code === "req.dataPerSol")!.step).toBe("design");
  });

  it("verification: met by the design and shown by the tests that verify it", () => {
    const m = withDesign({ ...GOOD_DESIGN, tests: [] });
    m.handle({ type: "setRequirement", payload: { id: "mapDetail", value: 600 } });
    m.handle(toggle("tests", "vibration"));
    let v = Object.fromEntries(m.state().requirements.map((r) => [r.id, r.verified]));
    expect(v).toMatchObject({ mass: true, mapDetail: false, deadline: true, budget: true, reserve: true });
    m.handle(toggle("tests", "ditl"));
    v = Object.fromEntries(m.state().requirements.map((r) => [r.id, r.verified]));
    expect(v.mapDetail).toBe(true);
    expect(v.warning).toBe(false); // needs thermal too
    m.handle({ type: "setReserve", payload: { fraction: 0.05 } });
    expect(m.state().requirements.find((r) => r.id === "reserve")!.verified).toBe(false);
    expect(m.state().issues.find((i) => i.code === "reserve.low")!.step).toBe("build");
  });

  it("before any test is chosen, requirements are not checked yet", () => {
    expect(new MarsSession().state().requirements.every((r) => r.verified === undefined)).toBe(true);
  });

  it("every option and resource carries a source tag", () => {
    const s = withDesign(GOOD_DESIGN).state();
    for (const g of s.groups) for (const o of g.options) expect(["nasa", "derived", "team"]).toContain(o.source.status);
    for (const r of s.resources) expect(r.source).toBeDefined();
    expect(res(s, "budget").source!.status).toBe("team");
    expect(BUDGET_DEFAULT_USD).toBe(s.requirements.find((r) => r.id === "budget")!.value);
  });
});

describe("the fixture designs", () => {
  it("are complete designs (except the poor one's missing Deep Space Network time)", () => {
    expect(evaluate(GOOD_DESIGN).missing).toEqual([]);
    expect(evaluate(MIDDLING_DESIGN).missing).toEqual([]);
    expect(evaluate(POOR_DESIGN).missing).toEqual(["groundStation"]);
  });
  it("the good one fits its mass, power, budget and time", () => {
    const s = withDesign(GOOD_DESIGN).state();
    expect(s.issues.filter((i) => i.severity === "critical")).toEqual([]);
  });
});
