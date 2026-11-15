# The bridge between the ship (Unity) and the 2D screens (web page)

The game is a Unity WebGL build with a React page drawn on top of its canvas (see `docs/game-plan.md`,
section 6). Unity owns the ship, movement, the mission data, the checks and the simulation. The page owns every
2D screen. They exchange JSON messages. This file is the contract; `web/src/bridge/types.ts` is its exact form
in code, and the C# side mirrors it.

## Transport

- **Unity to page:** Unity calls `window.MissionUI.receive(json)` (through a `.jslib` plugin).
- **Page to Unity:** the page calls `unityInstance.SendMessage("Bridge", "Receive", json)`.
- Every message is `{ "type": string, "payload": object }`, as one JSON string.
- The page must also run without Unity: when `window.unityInstance` is absent it uses a stand-in that answers
  from fixture data, so the screens can be built and tested in a plain browser.

## Unity to page

| Type | Payload | When |
|---|---|---|
| `openScreen` | `{ step }`, where `step` is `goals`, `concept`, `requirements`, `design`, `build` or `fly` | The player clicked a cover and the view is locked |
| `closeScreen` | `{}` | Unity is unlocking the view |
| `state` | `MissionState`, below | After `ready`, and after every change |
| `simTick` | `SimFrame`, below | During the flight, once per simulated step |

## Page to Unity

| Type | Payload | Meaning |
|---|---|---|
| `ready` | `{}` | The page has loaded and wants the current `state` |
| `choose` | `{ group, id }` | The player picked an option in a decision group (`region`, `orbit`, `revisit`, `format`, `power`, `attitude`, `storage`, `instrument`, `radio`, `groundStation`, `backupStation`, `launch`) |
| `toggle` | `{ group, id }` | Multi-select groups (`tests`) |
| `setRequirement` | `{ id, value }` | The player adjusted a requirement |
| `setReserve` | `{ fraction }` | Budget kept in reserve, 0 to 1 |
| `completeStep` | `{ step }` | The player finished a step |
| `close` | `{}` | The player pressed Escape or "back to the ship" |
| `fly` | `{ action }`, where `action` is `launch`, `pause`, `resume`, `fast`, `retry` | Control of the flight |
| `command` | `{ name }` | A flight command: `pauseCamera`, `safeMode`, `prioritizeDownlink`, `useBackupStation`, `recalibrate` |

## `MissionState`

```
{
  mission:   { id, name, summary },
  steps:     [ { step, status } ],            // status: locked | open | done | problem
  design:    { <group>: id | id[] | null },
  groups:    [ { group, step, multi, options: [ { id, name, summary, stats: [ { label, value, unit } ],
                                                  source: { status, text } } ] } ],
  requirements: [ { id, label, value, unit, min, max, check, source?, verified? } ],
  resources: [ { kind, used, available, unit, known, source? } ],   // mass, power, budget, data, communications, time
  issues:    [ { code, severity, resource, step, message } ],
  attempts:  [ { number, successRate, imagesDelivered, outcome } ],
  worlds?:   [ { id, name, open, sunlight, signal, travel } ],    // each of the three: { value, unit, source } | null
  missions?: [ { id, world, name, summary, open, who, why } ],
  reserve?:  number                                              // fraction 0 to 1, as last set with setReserve
}
```

`source.status` is `nasa`, `derived` or `team`. `known` is false while the choice that sets a limit has not been
made yet.

Optional fields, added for the screens of steps 1 and 5:

- `worlds` and `missions` fill the mission select. Only open ones can be chosen. A `null` measure on a locked
  world is shown as "data coming".
- `requirement.verified` is set by Unity for build and verify: `true` when the chosen tests verify it, `false`
  when they do not, absent while not checked yet.
- `requirement.source` and `resource.source` say where a value or a limit comes from, like `option.source`.
- `reserve` is the current budget reserve, so the build screen can show what `setReserve` last set.

## `SimFrame`

```
{
  week, day, speed,                                  // speed: detail | fast | paused
  battery, pointingError, cameraTemp, storageQueue, linkQuality,
  imagesDelivered, imagesLost, projectedSuccess,
  weeks: [ "sent" | "held" | "next" | "lost" | "" ], // 52 entries
  contact: boolean, capturing: boolean,
  alert: null | { code, title },
  commands: [ { name, label, enabled, active } ],
  log: [ { week, text, kind } ],                     // kind: info | alert | good
  report: null | { successRate, imagesDelivered, factors: [ { label, value } ], lostBecause,
                   decisions: [ string ], suggestion, images: [ ... 52 states ] },
  launch?: null | LaunchFrame                        // optional, the launch act; see below
}
```

### The launch act (`SimFrame.launch`, optional)

The first act of the flight screen, between `fly launch` and week 1: the countdown, the GO/NO-GO poll, the
ascent, separation and deployment of the CubeSat. While `launch` is present the window shows the launch and
the page shows only `launch` (and `report` on the last frame); the other fields are not shown, and Unity sends
them as at the start of week 1 (`week: 1, day: 0`, 52 empty weeks, no alert, no commands). When `launch` is
absent or null the flight screen behaves as before.

```
launch?: null | {
  stage: "countdown" | "hold" | "liftoff" | "maxq" | "staging" | "fairing" | "orbit" | "separation" | "deploy" | "done",
  met: number,            // mission elapsed time in seconds, negative before lift-off
  vehicle: string,        // id of the launch option chosen in the design
  altitudeKm: number, velocityKms: number,
  progress: number,       // 0 to 1 along the ascent
  poll: [ { station: string, go: boolean | null } ],   // null = not polled yet
  line: string,           // what mission control says, English, ready to show
  outcome: null | "ok" | "lost" | "scrubbed"
}
```

- Unity decides everything, including the outcome. The page only draws it; the randomness the page uses is
  cosmetic (stars, exhaust, debris).
- `outcome: "lost"` (the vehicle failed, or the CubeSat did not deploy) and `"scrubbed"` (the launch did not go)
  end the attempt: that last frame also carries `report`, shown by the usual report card with retry and change
  design. A failed launch always ends the attempt.
- `outcome: "ok"`: the next frames continue into week 1 with no `launch` field.
- **Nothing is telegraphed.** While the launch goes on, `line` and the poll say only what is happening and its
  symptoms (a station answering NO-GO, a hold on the clock, telemetry lost): no odds, percentages or warnings
  about what may go wrong. The cause is named only afterwards, in `report.lostBecause`, `decisions` and
  `suggestion`. A clean design can still fail at launch.
- The page lights the LAUNCH segment from `launch`.

## Rules

- Unity is the only source of truth. The page never computes a resource, a check or a result; it shows what
  `state` and `simTick` say and sends what the player did.
- A field may be added by either side; a field is renamed or removed only by changing this file in the same
  pull request.
- All text sent to the page is in English and ready to show.
