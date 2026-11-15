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
                   decisions: [ string ], suggestion, images: [ ... 52 states ],
                   outcome }  // outcome: Success | Too few images | Satellite lost | Requirements not met
}
```

## Rules

- Unity is the only source of truth. The page never computes a resource, a check or a result; it shows what
  `state` and `simTick` say and sends what the player did.
- A field may be added by either side; a field is renamed or removed only by changing this file in the same
  pull request.
- All text sent to the page is in English and ready to show.
