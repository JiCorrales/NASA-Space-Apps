# Mars rules (Act 2)

The rules of the 30 sols on the surface: pure TypeScript, no drawing, no React, no network. Every screen and
controller depends on `types.ts` (re-exported by `index.ts`) and nothing else. Specification: `docs/mars-plan.md`
sections 2, 4, 5, 6 and 11.

## What is here

| File | What |
|---|---|
| `types.ts` | The public data types: `PlayerView`, `Choice`, `SolReport`, `RunResult`, `Score`, `Attempt`, map and module shapes |
| `contracts.ts` | The behavioural interfaces: `Activity`, `Hazard`, `BaseModule`, `MissionTask` (`Skill` and `PlayerController` are in `types.ts`) |
| `player.ts` | Abstract `Player` and `Commander`, `Engineer`, `Scientist`, `CommsOfficer` with their skills and activities |
| `activities.ts`, `hazards.ts`, `modules.ts`, `tasks.ts` | One object per activity, hazard, module and task |
| `world.ts` | `MarsWorld`: the state and the rules of a sol |
| `view.ts` | `PlayerView`: the only door from the world to the screens |
| `capabilities.ts` | **The team's rule** turning an Act 1 design into `RelayCapabilities`, plus the good, middling and poor fixtures |
| `data.ts` | Every number, with its CSV row id or `"team"` |
| `map.ts`, `rng.ts` | The seeded map and path search; seeded rolls |
| `controllers.ts`, `demo.ts` | `ScreenController` (a person), `playSol`/`playRun`, `DemoController` (reads only its view) |
| `score.ts`, `history.ts` | Score and the causes after a run; attempts kept in `localStorage` or in memory |
| `balance.ts` | Plays many seeds per design; used by the balance test |
| `*.test.ts`, `testkit.ts` | The proof, there is no screen yet |

## How a sol runs

```ts
const world = new MarsWorld({ seed, design, extras });   // design = Act 1 `MissionState.design`
const view = world.viewFor(2);          // 1. briefing: exactly what player 2 may know
world.choose({ player: 2, activity: "sample", target: { kind: "site", id: "site-1" } });   // 2. choice
const report = world.resolveSol();      // 3. the sol plays: report.events in order, to animate
const evening = world.eveningFor(2);    // 4. evening report, filtered for player 2
world.result();                         // null until the run ends; then outcome, score, causes
```

`playSol(world, controllers)` does 1 and 2 for all four: everyone chooses, then players whose communicator works
see the others' plans and may change theirs. A cut-off player's `PlayerView` has `shared` and `plans` set to
`null`; the team learns what they did only when their link returns (it appears in `crew[i].known` and in the
briefing's `news`).

Inside `resolveSol`: the plan and loading supplies first, then each player's walk and work, then the hazards,
power, the satellite's downlink, supplies and gauges, the lab, the tasks, win and lose. The next sol begins with
links, passes and satellite faults. All randomness is `roll(seed, ...keys)`, so the same seed, design and choices
replay the same run.

## Supplies: who the base feeds and when a pack is used

- Anyone within 3 tiles of the habitat is fed from the base stores each sol (air, water, food): their gauges
  recover. Their pack is not touched.
- Anyone farther away eats from their pack, one sol of supplies a sol. With an empty pack the three gauges fall
  28 a sol and the player is out when one reaches 0.
- Loading supplies (an activity) fills a pack from the stores, up to 10 sols. A player who walks out with an empty
  pack takes a suit reserve of 3 sols from the stores, so an unloaded walk is a margin, not a death in four sols.
- Packs are paid for from the stores when loaded; the run is lost for lack of supplies only when a store is empty
  and nobody has any left in a pack.

## Where the numbers live

`data.ts` has two objects: `NASA` (each value carries the id of its row in
`Resources/10-mars-surface/data/mars-surface-numbers.csv`) and `TEAM` (game balance, `source: "team"`). Show the
tag next to a number; never present a `team` value as NASA's. How the satellite becomes the crew's equipment is
in `capabilities.ts` and nowhere else. Gauges and capabilities carry their own source tags.

## Checks

From `web/`: `pnpm typecheck`, `pnpm test`, `pnpm build`. The balance table is printed by
`pnpm exec vitest run src/mars/play.test.ts --silent=false`.
