import type { Group, PageToUnity } from "../../../bridge/types";
import { capabilitiesFromDesign, describeCapabilities } from "../capabilities";
import { ART_LOOKS, assignRole, crewComplete, emptySeats, fillTheRest, toCrewSetup, assignLook } from "../crew";
import { GROUP_DEFS, MARS_LABELS } from "../data";
import { GOOD_DESIGN, MIDDLING_DESIGN, POOR_DESIGN } from "../fixtures";
import { ATTEMPTS_KEY, HANDOFF_KEY, HISTORY_KEY, appendLaunch, handoffOf, readHistory, readLaunches, writeHandoff, type KeyValueStorage } from "../handoff";
import { defaultRequirements } from "../model";
import { noGoOf, planLaunch } from "../launchSequence";
import { MarsSession } from "../session";
import { LOOKS, ROLES, type Act1Design } from "../types";

function withDesign(design: Act1Design): MarsSession {
  const m = new MarsSession();
  for (const [g, v] of Object.entries(design)) {
    const msgs: PageToUnity[] = Array.isArray(v)
      ? v.map((id) => ({ type: "toggle", payload: { group: g as Group, id } }))
      : typeof v === "string" ? [{ type: "choose", payload: { group: g as Group, id: v } }] : [];
    msgs.forEach((x) => m.handle(x));
  }
  return m;
}
const memory = (): KeyValueStorage & { data: Record<string, string> } => {
  const data: Record<string, string> = {};
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
};
const caps = (d: Act1Design) => capabilitiesFromDesign(d, { reserve: 0.1 });

describe("capabilitiesFromDesign", () => {
  const good = caps(GOOD_DESIGN), mid = caps(MIDDLING_DESIGN), poor = caps(POOR_DESIGN);

  it("a better design gives visibly better capabilities: good > middling > poor", () => {
    expect(good.mapRadiusStart).toBeGreaterThan(mid.mapRadiusStart);
    expect(mid.mapRadiusStart).toBeGreaterThan(poor.mapRadiusStart);
    expect(Math.min(good.relayMbPerSol, good.dsnMbPerSol)).toBeGreaterThan(Math.min(mid.relayMbPerSol, mid.dsnMbPerSol));
    expect(Math.min(mid.relayMbPerSol, mid.dsnMbPerSol)).toBeGreaterThan(Math.min(poor.relayMbPerSol, poor.dsnMbPerSol));
    expect(good.warningLeadSols).toBeGreaterThan(mid.warningLeadSols);
    expect(mid.warningLeadSols).toBeGreaterThan(poor.warningLeadSols);
    expect(good.satPowerMargin).toBeGreaterThan(mid.satPowerMargin);
    expect(mid.satPowerMargin).toBeGreaterThan(poor.satPowerMargin);
    expect(good.faultPerSol).toBeLessThan(mid.faultPerSol);
    expect(mid.faultPerSol).toBeLessThan(poor.faultPerSol);
    expect(good.relayStorageMb).toBeGreaterThan(mid.relayStorageMb);
    expect(good.mapRadiusMax).toBeGreaterThan(poor.mapRadiusMax);
  });

  it("each part of the design moves its own capability", () => {
    expect(caps({ ...MIDDLING_DESIGN, instrument: "mapping-multi" }).mapRadiusStart).toBeGreaterThan(mid.mapRadiusStart);
    expect(caps({ ...MIDDLING_DESIGN, groundStation: "dsn34-4h" }).dsnMbPerSol).toBeGreaterThan(mid.dsnMbPerSol);
    expect(caps({ ...MIDDLING_DESIGN, orbit: "low-sso" })).toMatchObject({ passesPerSol: 2, passMinutes: 10 });
    expect(caps({ ...MIDDLING_DESIGN, storage: "large" }).relayStorageMb).toBeGreaterThan(mid.relayStorageMb);
    expect(caps({ ...MIDDLING_DESIGN, attitude: "star" }).faultPerSol).toBeLessThan(mid.faultPerSol);
    expect(caps({ ...MIDDLING_DESIGN, backupStation: "orbiters" }).passSolFraction).toBe(1);
  });

  it("mass and budget left become supplies, materials and spares", () => {
    const cheap = capabilitiesFromDesign(MIDDLING_DESIGN, { reserve: 0.1, massMarginKg: 2 });
    const tight = capabilitiesFromDesign(MIDDLING_DESIGN, { reserve: 0.1, massMarginKg: 0 }, 1_000_000);
    expect(cheap.supplyDays).toBeGreaterThan(tight.supplyDays);
    expect(cheap.materialsKg).toBeGreaterThan(tight.materialsKg);
    expect(cheap.spares).toBeGreaterThan(tight.spares);
  });

  it("has exactly the contract's fields, all numbers", () => {
    expect(Object.keys(good).sort()).toEqual([
      "dsnMbPerSol", "faultPerSol", "mapRadiusMax", "mapRadiusStart", "materialsKg", "passMinutes", "passSolFraction",
      "passesPerSol", "relayMbPerSol", "relayRateMbps", "relayStorageMb", "satPowerMargin", "spares", "supplyDays", "warningLeadSols",
    ]);
    for (const v of Object.values(good)) expect(Number.isFinite(v)).toBe(true);
    expect(good.satPowerMargin).toBeGreaterThanOrEqual(0);
    expect(good.satPowerMargin).toBeLessThanOrEqual(1);
  });
});

