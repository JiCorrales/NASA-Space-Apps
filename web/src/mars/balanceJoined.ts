// The joined game: Act 1's fixtures through Act 1's rule (`capabilitiesFromDesign`), handed to MarsWorld as given,
// played by the demo controllers. Same tally as balance.ts. Not part of the game.
import { capabilitiesFromDesign } from "./act1/capabilities";
import { GOOD_DESIGN, MIDDLING_DESIGN, POOR_DESIGN } from "./act1/fixtures";
import type { Act1Design as Act1Mars } from "./act1/types";
import { balance, type Tally } from "./balance";
import type { DesignFixture } from "./capabilities";
import { MarsWorld } from "./world";
import { playRun } from "./controllers";
import { demoControllers } from "./demo";
import type { RelayCapabilities, RunResult } from "./types";

export interface JoinedFixture { name: string; design: Act1Mars; extras: { reserve?: number; massMarginKg?: number } }

export const JOINED_FIXTURES: JoinedFixture[] = [
  { name: "good", design: GOOD_DESIGN, extras: {} },
  { name: "middling", design: MIDDLING_DESIGN, extras: {} },
  { name: "poor", design: POOR_DESIGN, extras: {} },
];

export const joinedCapabilities = (f: JoinedFixture): RelayCapabilities => capabilitiesFromDesign(f.design, f.extras);

/** `balance` expects a rules fixture; the capabilities are given to the world as Act 1 would hand them over. */
export function joinedBalance(f: JoinedFixture, seeds: number[]): Tally {
  const caps = joinedCapabilities(f);
  return balance({ name: f.name, design: f.design as unknown as DesignFixture["design"], extras: f.extras }, seeds, caps);
}

export function playJoined(seed: number, f: JoinedFixture): { result: RunResult; world: MarsWorld } {
  const world = new MarsWorld({ seed, design: f.design as never, extras: f.extras, capabilities: joinedCapabilities(f) });
  playRun(world, demoControllers());
  return { result: world.result()!, world };
}
