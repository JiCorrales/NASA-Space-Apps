# Requirements specification: Space Mission Design Game

Draft 0.1, 2026-11-14. For the team to review and correct before more work is assigned.

This document says what the game must do, where each requirement comes from, and how we will know it is met.
It does not say how to build it. Anything the team has not decided is listed in
[section 9](#9-decisions-the-team-still-has-to-make) and marked *(to confirm)* where it appears.

## 1. The product

A 3D game in Unity, playable in virtual reality and in a web browser, for the
[Space Mission Design Game](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/)
challenge of the NASA Space Apps Challenge 2026. The player is inside a spaceship and walks through it. Each
screen in the ship decides one part of a space mission. The game then simulates the mission and explains how
each decision affected the result.

**Scope of the first version** (decided 2026-11-14): one uncrewed CubeSat mission in low Earth orbit.

**Out of scope for the first version:** a crew health module, missions beyond Earth orbit (Moon, Mars,
telescopes), and anything in [section 5.7](#57-optional-features-not-planned-for-the-first-version).

## 2. Where the requirements come from

| Source | What it gives |
|---|---|
| The challenge statement (the team keeps a Spanish copy with its research in `Resources/`) | What the game could and should let players do. Most of it is worded as "could" or "consider"; one sentence says "should". |
| Project Submission Guide and Judging and Awards Guide (spaceappschallenge.org) | The hard rules of the submission and the five judging criteria. |
| The team's research in `Resources/` | NASA sources and data for the numbers the game uses. |
| Decisions made by the team on 2026-11-14 | The concept (a ship with screens), VR, the browser build, the scope above. |
| `CONTRIBUTING.md` | How we work in the repository. |

Priorities used below:

- **Must:** the core of the challenge, the one "should" in the statement, a hard submission rule, or a decision
  the team already made. Without it the entry is incomplete.
- **Should:** something the statement names as part of a strong solution or asks us to consider.
- **Could:** an optional extra from the statement's list.

## 3. Who uses it

- **Players:** students and curious people with no space background. They play alone or in a group of up to
  four around one headset or one computer *(the form of group play is to confirm, see D-05)*.
- **Judges:** they open a public link in a browser, with no headset, no login and nobody to explain the game,
  and they watch a demo of 30 seconds or 7 slides.

## 4. Mission design flow the game follows

The statement gives the order: define the objective, set the requirements, design the spacecraft, choose the
instruments, choose the launch vehicle and the orbit, manage the constraints, simulate and evaluate. The ship's
screens follow that order.

## 5. Functional requirements

### 5.1 Designing the mission

| ID | The game shall | Source in the statement | Priority | How we check it |
|---|---|---|---|---|
| FR-01 | let the player choose a mission objective before any engineering decision | Objectives; Mission design | Must | No spacecraft, instrument, launch or orbit choice can be confirmed before an objective is chosen |
| FR-02 | show the requirements that follow from the chosen objective (what must be measured, how much science, how long, with what budget and by when) | Objectives | Must | Each objective has its requirements on screen, in numbers, before the spacecraft is designed *(whether the player sets them is D-03)* |
| FR-03 | let the player design the spacecraft by choosing its size and its subsystems | Objectives; Spacecraft and payload | Must | A complete design cannot exist without each subsystem the team lists in D-04 |
| FR-04 | let the player select science instruments, each with its own mass, power draw, cost, data generated and science value | Objectives; Spacecraft and payload | Must | Every instrument shows those five values and they enter the calculations |
| FR-05 | let the player choose a launch option with its payload capacity, cost and the orbits it reaches | Objectives; Orbit and launch | Must | Every launch option shows those three things and they enter the calculations |
| FR-06 | let the player choose among several orbits and explain what each means for observation, communications and mission lifetime | Objectives; Orbit and launch | Must | At least three orbits, each with a short explanation and a different effect on the result |
| FR-07 | check that the spacecraft's mass and the chosen orbit are compatible with the launch option, and say why when they are not | Orbit and launch | Should | An incompatible combination cannot fly and the reason is shown |
| FR-08 | make every major decision change at least one other part of the mission | Objectives; Mission design | Must | Adding an instrument raises science and also mass, power, cost and data, visibly |
| FR-09 | allow more than one design to meet the same objective | Mission design | Should | For each objective, two different designs both succeed |
| FR-10 | offer simple and advanced components according to difficulty | Spacecraft and payload | Could | See D-08 |

### 5.2 Resources and constraints

| ID | The game shall | Source in the statement | Priority | How we check it |
|---|---|---|---|---|
| FR-11 | show clearly the six resources: mass, power, budget, data, communications and time, each as used against available | Resource management (the statement's only "should") | Must | All six are visible, with units, from every screen where a decision is made |
| FR-12 | update the resources as soon as a choice changes | Objectives | Must | The display changes without leaving the screen where the choice was made |
| FR-13 | apply realistic limits to budget, mass, power, communication capacity and mission lifetime, and mark a resource that exceeds its limit | Mission design | Must | A design over any limit is marked and cannot be flown as a success |
| FR-14 | point out which resources are critical for the chosen mission | Resource management | Could | - |

### 5.3 Simulation and evaluation

| ID | The game shall | Source in the statement | Priority | How we check it |
|---|---|---|---|---|
| FR-15 | simulate the designed mission and show its outcome | The challenge sentence; strong solution | Must | From a complete design the player can run the mission and reaches a result |
| FR-16 | evaluate the outcome against the objective and its requirements | The challenge sentence; strong solution | Must | The result states whether the objective was met and by how much |
| FR-17 | let the player change the design and simulate again, as many times as they want | Game design | Should | After a result, the player can return to any decision and run again |
| FR-18 | include random events or unexpected constraints | Additional features | Could | See D-07 |
| FR-19 | produce a mission report at the end of each simulation | Additional features | Could | - |

### 5.4 Feedback, scoring and learning

| ID | The game shall | Source in the statement | Priority | How we check it |
|---|---|---|---|---|
| FR-20 | explain in plain language why the mission succeeded or failed, naming the decisions responsible | Game design; Educational value | Must | Every failed check and every result comes with a sentence a newcomer understands |
| FR-21 | score the mission so that success, science value, efficient use of resources and good decisions are rewarded | Game design; Objectives | Should | The scoring rule is written down (D-06) and a wasteful success scores below an efficient one |
| FR-22 | introduce the concepts it uses (orbital altitude, payload capacity, power consumption, data rate, communications) in simple terms inside the game | Educational value | Should | Each concept has a short explanation reachable from the screen that uses it |
| FR-23 | let a first-time player start without outside help | Game design; Educational value | Should | Someone who has never seen the game completes a mission using only what the game shows |
| FR-24 | show where its numbers come from | Judging criteria (Relevance, Validity) | Should | A value taken from NASA shows its source in the game |

### 5.5 Collaboration

| ID | The game shall | Source in the statement | Priority | How we check it |
|---|---|---|---|---|
| FR-25 | be playable by one person | Objectives; Game design | Must | One player completes a mission alone |
| FR-26 | let up to four people work on the same mission | Strong solution; Collaboration | Should | Form to be decided in D-05 |
| FR-27 | give team members different responsibilities (planning, spacecraft, science, communications, resources) while decisions stay collective | Game design; Collaboration | Should | Each responsibility maps to decisions in the game |
| FR-28 | create situations where the team must negotiate between competing priorities, with a result that depends on how well they coordinate | Collaboration | Could | - |

### 5.6 The ship and the interface

| ID | The game shall | Source | Priority | How we check it |
|---|---|---|---|---|
| FR-29 | place the player inside a spaceship in 3D and let them move through it | Team concept | Must | The player can reach every screen by moving |
| FR-30 | put each mission decision on a screen in the ship, in the order of section 4 | Team concept | Must | Each requirement FR-01 to FR-06 has its screen |
| FR-31 | be playable in a VR headset with its controllers | Team decision | Must | A full mission is completed in the headset |
| FR-32 | be playable with keyboard and mouse, without a headset, in a web browser | Team decision (public link for judges) | Must | A full mission is completed in the browser build |
| FR-33 | have a clear interface in English, readable at the distance a VR player stands from a screen and in a browser window | Strong solution; submission rules | Must | Text is legible in both and no screen needs explaining |
| FR-34 | show a model of the spacecraft that reflects the player's design | Additional features | Could | - |

### 5.7 Optional features not planned for the first version

From the statement's list of additional features: several mission scenarios, difficulty levels, realistic or
simplified spacecraft models, leaderboards, saving, sharing and comparing designs, competitive scenarios between
teams, and a free experimentation mode. Each stays out unless the team moves it into a table above.

## 6. Data requirements

| ID | Requirement | Source |
|---|---|---|
| DR-01 | Every number the game uses (launch options, orbits, instruments, costs) lives in a data file under `Assets/_Project/Data/`, not in a script | `CONTRIBUTING.md` |
| DR-02 | Every value records its source and whether it was read in a NASA document, derived from one, or chosen by the team | `CONTRIBUTING.md`; the labels used in `Resources/` |
| DR-03 | At least one NASA resource is a core part of the game, and every resource used is listed in `CREDITS.md` | Submission guide; judging criterion Relevance |
| DR-04 | No value is presented as NASA data unless someone checked it in the source | The rule in `Resources/README.md` |
| DR-05 | Values the research marks as undefined are set by a team member, not left to whoever writes the code | Challenge rule: AI is a tool, not the author of the solution |

## 7. Other requirements

| ID | Requirement | Source |
|---|---|---|
| NFR-01 | Unity 6000.6.9f1 on every machine, the version in `ProjectSettings/ProjectVersion.txt` | `CONTRIBUTING.md` |
| NFR-02 | Targets: a Windows PC with a Meta Quest headset over Link (OpenXR) *(model to confirm)*, and a WebGL build for desktop browsers | Team decisions |
| NFR-03 | Everything in the game, the code and the repository is in English | Submission guide; `CONTRIBUTING.md` |
| NFR-04 | Nothing shows NASA logos, flags or mission identifiers; no images, video or audio of people under 18 | Submission guide |
| NFR-05 | Third-party assets have a licence that allows their use and are listed in `CREDITS.md`; AI use is declared in `AI_USAGE.md`; AI-generated images and video carry a visible watermark | Submission guide |
| NFR-06 | The game is comfortable in VR: a way to move that does not cause discomfort, and a steady frame rate *(target to confirm, D-12)* | Good practice for VR |
| NFR-07 | The browser build loads and starts without installing anything *(size and load-time target to confirm, D-12)* | Team decision |
| NFR-08 | A first-time player finishes one mission in a short session *(length to confirm, D-12)* | Judges' time |
| NFR-09 | A change is validated on the development PC, then tested on the PC with the headset, before it is promoted to `main` | `CONTRIBUTING.md` |

## 8. Submission requirements

From the official guides, read on 2026-11-14. Missing one keeps the project out of global judging.

| ID | Requirement |
|---|---|
| SR-01 | Submit by Sunday 2026-11-15 at 23:59, local event time. The last saved version counts |
| SR-02 | The project page and all linked material are in English. A video may be spoken in another language with English subtitles |
| SR-03 | A demo: a video of 30 seconds or less, or up to 7 slides. Going over disqualifies |
| SR-04 | The demo and the final project open from public links, with no password, permission or sign-up |
| SR-05 | The "NASA Data" field describes in detail the NASA data or resources used |
| SR-06 | Every outside resource (code, text, images), even free ones, is listed in the references |
| SR-07 | The use of AI is declared, in the form and inside the project |
| SR-08 | The team has 1 to 6 members, all registered in the same local event, and "Submit for Judging" is pressed |

The team's own check of the guides (its project requirements note in `Resources/`) could not find SR-02 and the eligibility part of
SR-05 in the guide version it read. Until someone confirms otherwise, treat both as required: they cost little
to meet and a great deal to miss.

## 9. Decisions the team still has to make

| ID | Decision | Affects |
|---|---|---|
| D-01 | Decided: first version is one uncrewed CubeSat mission in low Earth orbit | Everything |
| D-02 | Which mission objectives the game offers, and how many | FR-01, FR-09 |
| D-03 | Does the player set the requirements, or review the ones the objective brings? | FR-02 |
| D-04 | Which subsystems are player choices: structure and size, power, batteries, communications, on-board computer, attitude control | FR-03 |
| D-05 | Group play: taking turns on one machine, or several machines connected | FR-26 to FR-28 |
| D-06 | The scoring rule, and what counts as success, partial success and failure | FR-16, FR-21 |
| D-07 | Random events: in or out, and which | FR-18 |
| D-08 | Who sets the values the research marks as undefined (costs, science values, instruments with no source), and whether there are difficulty levels | DR-05, FR-10 |
| D-09 | Decided: no crew health module in the first version | Scope |
| D-10 | Whether to compute orbit data with NASA's GMAT, one of the challenge's listed resources | DR-03 |
| D-11 | Team name; who owns the demo and who owns the project page | SR-03, SR-08 |
| D-12 | Targets for frame rate, browser download size and session length | NFR-06 to NFR-08 |
| D-13 | The research notes are in Spanish: translate them, or keep them out of the linked material | SR-02 |

## 10. How the work is divided

Proposal, *(to confirm)* with the team. Each package is worked on one teammate's computer with Claude Code and
arrives in the repository as pull requests. Packages own different folders so two computers never edit the same
file, and one scene has one owner at a time.

| Package | Scope | Folders it owns | Requirements |
|---|---|---|---|
| WP-1 Mission data | Turn the research into the game's data files, each value with its source | `Assets/_Project/Data/` | DR-01 to DR-05; the data behind FR-04 to FR-06 |
| WP-2 Mission logic | The design, the checks, the simulation and the score, with automated tests | `Assets/_Project/Scripts/Mission/`, `Assets/_Project/Tests/EditMode/` | FR-07 to FR-09, FR-13, FR-15 to FR-21 |
| WP-3 Ship and movement | The ship, the VR rig, the keyboard-and-mouse rig | `Assets/_Project/Scenes/`, `Assets/_Project/Prefabs/Ship/`, `Assets/_Project/Scripts/Ship/` | FR-29 to FR-32, NFR-06 |
| WP-4 Screens | The decision screens, the resource display, the simulation result and the explanations | `Assets/_Project/Scripts/UI/`, `Assets/_Project/Prefabs/UI/` | FR-01 to FR-06, FR-11, FR-12, FR-20, FR-22 to FR-24, FR-33 |
| WP-5 Builds and validation | The browser build, the checks on the development PC, the test in the headset | `Assets/_Project/Scripts/Editor/Build/` | NFR-02, NFR-07, NFR-09 |
| WP-6 Submission | Project page, demo, credits, AI declaration, English check | `CREDITS.md`, `AI_USAGE.md`, the page itself | SR-01 to SR-08 |

What is known about the machines today: the PC with the headset has Unity 6000.6.9f1 and Claude Code; a second
teammate PC has Claude Code and a clone of the repository but no Unity; the development PC has Unity and
validates. Who takes which package is the team's call.

WP-2 and WP-4 meet at one boundary: what the screens ask the mission logic and what it answers. The two owners
agree that boundary in writing before either starts.

## 11. When a requirement is done

1. Its check in section 5 passes, and the pull request shows the proof `CONTRIBUTING.md` asks for.
2. It works on the development PC.
3. If it touches VR, it works in the headset.
4. Its numbers have their sources (section 6), and anything new is in `CREDITS.md` or `AI_USAGE.md`.

## 12. How the requirements serve the judging criteria

| Criterion | What the judges look at | Requirements that carry it |
|---|---|---|
| Impact | How big the problem is and how many people it helps or inspires | FR-22, FR-23, FR-25 |
| Creativity | How new the approach is | FR-29, FR-30, FR-31 |
| Validity | Scientific basis, feasibility, how complete and usable it is | FR-07, FR-08, FR-13, DR-02, DR-04 |
| Relevance | How directly it answers the challenge and whether NASA data is central | FR-01 to FR-06, FR-11, FR-15, DR-03, FR-24 |
| Presentation | How clearly the demo and the project page tell the story | SR-03, SR-04, FR-33 |