describe("the launch sequence", () => {
  const req = defaultRequirements();
  it("is deterministic per seed", () => {
    for (const seed of [1, 7, 42, 999]) {
      expect(JSON.stringify(planLaunch(GOOD_DESIGN, req, 0.1, seed))).toBe(JSON.stringify(planLaunch(GOOD_DESIGN, req, 0.1, seed)));
    }
  });

  it("reaches every outcome", () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed < 400; seed++) {
      kinds.add(planLaunch(GOOD_DESIGN, req, 0.1, seed).kind);
      kinds.add(planLaunch({ ...GOOD_DESIGN, tests: ["vibration"] }, req, 0.1, seed).kind);
    }
    kinds.add(planLaunch(POOR_DESIGN, req, 0.1, 1).kind);
    expect([...kinds].sort()).toEqual(["clean", "hold", "noDeploy", "scrubbed", "vehicleLost"]);
  });

  it("a design that cannot fly makes a station answer NO-GO and the launch is scrubbed, whatever the seed", () => {
    const cases: [Act1Design, string, RegExp][] = [
      [POOR_DESIGN, "DSN", /Deep Space Network/],
      [{ ...GOOD_DESIGN, tests: ["thermal"] }, "PAYLOAD", /vibration/],
      [{ ...GOOD_DESIGN, format: "3u" }, "PAYLOAD", /3U/],
      [{ ...GOOD_DESIGN, power: "body" }, "PAYLOAD", /panels give/],
      [{ ...GOOD_DESIGN, orbit: null }, "FLIGHT", /orbit/],
    ];
    for (const [d, station, cause] of cases) {
      expect(noGoOf(d, req, 0.1)!.station).toBe(station);
      for (const seed of [1, 2, 3]) {
        const p = planLaunch(d, req, 0.1, seed);
        expect(p.outcome).toBe("scrubbed");
        expect(p.cause).toMatch(cause);
        const last = p.steps.at(-1)!.frame;
        expect(last.outcome).toBe("scrubbed");
        expect(last.poll.find((x) => x.station === station)!.go).toBe(false);
      }
    }
    expect(noGoOf(GOOD_DESIGN, req, 0.1)).toBeNull();
  });

  it("a satellite whose deployables were never unfolded on the ground fails to deploy more often than a tested one", () => {
    let untested = 0, tested = 0;
    for (let seed = 1; seed <= 300; seed++) {
      if (planLaunch({ ...GOOD_DESIGN, tests: ["vibration"] }, req, 0.1, seed).kind === "noDeploy") untested++;
      if (planLaunch(GOOD_DESIGN, req, 0.1, seed).kind === "noDeploy") tested++;
    }
    expect(untested).toBeGreaterThan(tested * 3);
    // body panels and a patch antenna have nothing to unfold
    const plain = { ...MIDDLING_DESIGN, power: "body", instrument: "weather-camera", format: "6u" };
    for (let seed = 1; seed <= 100; seed++) expect(planLaunch(plain, req, 0.1, seed).kind).not.toBe("noDeploy");
  });

  it("every plan ends with one outcome on its last frame, and the frames move forward", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const p = planLaunch(GOOD_DESIGN, req, 0.1, seed);
      expect(p.steps.at(-1)!.frame.outcome).toBe(p.outcome);
      expect(p.steps.slice(0, -1).every((x) => x.frame.outcome === null)).toBe(true);
      expect(p.report.length).toBeGreaterThan(0);
    }
  });

  it("the session keeps each launch as an attempt, and a good launch finishes step 6", () => {
    const m = withDesign(GOOD_DESIGN);
    let seed = 1;
    while (planLaunch(GOOD_DESIGN, req, 0.1, seed).outcome === "ok") seed++;
    m.launch(seed);
    expect(m.launches[0]!.outcome).not.toBe("ok");
    expect(m.state().steps.find((s) => s.step === "fly")!.status).toBe("problem");
    let ok = 1;
    while (planLaunch(GOOD_DESIGN, req, 0.1, ok).outcome !== "ok") ok++;
    m.launch(ok);
    expect(m.launches).toHaveLength(2);
    expect(m.state().steps.find((s) => s.step === "fly")!.status).toBe("done");
  });
});

