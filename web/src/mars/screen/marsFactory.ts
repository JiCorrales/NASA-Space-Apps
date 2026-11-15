// Builds a run from the rules (package A): a MarsWorld, the demo controllers, and either the design Act 1 handed
// over or one of the three fixture designs.
import { DESIGN_FIXTURES, MarsWorld, demoControllers } from "..";
import type { RunFactory } from "./engine";

export const marsFactory: RunFactory = ({ seed, design, handoff }) => {
  const startedAt = new Date().toISOString();
  const fixture = DESIGN_FIXTURES.find((f) => f.name === design) ?? DESIGN_FIXTURES[0]!;
  const world = design === "yours" && handoff
    ? new MarsWorld({ seed, design: handoff.design, extras: handoff.extras, crew: handoff.crew, capabilities: handoff.capabilities, startedAt })
    : new MarsWorld({ seed, design: fixture.design, extras: fixture.extras, startedAt });
  const demos = demoControllers();
  return { engine: world, demo: (p) => demos[p]!, crew: world.crew };
};
