// Who chooses. `PlayerController` is the seam: a person at a screen, the demo script, later the network.
import type { Choice, PlayerController, PlayerId, PlayerView, SolReport } from "./types";
import type { MarsWorld } from "./world";

/** The choice a person made on the screen. The screen calls `set`; the world reads it with `choose`. */
export class ScreenController implements PlayerController {
  private pending: Choice | null = null;
  constructor(readonly player: PlayerId) {}
  set(c: Omit<Choice, "player">) { this.pending = { ...c, player: this.player }; }
  clear() { this.pending = null; }
  choose(): Choice | null { return this.pending ? { ...this.pending } : null; }
  endOfSol() { this.pending = null; }
}

/**
 * One sol with controllers: first everyone chooses from their own view, then players whose communicator works
 * see each other's choices and may change theirs. A cut-off player chooses once, alone.
 */
export function playSol(world: MarsWorld, controllers: PlayerController[]): SolReport {
  const submit = (ctl: PlayerController, view: PlayerView) => {
    const c = ctl.choose(view);
    if (c) world.choose({ ...c, player: ctl.player });
  };
  for (const ctl of controllers) if (world.players[ctl.player]!.active) submit(ctl, world.viewFor(ctl.player));
  for (const ctl of controllers) {
    const p = world.players[ctl.player]!;
    if (p.active && p.linked) submit(ctl, world.viewFor(ctl.player));
  }
  const report = world.resolveSol();
  for (const ctl of controllers) ctl.endOfSol?.();
  return report;
}

/** Plays a whole run (up to its end) with the given controllers. */
export function playRun(world: MarsWorld, controllers: PlayerController[]): void {
  while (world.status === "running") playSol(world, controllers);
}