// ---------------------------------------------------------------- the owner's rule: nothing is telegraphed

const FORBIDDEN = /\b(odds|risk\w*|chance\w*|probab\w*|likel\w*|unlikely|percent(age)? (chance|likelihood)|advice|advis\w*|recommend\w*|suggest\w*|you should|should|safer|safest|tip:|hint)\b/i;

/** Every string in a value, deep. */
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}

describe("nothing is telegraphed", () => {
  it("no text the session can emit speaks of odds, risk, chance, probability or gives advice", () => {
    const texts = new Set<string>();
    const designs: Act1Design[] = [{}, GOOD_DESIGN, MIDDLING_DESIGN, POOR_DESIGN,
      { ...GOOD_DESIGN, format: "3u" }, { ...GOOD_DESIGN, power: "body" }, { ...GOOD_DESIGN, tests: [] },
      { ...MIDDLING_DESIGN, instrument: "mapping-multi", storage: "small" }, { ...GOOD_DESIGN, groundStation: null, orbit: null }];
    // every option of every group, chosen once
    for (const g of GROUP_DEFS) for (const d of g.defs) designs.push({ ...MIDDLING_DESIGN, [g.group]: g.multi ? [d.option.id] : d.option.id });
    for (const d of designs) {
      const m = withDesign(d);
      for (const step of ["goals", "concept", "requirements", "design", "build"] as const) m.handle({ type: "completeStep", payload: { step } });
      m.handle({ type: "setRequirement", payload: { id: "budget", value: 1_000_000 } });
      m.handle({ type: "setRequirement", payload: { id: "deadline", value: 12 } });
      m.handle({ type: "setReserve", payload: { fraction: 0 } });
      strings(m.state()).forEach((t) => texts.add(t));
      for (let seed = 1; seed <= 25; seed++) strings(planLaunch(d, defaultRequirements(), 0.1, seed)).forEach((t) => texts.add(t));
      describeCapabilities(caps(d), "Jezero Crater").forEach((t) => texts.add(t));
    }
    strings(MARS_LABELS).forEach((t) => texts.add(t));
    const bad = [...texts].filter((t) => FORBIDDEN.test(t));
    expect(bad).toEqual([]);
    expect(texts.size).toBeGreaterThan(200);
  });

  it("the check itself catches the words it is meant to catch", () => {
    for (const t of ["High risk", "a 30% chance", "probability of loss", "likely to fail", "We recommend", "you should add a test"])
      expect(FORBIDDEN.test(t)).toBe(true);
  });
});

// ---------------------------------------------------------------- crew setup

