# Mars version: plan

> Draft 0.2, 2026-11-15, 02:15. Written from the decisions Jose took in the early hours of 2026-11-15.
> **Nothing in this plan gets coded until Jose says go.** What is still open is in [section 12](#12-still-open).
> The game as it was before this plan (Earth Watch, with the Unity ship) is kept on the branch `backup/earth-watch`
> and is described in [game-plan.md](game-plan.md).

## 1. The game in one paragraph

Four people prepare a mission to Mars and then live it. In Act 1 they design the small satellite that will orbit
Mars for them: it maps where they land, warns them of storms and relays their data to Earth. Then it launches,
crosses to Mars and arrives. In Act 2 the four are on the surface for 30 sols with a list of tasks, and the
planet works against them. They decide each sol together over their communicators; when a communicator fails,
that person decides alone, without knowing what the others know. The satellite they designed decides how much
they can see and how often they can talk. When they lose, the attempt is kept, so they learn what worked.

## 2. Decisions taken

| Topic | Decision |
|---|---|
| Scope of this version | Both acts are about Mars. Earth Watch is not part of it and stays in the backup |
| Where it runs | One 2D pixel game in the web page, in the "Retro 4" style. No Unity in this version: the design steps reuse the screens that exist, with Mars data and rules in TypeScript |
| Mission (working name) | **Mars Relay:** a CubeSat that rides along with the crew's flight and orbits Mars, as NASA's two MarCO CubeSats did for InSight in 2018 |
| Step 6 of Act 1 | Launch, a short cruise where the months pass, arrival in orbit and landing, then Act 2. The launch can fail, which ends the attempt |
| Time in Act 2 | Turns, one per sol. A run is 30 sols |
| Winning | Finish the mission list before the window home closes (sol 30) |
| Losing | The window closes first, a vital resource runs out, or nobody is left able to work |
| Mission list | Power up the base; raise the antenna; sample three sites and send the data; save the satellite when it gets into trouble |
| Deciding | Together, over communicators. A player whose communicator has failed decides alone |
| A failed communicator | The player is blind but free to act: they see only their surroundings and their own gauges, no forecast and no view of the others' plans, and can still do anything their role can. The team learns what they did when the link returns |
| Communicators in Act 1 | They do not fail. Failures start on Mars, where the satellite the team designed decides how often they happen |
| Players | Four, each with their own screen |
| Demo for the submission | One page shows the four screens side by side. The characters play by themselves; a person can take over any one. No network |
| Characters | Four looks; each player picks a look and, separately, a role |
| Roles | Commander, engineer, scientist, communications officer. Each has its own skills and activities |
| Code structure | An abstract `Player`, one class per role, and interfaces for skills, activities, hazards, base modules, tasks and controllers, for maintainability |
| Hints | None, as before: nothing tells the player in advance what will go wrong. Causes are named only in the report after a run |
| Numbers | NASA data wherever it exists, each with its source. A number NASA does not give is labelled as the team's |
| Crew health | Each of the four has health gauges fed by real data: what the body goes through on Mars, not hit points |
| History | Every attempt is kept: the design, what each player did, what ended the run |
| Safety net | At 12:00 the team looks at what works. If the Mars version plays from design to the end of a run, it is submitted. If not, Earth Watch is submitted from the backup |

## 3. Act 1: designing Mars Relay

The six steps stay, and so do their screens. What changes is the mission, the options and the numbers.

| Step | Today (Earth Watch) | Mars Relay |
|---|---|---|
| 1. Need and goals | World and mission select; region to watch | Mars is the world. The mission is the relay. The team picks the landing region from two or three real ones |
| 2. Concept | Earth orbit; how often to image | The orbit around Mars (how high, how often it passes over the base) and what the satellite does on each pass |
| 3. Requirements | Images, deadline, budget, mass | What the crew needs from it: map detail, warning time before a storm, data relayed per sol; plus deadline, budget and mass |
| 4. Design | Format, power, attitude, storage, instrument, radio, ground station | The same groups. The ground station becomes time on NASA's Deep Space Network. Panels give less at Mars; the radio must reach Earth |
| 5. Build and verify | Tests and reserve | The same |
| 6. Fly | Launch, then 52 weeks | Launch, cruise, arrival, landing, then Act 2 |

What Mars changes in the numbers, and where each comes from:

| Number | Source | Status |
|---|---|---|
| Sunlight at Mars, for the panels | Derived from the repo's research data: about 586 W/m2, 43% of Earth's | In the repo |
| Travel time | NASA Trajectory Browser data in the repo: 176 to 288 days one way | In the repo |
| Radio link to Earth, delay and blackouts | NASA and JPL pages | Being gathered ([section 9](#9-data)) |
| Orbits around Mars, relay passes per sol | NASA mission pages (MRO, Odyssey, MAVEN, MarCO) | Being gathered |
| Launch as a ride-along | MarCO with InSight | Being gathered |
| Budget, and how design quality turns into maps, warnings and links | None: rules of the game | The team's, labelled as illustrative |

## 4. From Act 1 to Act 2

The design is not a score to carry over; it is the equipment the crew has.

| What the team designed | What it gives the crew on Mars |
|---|---|
| Instrument | How much of the map is known before they walk: sample sites, safe routes |
| Radio and Deep Space Network time | How much data reaches Earth per sol, and how long a warning takes to arrive |
| Orbit | How many sols have a pass over the base, and for how long |
| Power and battery | Whether the satellite keeps working through a dust season and a solar storm |
| Attitude control and tests | How often the satellite has a fault the crew must deal with |
| Storage | How much it can hold when a pass is missed |
| Mass and budget left | Supplies and spare parts the crew lands with |

## 5. Act 2: thirty sols

**One sol, in four beats:**

1. **Briefing.** Everyone with a working communicator sees the shared picture: the map known so far, the forecast if a warning arrived, shared power and supplies, the task list, and what the others intend.
2. **Choice.** Each player picks one activity for the sol. Linked players see each other's choices and can change theirs. An unlinked player picks alone.
3. **The sol plays.** The characters walk and work on the map. The environment acts: weather, cold, dust, the satellite's pass.
4. **Evening report.** What was done, what was lost, what changed. An unlinked player's sol is revealed to the team only once their link is back.

**Resources shown**, the challenge's six, as they read on the surface:

| Resource | On Mars |
|---|---|
| Power | What the base makes and stores; the array makes less under dust |
| Mass | What the crew landed with: supplies and spare parts |
| Budget | Spent in Act 1; what was left came along as mass |
| Data | Samples and readings waiting to be sent |
| Communications | Links between the four, and passes of the satellite |
| Time | Sols left before the window home closes |

**Hazards.** Each is a real condition with a real source (to be confirmed by the data in [section 9](#9-data)): a dust storm that cuts solar power and links, the cold of the night draining batteries, dust settling on the array, a solar storm, and the satellite's own problems. They are drawn from a seed, so the same design and seed replay the same run, and a retry differs.

**Crew health.** Each player has their own gauges, and they change with what the player does and what the planet does. The frame is NASA's own: the Human Research Program names five hazards of human spaceflight, and four of them act on the surface of Mars.

| Gauge | What moves it | NASA's hazard |
|---|---|---|
| Radiation dose | Every sol outside adds to it; a solar storm adds much more unless the player is sheltered | Space radiation |
| Energy and rest | Work outside, a short night, a long walk; sleep and a quiet sol restore it | Hostile and closed environments |
| Air, water and food | Used every sol; the base's power and supplies decide how much there is | Hostile and closed environments |
| Body | Suit wear, dust, cold, an accident during a job attempted without the skill | Gravity fields; hostile environments |
| Morale | Being cut off from the team, bad news, a failed task; contact and a finished task raise it | Isolation and confinement; distance from Earth |

A player whose gauge is low works slower and fails more often; one whose gauge runs out is out for the rest of the run, and the others must cover their role. The gauges show what is, never what is likely to happen. Help from Earth arrives with the radio delay, so the team treats its own: that is the commander's first aid. Every rate comes from the data in [section 9](#9-data), or is labelled as the team's.

**The base.** A few modules, built by spending supplies, power and sols: habitat, solar array, antenna, storage. The antenna shortens link failures; storage protects samples through a storm.

**Score, shown only after a run:** tasks completed, science delivered to Earth, resources left, and decisions under pressure (what was done with a hazard and with a dead link). With a line per role.

**History.** Every attempt: the design, the plan of each sol, who was cut off and what they did alone, and what ended it. Kept in the browser, so it survives a reload.

## 6. Players, roles and skills

| Role | Skills | Does best |
|---|---|---|
| Commander | Planning, logistics, first aid | Sets the plan of the sol, moves supplies, covers any job slowly |
| Engineer | Construction, repair, power | Builds modules, repairs hardware, clears dust from the array |
| Scientist | Geology, analysis, navigation | Samples and analyses sites, reads the satellite's maps |
| Communications officer | Radio, relay, forecasting | Restores links, schedules passes, receives storm warnings |

Any role may attempt any activity. Without the skill it takes longer and fails more often, so a player cut off from the team can always act.

Structure in code (TypeScript, under `web/src/mars/`):

| Piece | Kind | Purpose |
|---|---|---|
| `Player` | Abstract class | What all four share: look, position, energy, what they carry, link state; `skills` and `activities` are abstract |
| `Commander`, `Engineer`, `Scientist`, `CommsOfficer` | Classes extending `Player` | Each role's own skills and activities |
| `Skill` | Interface | An id, a name and a level |
| `Activity` | Interface | What it needs, how long it takes for a given player, and what it does to the world |
| `Hazard` | Interface | When it arrives and what it does each sol |
| `BaseModule` | Interface | Cost, build time, effect |
| `MissionTask` | Interface | What counts as done |
| `PlayerController` | Interface | Chooses a player's activity. Two kinds: a person at the screen, and the demo script |
| `MarsWorld` | Class | The state and the rules of a sol. Seeded, with no drawing code, so every rule is tested without a browser |

`PlayerController` is the seam for real separate devices later: a third kind that takes its choices from the network, with nothing else changing.

## 7. The demo

One page, four panels, one per player, each following its own character with its role's gauges and its own view of the information (a cut-off player's panel visibly knows less). The characters play by themselves from the demo script. Clicking a panel takes over that player; letting go returns it to the script. A fast-forward runs the 30 sols in a few minutes.

## 8. Work packages

The rules come first: every other package draws or drives them.

| Package | Scope | Depends on |
|---|---|---|
| A. Rules of Act 2 | `Player` and the roles, the interfaces, `MarsWorld`, the sol loop, hazards, links, tasks, win and lose, seeded, with tests | Nothing. First |
| B. Data | Mars numbers with sources, the Mars Relay options and checks for the six steps | Section 9 |
| C. Act 1 on Mars | The six screens fed from B, in the page, and the hand-over of the design to Act 2 | B |
| D. Act 2 screen | The map, the four panels, the four characters with their looks, the sol playing out | A's types |
| E. Demo and balance | The demo script, 30 sols that can be won and lost, score, history | A, D |
| F. Step 6 | Launch (the act already being built), cruise, arrival, landing | C |
| G. Link and submission | The page hosted publicly, project page, video or slides, credits, AI declaration | All |

## 9. Data

A research pass is collecting, from NASA and JPL pages, with the page and the sentence each number comes from: temperatures at rover sites, dust storms and what they did to solar power (Opportunity in 2018, InSight), radiation measured by Curiosity, what NASA publishes on crew health (dose limits, work outside, air, water and food per person, sleep, isolation in its analog missions), the radio delay and blackouts, relay passes and data volumes through the orbiters, what orbiters give a surface team, and dated events the game can use. Anything not found is recorded as not found, so it is not invented later.

## 10. Order and checkpoints

| When | What | Done when |
|---|---|---|
| Now | A, and the data pass | The rules run 30 sols in tests, win and lose both reachable |
| Then, in parallel | C and D | The six steps play with Mars data; a sol can be watched on the map |
| Then | E and F | A person can design, launch, land and play to sol 30 or lose; the demo plays itself |
| **12:00** | **Decide which version is submitted** | |
| 14:00 | Feature freeze | |
| 14:00 to 19:00 | G; fixes only | Every link opens in a private window |
| 19:00 to 21:00 | Submit | "Submit for Judging" pressed |

If it does not fit, cut in this order: base modules beyond the array and the antenna; the cruise (cut straight from launch to arrival); the four looks (one look per role); score per role; then shorten the run from 30 sols.

## 11. How we will know it works

- Tests on the rules: a good design and sensible play win; a bad design loses more often; every hazard has a cost; every health gauge can be lowered and restored; a cut-off player's choice is hidden until the link returns; the same seed replays the same run.
- The whole game played by hand in a browser, from step 1 to the end of a run, on a computer and on a tablet.
- The demo watched from start to end without touching it.
- No text shown before or during a run contains odds or advice about what will go wrong.

## 12. Still open

1. Who builds each package, and on which computers and subscriptions.
2. The team's values: budget, the conversion from design to maps, warnings and links, hazard frequencies, supplies. All to be labelled as illustrative.
3. Whether the crew on Mars is presented as a NASA plan or as the game's fiction. NASA has studies of crewed Mars missions, not a mission.
4. Where the page is hosted.
5. The name of the game and of the mission.

## 13. Risks

- **Time.** About ten hours to the 12:00 decision, with a new act and new data. Section 10 says what to cut.
- **Balance.** Thirty turns with four players and random hazards are hard to tune in a day. A run that cannot be won, or cannot be lost, teaches nothing.
- **Fit with the challenge.** The challenge is a mission design game. Act 1 must stay the heart of it, and Act 2 must show the consequences of the design, not replace it.
- **Rules in two places.** The Mars rules are written in the page while Earth Watch's are in Unity. The two versions do not share logic.
