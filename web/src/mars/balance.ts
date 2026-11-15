// Plays many seeds with the demo controllers and tallies how runs end. Used by Balance.test.ts to tune the team's
// values and to show that every lose condition and every hazard occurs. Not part of the game.
import { DESIGN_FIXTURES, type DesignFixture } from "./capabilities";
import { playRun } from "./controllers";
import { demoControllers } from "./demo";
import type { HazardId, LoseReason, RunResult } from "./types";
import { MarsWorld } from "./world";

export interface Tally {
  design: string; runs: number; wins: number; winRate: number;
  loseReasons: Record<LoseReason, number>;
  endSols: Record<string, number>;
  hazards: Record<HazardId, number>;
  meanTasks: number; meanScore: number; meanSolsOut: number;
  unfinished: Record<string, number>;
  linkCuts: number;
}

export function playSeed(seed: number, f: DesignFixture): { result: RunResult; world: MarsWorld } {
  const world = new MarsWorld({ seed, design: f.design, extras: f.extras });
  playRun(world, demoControllers());
  return { result: world.result()!, world };
}

export function balance(f: DesignFixture, seeds: number[]): Tally {
  const t: Tally = {
    design: f.name, runs: seeds.length, wins: 0, winRate: 0,
    loseReasons: { "window-closed": 0, "resource-exhausted": 0, "crew-lost": 0 }, endSols: {},
    hazards: { "dust-storm": 0, "cold-night": 0, "dust-settling": 0, "solar-storm": 0, "satellite-fault": 0 },
    meanTasks: 0, meanScore: 0, meanSolsOut: 0, unfinished: {}, linkCuts: 0,
  };
  for (const seed of seeds) {
    const { result: r, world } = playSeed(seed, f);
    if (r.outcome === "won") t.wins++; else t.loseReasons[r.loseReason!]++;
    const bucket = `${Math.floor((r.endedOnSol - 1) / 5) * 5 + 1}-${Math.floor((r.endedOnSol - 1) / 5) * 5 + 5}`;
    t.endSols[bucket] = (t.endSols[bucket] ?? 0) + 1;
    for (const h of r.hazardsSeen) t.hazards[h]++;
    for (const x of r.tasks) if (!x.done) t.unfinished[x.id] = (t.unfinished[x.id] ?? 0) + 1;
    t.meanTasks += r.score.tasksCompleted; t.meanScore += r.score.total;
    t.meanSolsOut += world.players.reduce((a, p) => a + p.solsOut, 0);
    t.linkCuts += Object.values(world.stats.linkCuts).reduce((a, b) => a + b, 0);
  }
  t.winRate = t.wins / t.runs; t.meanTasks /= t.runs; t.meanScore /= t.runs; t.meanSolsOut /= t.runs; t.linkCuts /= t.runs;
  return t;
}

export const seedRange = (n: number, from = 1) => Array.from({ length: n }, (_, i) => from + i);
export const balanceAll = (n: number) => DESIGN_FIXTURES.map((f) => balance(f, seedRange(n)));

export function formatTable(rows: Tally[]): string {
  const head = "design    runs  win%   window  resource  crew  tasks  score  cuts/run  endSols";
  const lines = rows.map((t) =>
    `${t.design.padEnd(9)} ${String(t.runs).padStart(4)}  ${(t.winRate * 100).toFixed(0).padStart(3)}%  ${String(t.loseReasons["window-closed"]).padStart(6)}  ${String(t.loseReasons["resource-exhausted"]).padStart(8)}  ${String(t.loseReasons["crew-lost"]).padStart(4)}  ${t.meanTasks.toFixed(2).padStart(5)}  ${t.meanScore.toFixed(0).padStart(5)}  ${t.linkCuts.toFixed(1).padStart(8)}  ${JSON.stringify(t.endSols)}  unfinished ${JSON.stringify(t.unfinished)}  hazards ${JSON.stringify(t.hazards)}`);
  return [head, ...lines].join("\n");
}