describe("crew setup", () => {
  it("assigns each role once: giving a role to one player takes it from another", () => {
    let seats = assignRole(emptySeats(), 0, "engineer");
    seats = assignRole(seats, 1, "engineer");
    expect(seats.map((s) => s.role)).toEqual([null, "engineer", null, null]);
  });

  it("looks are picked apart from roles and may repeat", () => {
    let seats = assignLook(emptySeats(), 0, "tall");
    seats = assignLook(seats, 1, "tall");
    expect(seats.map((s) => s.look)).toEqual(["tall", "tall", null, null]);
  });

  it("fill the rest completes the crew for a person playing alone, keeping what was picked", () => {
    let seats = assignRole(emptySeats(), 2, "commander");
    seats = assignLook(seats, 2, "compact");
    const full = fillTheRest(seats);
    expect(crewComplete(full)).toBe(true);
    expect(full[2]).toMatchObject({ role: "commander", look: "compact" });
    expect(new Set(full.map((s) => s.role))).toEqual(new Set(ROLES));
    expect(new Set(full.map((s) => s.look))).toEqual(new Set(ART_LOOKS));
  });

  it("turns into the contract's CrewSetup, with the contract's looks", () => {
    const crew = toCrewSetup(fillTheRest(emptySeats()));
    expect(crew).toHaveLength(4);
    for (const c of crew) {
      expect(Object.keys(c).sort()).toEqual(["look", "name", "role"]);
      expect(LOOKS).toContain(c.look);
      expect(ROLES).toContain(c.role);
    }
    expect(() => toCrewSetup(emptySeats())).toThrow();
  });
});

// ---------------------------------------------------------------- hand-over and attempts

describe("hand-over", () => {
  it("is exactly { design, extras, crew, capabilities } and is written under mars.handoff as JSON", () => {
    const m = withDesign(GOOD_DESIGN);
    const crew = toCrewSetup(fillTheRest(emptySeats()));
    const h = handoffOf(m, crew);
    expect(Object.keys(h).sort()).toEqual(["capabilities", "crew", "design", "extras"]);
    expect(Object.keys(h.extras).sort()).toEqual(["massMarginKg", "reserve"]);
    expect(h.extras.reserve).toBe(0.1);
    expect(h.design.orbit).toBe("low-sso");
    expect(h.capabilities).toEqual(m.capabilities());
    const store = memory();
    writeHandoff(h, store);
    expect(JSON.parse(store.data[HANDOFF_KEY]!)).toEqual(h);
    expect(HANDOFF_KEY).toBe("mars.handoff");
  });

  it("keeps Act 1's launch attempts across reloads", () => {
    const store = memory();
    appendLaunch({ outcome: "scrubbed", cause: "No vibration test.", at: "2026-11-15T03:00:00Z" }, store);
    appendLaunch({ outcome: "ok", cause: "", at: "2026-11-15T03:10:00Z" }, store);
    expect(readLaunches(store).map((a) => [a.number, a.outcome])).toEqual([[1, "scrubbed"], [2, "ok"]]);
    expect(Object.keys(store.data)).toEqual([ATTEMPTS_KEY]);
  });

  it("reads Act 2's history only for outcome, sol and cause, wherever they are and only if present", () => {
    const store = memory();
    expect(readHistory(store)).toEqual([]);
    store.setItem(HISTORY_KEY, JSON.stringify([
      { id: "a", result: { outcome: "lost", endedOnSol: 12, causes: [{ sol: 12, hazard: "dust-storm", text: "A dust storm cut the power." }] } },
      { outcome: "won", endedOnSol: 30 },
      { something: "else" },
    ]));
    expect(readHistory(store)).toEqual([
      { label: "On Mars 1", outcome: "lost", sol: 12, cause: "A dust storm cut the power." },
      { label: "On Mars 2", outcome: "won", sol: 30, cause: null },
      { label: "On Mars 3", outcome: "unknown", sol: null, cause: null },
    ]);
    store.setItem(HISTORY_KEY, "not json");
    expect(readHistory(store)).toEqual([]);
  });
});
