import { describe, expect, it } from "vitest";
import { capabilitiesFromDesign } from "./act1/capabilities";
import { POOR_DESIGN } from "./act1/fixtures";
import { formatTable, seedRange } from "./balance";
import { JOINED_FIXTURES, joinedBalance, joinedCapabilities } from "./balanceJoined";

describe("the joined game: Act 1's rule speaks the scale of the Act 2 world", () => {
  const [good, mid, poor] = JOINED_FIXTURES.map(joinedCapabilities) as [ReturnType<typeof joinedCapabilities>, ReturnType<typeof joinedCapabilities>, ReturnType<typeof joinedCapabilities>];

  it("a better design is never worse on a satellite capability", () => {
    for (const k of ["mapRadiusStart", "mapRadiusMax", "relayMbPerSol", "dsnMbPerSol", "warningLeadSols", "satPowerMargin", "relayStorageMb"] as const) {
      expect(good[k], k).toBeGreaterThanOrEqual(mid[k]);
      expect(mid[k], k).toBeGreaterThanOrEqual(poor[k]);
    }
    expect(good.faultPerSol).toBeLessThanOrEqual(mid.faultPerSol);
    expect(mid.faultPerSol).toBeLessThanOrEqual(poor.faultPerSol);
  });

  it("the map reaches the sample sites (8 to 27 tiles out) for a good instrument and not for none", () => {
    expect(good.mapRadiusStart).toBeGreaterThanOrEqual(24);
    expect(poor.mapRadiusStart).toBeLessThan(good.mapRadiusStart);
    expect(capabilitiesFromDesign({ ...POOR_DESIGN, instrument: null }, {}).mapRadiusStart).toBeLessThanOrEqual(10);
  });

  it("money and mass left over are bounded: a full wallet cannot outweigh the satellite", () => {
    const rich = capabilitiesFromDesign({ ...POOR_DESIGN, tests: [] }, { reserve: 0, massMarginKg: 50 }, 4_000_000);
    expect(rich.supplyDays).toBeLessThanOrEqual(4);
    expect(rich.spares).toBeLessThanOrEqual(4);
    expect(rich.materialsKg).toBeLessThanOrEqual(400);
    expect(rich.relayMbPerSol).toBeLessThanOrEqual(1563);
    // the materials always cover the array and the antenna
    expect(poor.materialsKg).toBeGreaterThanOrEqual(280);
  });

  it("plays 400 seeds per design: good about 75 to 85, middling about half, poor a few, crew lost a minority of the poor's losses", () => {
    const rows = JOINED_FIXTURES.map((f) => joinedBalance(f, seedRange(400)));
    console.log(`\n${formatTable(rows)}\n`);
    const [g, m, p] = rows as [typeof rows[0], typeof rows[0], typeof rows[0]];
    expect(g.winRate).toBeGreaterThanOrEqual(0.7);
    expect(g.winRate).toBeLessThanOrEqual(0.9);
    expect(m.winRate).toBeGreaterThan(0.3);
    expect(m.winRate).toBeLessThan(0.6);
    expect(p.winRate).toBeLessThanOrEqual(0.1);
    expect(p.winRate).toBeGreaterThan(0);
    expect(p.loseReasons["crew-lost"]).toBeLessThan((p.runs - p.wins) / 2);
    expect(g.meanTasks).toBeGreaterThan(3); // all four tasks are reachable with the good design
    expect(g.wins).toBeGreaterThan(0);
  }, 120000);
});
