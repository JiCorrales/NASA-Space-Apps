# Software requirements specification (ERS): Space Mission Design Game

> Draft 0.2, 2026-11-14. Structure: ISO/IEC/IEEE 29148:2018, clause 9.6, following the team's QA template for
> an ERS (rubric criteria ERS-01 to ERS-09, noted next to each section). Basis: the challenge statement, the
> submission and judging guides, the research in `Resources/` and the decisions made on 2026-11-14. Nothing in
> this document has been validated by the team yet: assumptions are marked ASM and the open decisions are in
> [section 12](#12-open-decisions), in the order they should be taken.

## 1. Purpose

*(ERS-02)*

To specify the game the team will submit to the NASA Space Apps Challenge 2026 in enough detail to (a) agree
what is being built and what is not, (b) divide the work between the teammates' computers without two of them
building the same thing, and (c) check each part when it arrives. Readers: the four team members, the Claude
Code sessions that work with them, and whoever tests the game.

## 2. Scope

*(ERS-01)*

### 2.1 Product name

**Space Mission Design Game** *(working title, the challenge's own name; to confirm, DA-01)*.

### 2.2 What the software will do

- Put the player inside a spaceship, in 3D, and let them walk through it.
- Offer one screen per mission decision: objective, requirements, spacecraft, instruments, launch vehicle and
  orbit.
- Show at all times the six resources of the mission (mass, power, budget, data, communications, time) and how
  each decision changes them.
- Simulate the designed mission, say whether it met its objective, and explain why.
- Run in a virtual reality headset and, with keyboard and mouse, in a web browser.

**What it will not do in the first version:** crewed missions or crew health; missions beyond Earth orbit
(Moon, Mars, telescopes); real orbital mechanics computed during play; accounts or saved progress. See 9.4.

### 2.3 Application: benefits, objectives and goals

| ID | Objective | Measurable goal |
|---|---|---|
| GOAL-01 | Players understand the trade-offs of designing a mission | After one session, a first-time player can say in their own words why their mission succeeded or failed *(how to measure it is to agree, DA-11)* |
| GOAL-02 | A complete mission fits in a short session | A first-time player goes from the first screen to a simulated result in *N* minutes *(N to agree, DA-12)* |
| GOAL-03 | NASA data is a core part of the game, not decoration | Every number shown to the player carries its source, and the share read from NASA documents is stated in the submission *(target share to agree, DA-13)* |
| GOAL-04 | The entry is eligible for global judging | Submitted before the deadline with every rule of section 7 met |

### 2.4 Consistency with higher-level specifications

The only higher-level specification is the challenge statement (R-01). Its "Objectives" section lists six
things the game could let players do; sections 4 and 10 follow that list in the same order. Where this
document adds something the statement does not ask for (a ship to walk through, virtual reality), the source is
a team decision and is marked TD.

## 3. Product perspective

*(ERS-03)*

A new, self-contained product. It replaces nothing and depends on no other system while it runs.

| Part | User | What it is |
|---|---|---|
| The game in VR | Player with a headset | A Windows build, or the Unity editor, driving the headset |
| The game in a browser | Player or judge without a headset | A WebGL build, played with keyboard and mouse |
| The mission data | The team | Data files with every number the game uses, each with its source |

### 3.1 System interfaces

| Interface | Between | Requirements it serves |
|---|---|---|
| Mission data files | The data and the mission logic | REQ-DAT-001, REQ-DAT-002 |
| Mission logic and screens | What the screens ask and what the logic answers (the current design, the six resources, the problems found, the simulation result) | REQ-RES-001 to REQ-RES-004, REQ-SIM-001, REQ-FBK-001 |
| Input | The player's device and the ship (move, point, select) | REQ-SHP-003, REQ-SHP-004 |

The second interface is the boundary between two work packages (Annex A); its exact form is agreed in writing
by their owners before either starts.

### 3.2 User interfaces

- Screens fixed in the ship, one per decision, each with a title, a short explanation, the options with their
  numbers, the current choice and a way to confirm.
- The six resources visible from every screen where a decision is made.
- The same screens respond to a VR controller ray and to a mouse.
- English, plain language, no prior knowledge assumed.
- Text legible at the distance a VR player stands from a screen (about 1.5 to 2 m) and in a browser window.
- Visual style guide *(to define, DA-10)*.

### 3.3 Hardware interfaces

- A Meta Quest headset used as PC VR over Link, with its two controllers *(model to confirm, ASM-01)*.
- A Windows PC able to drive the headset.
- For the browser build: any desktop or laptop with a keyboard, a mouse and a browser that supports WebGL 2.

No other hardware. The game does not use hand tracking, haptics or a microphone in the first version.

### 3.4 Software interfaces

| Product | Version | Used for |
|---|---|---|
| Unity | 6000.6.9f1, pinned in `ProjectSettings/ProjectVersion.txt` | The engine |
| OpenXR, XR Interaction Toolkit, Universal Render Pipeline | The versions in `Packages/manifest.json` | VR input and rendering |
| Meta Horizon Link | The one installed on the headset PC | OpenXR runtime for the headset |
| A WebGL 2 browser | Current desktop versions | The browser build |

No database and no operating-system service beyond these.

### 3.5 Communication interfaces

None while the game runs in the first version. The browser build is a set of static files served over HTTPS.
If the team chooses connected group play (DA-09), this section gains a network protocol and the affected
requirements are REQ-COL-002 to REQ-COL-004.

### 3.6 Operations

- **Normal:** one session, from choosing an objective to reading the result, then redesigning or starting again.
- **Group:** up to four people on the same mission *(form to decide, DA-09)*.
- **Start-up:** the game detects whether a headset is active and offers VR or keyboard and mouse accordingly.
- No installation, account or sign-in for the browser build.

### 3.7 Site adaptation requirements

None per site. The mission data files are the only configuration: changing a number, an option or an
explanation does not require changing code (REQ-DAT-001).

### 3.8 Interfaces with services

Static hosting of the browser build at a public address *(service to confirm, DA-14; GitHub Pages is the
candidate because the repository is already public)*. No cloud service while the game runs.

## 4. Product functions

*(ERS-04)*

### 4.1 List of functions

| Module | Prefix | Summary |
|---|---|---|
| Mission objective and requirements | MIS | Choose what the mission is for; see what that demands |
| Spacecraft | SPC | Choose the size and the subsystems |
| Instruments | INS | Choose the science instruments |
| Launch and orbit | LAO | Choose the launch vehicle and the orbit; check they fit the spacecraft |
| Resources and constraints | RES | Show the six resources, their limits and how decisions move them |
| Simulation and evaluation | SIM | Run the mission and judge the result against the objective |
| Feedback, scoring and learning | FBK | Explain why, score, teach the concepts |
| Collaboration | COL | One player, or up to four on the same mission |
| Ship and interface | SHP | The ship, moving through it, the screens, VR and browser |
| Mission data | DAT | The numbers, their sources and their status |

### 4.2 Textual model of the relations

How the functions depend on each other. It shows logical relations, not a design.

```
Mission objective (MIS)
  -> requirements: what to measure, how much science, how long, budget, deadline (MIS)
       -> instruments that can measure it (INS)
            -> each adds science, and also mass, power draw, data and cost
       -> spacecraft size and subsystems that can carry and feed them (SPC)
            -> mass limit, power generated, data sent down
       -> launch vehicle and orbit (LAO)
            -> what mass reaches which orbit, at what cost; the orbit sets sunlight, contact time, lifetime
  -> the six resources, used against available (RES)
       -> simulation of the mission (SIM)
            -> result against the objective, with the reasons (FBK)
                 -> the player changes a decision and runs again
```

A diagram of this model can be added once the team settles the decisions of section 12.

## 5. User characteristics

*(ERS-05)*

| User | Description | What that demands of the game |
|---|---|---|
| Player | Student or curious person, secondary school age and up *(to confirm, DA-11)*; no knowledge of space engineering; may never have used VR | Plain language, concepts explained where they are used, a comfortable way to move in VR, no reading of manuals |
| Group of players | Up to four people around one headset or one computer, or each on their own *(DA-09)* | Something for each person to decide; a result that depends on how they coordinate |
| Judge | Evaluates many entries in little time; opens a public link in a browser, without a headset and without anyone to explain | The browser build starts by itself and makes its goal and controls obvious in the first seconds |
| Team member testing | Knows the game; checks a requirement | Each requirement has a check that can be carried out (section 10) |

The game must not depend on colour alone to signal that a resource is over its limit, and text must stay
legible for a player who cannot step closer to a screen.

## 6. Limitations

*(ERS-06)*

- **Time:** the submission closes on Sunday 2026-11-15 at 23:59, local event time. The scope of section 10 is
  ordered by priority for that reason.
- **One headset:** VR can be tested on one PC only. The development PC runs Linux and has no headset, so it can
  check compilation, automated tests, keyboard-and-mouse play and builds, but not the headset.
- **Browser builds:** no threads, no embedded video, no sound before the first click or key press, and a
  download size that judges will feel.
- **Data:** NASA publishes no price per component and no price per small launch; some values will be the
  team's own and must be labelled as such (REQ-DAT-002).
- **Team machines:** not every teammate PC has Unity installed (ASM-04).

## 7. Design constraints and standards compliance

*(ERS-07)*

Constraints limit how the game may be built or presented; they are not functions of the game. Each one names
the requirement it produces and what happens if it is not met.

| ID | Constraint and its source | Requirement derived | If it is not met |
|---|---|---|---|
| NOR-01 | Everything on the project page and in the linked material is in English. NASA Space Apps Project Submission Guide, as published on 2026-11-14 (R-02; the page carries no version number) | REQ-NFR-003 | Not eligible for global judging |
| NOR-02 | A demo is required: a video of 30 seconds or less, or up to 7 slides (R-02) | REQ-SUB-003 | Going over the limit disqualifies |
| NOR-03 | The demo and the final project open from public links with no password, permission or sign-up (R-02) | REQ-SUB-004, REQ-SHP-004 | Judges cannot open the project |
| NOR-04 | At least one NASA data set or resource is used and described in the "NASA Data" field (R-02) | REQ-DAT-003, REQ-SUB-005 | Not eligible for global awards |
| NOR-05 | Every outside resource (code, text, images), even free ones, is listed (R-02, R-03) | REQ-SUB-006, REQ-NFR-005 | The entry can be disqualified |
| NOR-06 | The use of AI is declared; AI-generated images and video carry a visible watermark; AI is a tool and does not conceive the solution (R-02) | REQ-SUB-007, REQ-DAT-005 | The entry can be disqualified |
| NOR-07 | Generated content shows no NASA logo, flag or mission identifier. NASA Brand Guidelines (R-04) | REQ-NFR-004 | The content must be removed |
| NOR-08 | No images, video or audio of people under 18 (R-02) | REQ-NFR-004 | The content must be removed |
| NOR-09 | The Unity template's assets may be used only in a project that depends on Unity. Unity Companion License (R-07) | REQ-NFR-005 | The assets cannot be distributed outside the game |
| CON-01 | One Unity version, one owner per scene, numbers in data files, all changes through pull requests. `CONTRIBUTING.md` (R-06) | REQ-NFR-001, REQ-DAT-001 | Work from two computers collides or is lost |

The team's own check of the guides could not find NOR-01 and the eligibility part of NOR-04 in the version it
read. Until someone confirms otherwise, treat both as in force: they cost little to meet and a great deal to
miss. The game collects no personal data, so no data-protection rule applies (ASM-06).

## 8. Assumptions and dependencies

*(ERS-08)*

### 8.1 Assumptions

An assumption is something taken as true, not something the game must do.

| ID | Assumption | Requirements affected | If it turns out false | How it is confirmed |
|---|---|---|---|---|
| ASM-01 | The headset is a Meta Quest used as PC VR over Link | REQ-SHP-003, REQ-NFR-002 | A standalone build for the headset is needed, with its own performance limits | Ask Alexander, who has the headset *(pending)* |
| ASM-02 | Judges open the project in a desktop browser with WebGL 2 | REQ-SHP-004, REQ-NFR-007 | A downloadable build and a longer video carry the entry | Cannot be confirmed; kept as the safe case |
| ASM-03 | The first version stays with one uncrewed CubeSat mission in low Earth orbit | All of section 10 | The data, the screens and the simulation grow with each added mission type | Decided on 2026-11-14; reopened only by the team |
| ASM-04 | Every computer that writes game code has Unity 6000.6.9f1 | REQ-NFR-001, Annex A | That computer can only contribute data or documents | Check each PC before assigning a package *(one has no Unity today)* |
| ASM-05 | The research values can be used in the game with a citation | REQ-DAT-002, REQ-DAT-003 | The value is replaced by one of the team's, labelled as such | Read each source's terms of use *(one catalogue's terms are unread)* |
| ASM-06 | The game stores nothing about the player | 3.6, section 7 | Privacy requirements appear | Holds unless accounts or leaderboards are added (9.4) |
| ASM-07 | The submission rules are the ones read on 2026-11-14 | REQ-SUB-001 to REQ-SUB-008 | Requirements change | Ask the local event lead *(pending)* |

### 8.2 External dependencies

| Dependency | Outside our control because | Requirements that depend on it |
|---|---|---|
| Unity and its packages | Third-party software | REQ-NFR-001, all of SHP |
| Meta Horizon Link | Third-party runtime on the headset PC | REQ-SHP-003 |
| A public host for the browser build | Third-party service | REQ-SUB-004 |
| NASA documents and data sets | Published by others; may change or become unavailable | REQ-DAT-002, REQ-DAT-003 |
| The Space Apps submission site | Closes at a fixed time | REQ-SUB-001 |

## 9. Rationale and nature of the changes

*(ERS-09)*

### 9.1 The current situation

There is no existing system. The statement describes the situation the game answers: students rarely get to
work through a whole mission, existing tools cover one topic at a time (orbits, spacecraft, launches), and the
trade-offs between them stay abstract.

### 9.2 Desired changes

- **Capabilities:** design a whole mission, see every decision move the others, simulate it and learn why it
  worked or failed.
- **Processing:** the player's choices and the mission data go in; the six resources, the problems found and
  the simulated result come out.
- **Interface:** decisions are made on screens inside a ship the player walks through, in VR or in a browser.
- **People:** one player, or a group of up to four with different responsibilities.
- **Environment:** a headset PC for VR; any browser for everyone else.
- **Operation:** short sessions, no installation for the browser build, no supervision needed.

### 9.3 Priorities

**Essential** (the game is not an answer to the challenge without them), most important first:

| Change | If it is not delivered |
|---|---|
| The six design decisions of the statement (MIS, SPC, INS, LAO) | The entry does not let players design a mission |
| The six resources shown and limited (RES) | The statement's only "should" is not met |
| Simulation, evaluation and the explanation of why (SIM, FBK) | The player cannot see how choices affect success, which is the challenge's core sentence |
| A browser build anyone can open (SHP) | Judges cannot play it |
| NASA data with sources (DAT) | Not eligible for global awards and weak on the Relevance criterion |

**Desirable** (the statement names them as part of a strong solution):

| Change | Why it is desirable |
|---|---|
| Group play for up to four with roles (COL) | Named in the statement's description of a strong solution |
| A score that rewards good engineering (FBK) | The statement asks for feedback that rewards effective decisions |
| Concepts explained inside the game and a start that needs no help (FBK) | The statement's educational value section; judges play without guidance |
| Playing in the headset (SHP) | The team's concept and its main claim on the Creativity criterion |
| The launch and orbit compatibility check (LAO) | The statement asks to consider it; it is a real engineering check |

**Optional** (the statement lists them as extras):

| Change | Why it is optional |
|---|---|
| Random events, a mission report, a model of the spacecraft | Each improves the experience; none is needed to answer the challenge |
| Difficulty levels, simple and advanced components | Useful only once one level works well |

### 9.4 Changes considered and not included

| Change | Why it is left out of the first version |
|---|---|
| A crew health module | The statement does not ask for it and a CubeSat has no crew. The research stays in `Resources/` as future work |
| Missions beyond Earth orbit | Each mission type multiplies the data, the screens and the simulation. The research stays as future work |
| Group play over a network | The most expensive item for the time available *(reopened if DA-09 decides so)* |
| Leaderboards; saving, sharing and comparing designs | They need stored data and, for leaderboards, a service; none is needed to answer the challenge |
| Competitive play between teams; free experimentation mode | Listed by the statement as extras |
| Running NASA's GMAT during play | Too heavy for a game session; using it beforehand to compute the orbit data is still open (DA-13) |

### 9.5 Assumptions and constraints that affect users over the product's life

- The game is built for the hackathon and the judging period that follows; nobody is assumed to maintain it
  afterwards.
- The public link must keep working until judging ends *(dates to confirm, ASM-07)*.
- The data is fixed at submission; a value corrected later does not reach players who already have the build.

## 10. Specific requirements

### 10.1 Conventions

- **ID:** `REQ-<MODULE>-NNN`, stable once assigned.
- **Wording:** "shall" is mandatory; "should" is recommended; "may" is permitted.
- **Priority (MoSCoW):** **M** must be in the first version; **S** should be; **C** could be; **W** will not be
  in the first version. *Proposed; the team confirms them.*
- **Source:** `ST-` plus the statement's section (OBJ Objectives, GD Game design and experience, MD Mission
  design, SP Spacecraft and payload, OL Orbit and launch, RM Resource management, CO Collaboration, ED
  Educational value, AF Additional features); `TD` team decision of 2026-11-14; `NOR-nn`, `CON-nn`, `ASM-nn`
  from sections 7 and 8; `JG` the judging guide.
- **Acceptance criterion:** what someone does or observes to say the requirement is met.

### 10.2 MIS, mission objective and requirements

| ID | Requirement | Prior. | Source | Acceptance criterion |
|---|---|---|---|---|
| REQ-MIS-001 | The game shall make the player choose a mission objective before any engineering decision | M | ST-OBJ, ST-MD | No spacecraft, instrument, launch or orbit choice can be confirmed before an objective is chosen |
| REQ-MIS-002 | The game shall offer more than one mission objective | M | ST-OBJ | At least *n* objectives can be chosen *(n and which ones: DA-02)* |
| REQ-MIS-003 | The game shall show the requirements that follow from the chosen objective: what must be measured, how much science, for how long, with what budget and by when | M | ST-OBJ | Each objective shows its requirements in numbers before the spacecraft is designed *(whether the player sets them: DA-03)* |
| REQ-MIS-004 | The game should allow more than one design to meet the same objective | S | ST-MD | For each objective, two different designs both succeed |

### 10.3 SPC, spacecraft

| ID | Requirement | Prior. | Source | Acceptance criterion |
|---|---|---|---|---|
| REQ-SPC-001 | The game shall let the player choose the size of the spacecraft | M | ST-OBJ, ST-SP | At least three sizes with different mass and volume limits |
| REQ-SPC-002 | The game shall let the player choose the spacecraft's subsystems | M | ST-OBJ, ST-SP | A complete design cannot exist without each subsystem the team lists *(which ones: DA-04)* |
| REQ-SPC-003 | The game may offer simple and advanced components according to difficulty | C | ST-SP | *(DA-07)* |

### 10.4 INS, instruments

| ID | Requirement | Prior. | Source | Acceptance criterion |
|---|---|---|---|---|
| REQ-INS-001 | The game shall let the player select one or more science instruments | M | ST-OBJ, ST-SP | An instrument can be added and removed, and the design changes |
| REQ-INS-002 | Each instrument shall have its own mass, power draw, cost, data generated and science value | M | ST-SP | The five values are shown for every instrument and enter the calculations |
| REQ-INS-003 | The game shall tell the player when no chosen instrument can serve the objective | M | ST-MD | A design with an unsuitable instrument set cannot succeed and says why |

### 10.5 LAO, launch and orbit

| ID | Requirement | Prior. | Source | Acceptance criterion |
|---|---|---|---|---|
| REQ-LAO-001 | The game shall let the player choose a launch option with its payload capacity, cost and the orbits it reaches | M | ST-OBJ, ST-OL | The three things are shown for every launch option and enter the calculations |
| REQ-LAO-002 | The game shall let the player choose among several orbits and explain what each means for observation, communications and mission lifetime | M | ST-OBJ, ST-OL | At least three orbits, each with a short explanation and a different effect on the result |
| REQ-LAO-003 | The game should check that the spacecraft's mass and the chosen orbit are compatible with the launch option | S | ST-OL | An incompatible combination cannot fly and the reason is shown |

### 10.6 RES, resources and constraints

| ID | Requirement | Prior. | Source | Acceptance criterion |
|---|---|---|---|---|
| REQ-RES-001 | The game shall show the six resources (mass, power, budget, data, communications, time), each as used against available, with units | M | ST-RM | All six are visible from every screen where a decision is made |
| REQ-RES-002 | The game shall update the resources as soon as a choice changes | M | ST-OBJ | The display changes without leaving the screen where the choice was made |
| REQ-RES-003 | The game shall apply limits to budget, mass, power, communication capacity and mission lifetime, and mark a resource that exceeds its limit | M | ST-MD | A design over any limit is marked, in a way that does not rely on colour alone, and cannot fly as a success |
| REQ-RES-004 | Every major decision shall change at least one other part of the mission | M | ST-OBJ, ST-MD | Adding an instrument raises science and also mass, power, cost and data, visibly |
| REQ-RES-005 | The game may point out which resources are critical for the chosen mission | C | ST-RM | - |

### 10.7 SIM, simulation and evaluation

| ID | Requirement | Prior. | Source | Acceptance criterion |
|---|---|---|---|---|
| REQ-SIM-001 | The game shall simulate the designed mission and show its outcome | M | ST-OBJ | From a complete design the player runs the mission and reaches a result |
| REQ-SIM-002 | The game shall evaluate the outcome against the objective and its requirements | M | ST-OBJ | The result states whether the objective was met and by how much *(what counts as success: DA-06)* |
| REQ-SIM-003 | The game should let the player change the design and simulate again, as often as they want | S | ST-GD | After a result, the player returns to any decision and runs again |
| REQ-SIM-004 | The game may include random events or unexpected constraints | C | ST-AF | *(DA-08)* |
| REQ-SIM-005 | The game may produce a mission report at the end of each simulation | C | ST-AF | - |

### 10.8 FBK, feedback, scoring and learning

| ID | Requirement | Prior. | Source | Acceptance criterion |
|---|---|---|---|---|
| REQ-FBK-001 | The game shall explain in plain language why the mission succeeded or failed, naming the decisions responsible | M | ST-GD, ST-ED | Every failed check and every result comes with a sentence a newcomer understands |
| REQ-FBK-002 | The game should score the mission so that success, science value, efficient use of resources and good decisions are rewarded | S | ST-GD, ST-OBJ | The scoring rule is written down (DA-06) and a wasteful success scores below an efficient one |
| REQ-FBK-003 | The game should introduce the concepts it uses (orbital altitude, payload capacity, power consumption, data rate, communications) in simple terms | S | ST-ED | Each concept has a short explanation reachable from the screen that uses it |
| REQ-FBK-004 | The game should let a first-time player start without outside help | S | ST-GD, ST-ED | Someone who has never seen the game completes a mission using only what the game shows |
| REQ-FBK-005 | The game should show where its numbers come from | S | JG | A value taken from NASA shows its source in the game |

### 10.9 COL, collaboration

| ID | Requirement | Prior. | Source | Acceptance criterion |
|---|---|---|---|---|
| REQ-COL-001 | The game shall be playable by one person | M | ST-OBJ, ST-GD | One player completes a mission alone |
| REQ-COL-002 | The game should let up to four people work on the same mission | S | ST-OBJ, ST-CO | *(form: DA-09)* |
| REQ-COL-003 | The game should give team members different responsibilities (planning, spacecraft, science, communications, resources) while decisions stay collective | S | ST-GD, ST-CO | Each responsibility maps to decisions in the game |
| REQ-COL-004 | The game may create situations where the team negotiates between competing priorities, with a result that depends on how well they coordinate | C | ST-CO | - |

### 10.10 SHP, ship and interface

| ID | Requirement | Prior. | Source | Acceptance criterion |
|---|---|---|---|---|
| REQ-SHP-001 | The game shall place the player inside a spaceship in 3D and let them move through it | M | TD | The player reaches every screen by moving |
| REQ-SHP-002 | Each mission decision shall be made at a screen in the ship, in the order of section 4.2 | M | TD | Each of REQ-MIS-001, REQ-MIS-003, REQ-SPC-001, REQ-INS-001, REQ-LAO-001 and REQ-LAO-002 has its screen |
| REQ-SHP-003 | The game shall be playable in a VR headset with its controllers | M | TD, ASM-01 | A full mission is completed in the headset |
| REQ-SHP-004 | The game shall be playable with keyboard and mouse, without a headset, in a web browser | M | TD, NOR-03 | A full mission is completed in the browser build |
| REQ-SHP-005 | The interface shall be clear, in English, and legible both at VR viewing distance and in a browser window | M | ST-OBJ, NOR-01 | Text is legible in both and no screen needs explaining |
| REQ-SHP-006 | The game may show a model of the spacecraft that reflects the player's design | C | ST-AF | - |

### 10.11 DAT, mission data

| ID | Requirement | Prior. | Source | Acceptance criterion |
|---|---|---|---|---|
| REQ-DAT-001 | Every number the game uses shall live in a data file under `Assets/_Project/Data/`, not in a script | M | CON-01 | Changing a value needs no code change |
| REQ-DAT-002 | Every value shall record its source and whether it was read in a NASA document, derived from one, or chosen by the team | M | CON-01, JG | No value in the data files lacks a source and a status |
| REQ-DAT-003 | At least one NASA resource shall be a core part of the game, and every resource used shall be listed in `CREDITS.md` | M | NOR-04, NOR-05 | The resources named in the "NASA Data" field are the ones the data files cite |
| REQ-DAT-004 | No value shall be presented as NASA data unless someone checked it in the source | M | JG | A sample of values labelled as NASA data is found in the cited page |
| REQ-DAT-005 | Values the research leaves undefined shall be set by a team member | M | NOR-06 | Each such value has a name next to it *(who: DA-13)* |

### 10.12 NFR, quality attributes

| ID | Requirement | Prior. | Source | Acceptance criterion |
|---|---|---|---|---|
| REQ-NFR-001 | Every machine shall use Unity 6000.6.9f1 | M | CON-01, ASM-04 | `ProjectSettings/ProjectVersion.txt` does not change in any pull request |
| REQ-NFR-002 | The game shall run on a Windows PC with the headset and as a WebGL build | M | TD, ASM-01, ASM-02 | Both are built from the same commit |
| REQ-NFR-003 | All text in the game, the code and the repository shall be in English | M | NOR-01 | No screen, file or commit message in another language |
| REQ-NFR-004 | Nothing shall show NASA logos, flags or mission identifiers, or people under 18 | M | NOR-07, NOR-08 | Inspection of every asset before the submission |
| REQ-NFR-005 | Third-party assets shall have a licence that allows their use and be listed in `CREDITS.md`; AI use shall be declared in `AI_USAGE.md` | M | NOR-05, NOR-06, NOR-09 | Every file under `Assets/ThirdParty/` has a row in `CREDITS.md` |
| REQ-NFR-006 | The game shall be comfortable in VR: a way to move that does not cause discomfort and a steady frame rate | S | TD | A first-time VR player completes a mission without stopping *(frame-rate target: DA-12)* |
| REQ-NFR-007 | The browser build shall load and start without installing anything | M | NOR-03, ASM-02 | Opening the public link in a private window reaches the first screen *(size and time target: DA-12)* |
| REQ-NFR-008 | A change shall be validated on the development PC and then tested on the headset PC before it reaches `main` | M | CON-01 | Each pull request states both results |

### 10.13 SUB, submission

| ID | Requirement | Prior. | Source | Acceptance criterion |
|---|---|---|---|---|
| REQ-SUB-001 | The project shall be submitted by Sunday 2026-11-15 at 23:59, local event time | M | ASM-07 | "Submit for Judging" pressed before the deadline |
| REQ-SUB-002 | The project page shall be complete and in English | M | NOR-01 | Every field of the form is filled |
| REQ-SUB-003 | The demo shall be a video of 30 seconds or less, or up to 7 slides | M | NOR-02 | Measured before submitting *(which one and who makes it: DA-15)* |
| REQ-SUB-004 | The demo and the final project shall open from public links | M | NOR-03 | Both open in a private browser window |
| REQ-SUB-005 | The "NASA Data" field shall describe in detail the NASA resources used | M | NOR-04 | It matches `CREDITS.md` |
| REQ-SUB-006 | Every outside resource shall be listed in the references | M | NOR-05 | It matches `CREDITS.md` |
| REQ-SUB-007 | The use of AI shall be declared in the form and inside the project | M | NOR-06 | It matches `AI_USAGE.md` |
| REQ-SUB-008 | The team shall have 1 to 6 members, all registered in the same local event | M | ASM-07 | Checked on the team page |

## 11. Verification and traceability

### 11.1 Verification

| Method | Used for |
|---|---|
| Automated test | The calculations behind RES, SIM and LAO, and the data rules of DAT |
| Demonstration on the development PC | Everything in MIS, SPC, INS, LAO, FBK and the browser part of SHP |
| Demonstration in the headset | REQ-SHP-003, REQ-NFR-006 |
| Inspection | REQ-NFR-003 to REQ-NFR-005 and all of SUB |
| Trial with a person who has not seen the game | GOAL-01, GOAL-02, REQ-FBK-004 |

A requirement is closed when its acceptance criterion is met by the method above and the pull request shows
the proof `CONTRIBUTING.md` asks for.

### 11.2 Traceability to the judging criteria

| Criterion (R-03) | What the judges look at | Requirements that carry it |
|---|---|---|
| Impact | How big the problem is and how many people it helps or inspires | REQ-FBK-003, REQ-FBK-004, REQ-COL-001 |
| Creativity | How new the approach is | REQ-SHP-001 to REQ-SHP-003 |
| Validity | Scientific basis, feasibility, how complete and usable it is | REQ-LAO-003, REQ-RES-003, REQ-RES-004, REQ-DAT-002, REQ-DAT-004 |
| Relevance | How directly it answers the challenge and whether NASA data is central | MIS, SPC, INS, LAO, REQ-RES-001, REQ-SIM-001, REQ-DAT-003, REQ-FBK-005 |
| Presentation | How clearly the demo and the project page tell the story | REQ-SUB-002, REQ-SUB-003, REQ-SHP-005 |

Every constraint of section 7 and every assumption of section 8 names the requirements it affects; every
requirement of section 10 names its source.

## 12. Open decisions

In the order they should be taken: each one unblocks the ones below it.

| ID | Decision | Who | Affects |
|---|---|---|---|
| DA-01 | The name of the game and the name of the team | Team | 2.1, REQ-SUB-002 |
| DA-02 | Which mission objectives the game offers, and how many | Team | REQ-MIS-002, and the data for everything after |
| DA-03 | For each objective, its requirements in numbers; and whether the player sets them or reviews them | Team | REQ-MIS-003 |
| DA-04 | Which subsystems the player chooses (size, power, batteries, communications, on-board computer, attitude control) and the options of each | Team | REQ-SPC-001, REQ-SPC-002 |
| DA-05 | The list of instruments, launch options and orbits, taken from the research | Team | REQ-INS-001, REQ-LAO-001, REQ-LAO-002 |
| DA-06 | What counts as success, partial success and failure, and the scoring rule | Team | REQ-SIM-002, REQ-FBK-002 |
| DA-07 | Difficulty levels: yes or no | Team | REQ-SPC-003 |
| DA-08 | Random events: yes or no, and which | Team | REQ-SIM-004 |
| DA-09 | Group play: taking turns on one machine, or several machines connected; and the roles | Team | REQ-COL-002 to REQ-COL-004, 3.5 |
| DA-10 | The look of the ship and of the screens (style guide) | Team | 3.2, REQ-SHP-005 |
| DA-11 | Who the player is (age, background) and how GOAL-01 is measured | Team | Section 5, GOAL-01 |
| DA-12 | Targets: session length, frame rate in VR, download size of the browser build | Team | GOAL-02, REQ-NFR-006, REQ-NFR-007 |
| DA-13 | Who sets the values the research leaves undefined; the target share of NASA values; whether to compute orbit data with NASA's GMAT | Team | REQ-DAT-002 to REQ-DAT-005, GOAL-03 |
| DA-14 | Where the browser build is hosted | Jose | 3.8, REQ-SUB-004 |
| DA-15 | Who takes each work package and on which computer; demo as video or slides and who makes it; who writes the project page; what to do with research notes that are in Spanish | Team | Annex A, REQ-SUB-002, REQ-SUB-003, NOR-01 |

Decided on 2026-11-14 and not open: the first version is one uncrewed CubeSat mission in low Earth orbit
(ASM-03), and it has no crew health module (9.4).

## 13. References

| ID | Reference |
|---|---|
| R-01 | NASA Space Apps Challenge 2026, "Space Mission Design Game" challenge statement, https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/ (the team's Spanish copy is kept with the research in `Resources/`) |
| R-02 | NASA Space Apps Project Submission Guide, https://www.spaceappschallenge.org/resources/project-submission-guide/, as published on 2026-11-14 |
| R-03 | NASA Space Apps Judging and Awards Guide, https://www.spaceappschallenge.org/resources/judging-awards-guide/, as published on 2026-11-14 |
| R-04 | NASA Brand Guidelines, https://www.nasa.gov/nasa-brand-center/brand-guidelines/ |
| R-05 | The team's research and its index, `Resources/README.md` |
| R-06 | `CONTRIBUTING.md` in this repository |
| R-07 | Unity Companion License, http://www.unity3d.com/legal/licenses/Unity_Companion_License |
| R-08 | ISO/IEC/IEEE 29148:2018, Systems and software engineering, Life cycle processes, Requirements engineering (structure of this document) |

## Annex A. Proposed division of the work

*(to confirm, DA-15)* Each package is worked on one teammate's computer with Claude Code and arrives in the
repository as pull requests. Packages own different folders so two computers never edit the same file, and a
scene has one owner at a time.

| Package | Scope | Folders it owns | Requirements |
|---|---|---|---|
| WP-1 Mission data | Turn the research into the game's data files, each value with its source | `Assets/_Project/Data/` | DAT; the data behind INS and LAO |
| WP-2 Mission logic | The design, the checks, the simulation and the score, with automated tests | `Assets/_Project/Scripts/Mission/`, `Assets/_Project/Tests/EditMode/` | REQ-MIS-004, REQ-INS-003, REQ-LAO-003, REQ-RES-003, REQ-RES-004, SIM, REQ-FBK-001, REQ-FBK-002 |
| WP-3 Ship and movement | The ship, the VR rig, the keyboard-and-mouse rig | `Assets/_Project/Scenes/`, `Assets/_Project/Prefabs/Ship/`, `Assets/_Project/Scripts/Ship/` | REQ-SHP-001, REQ-SHP-003, REQ-SHP-004, REQ-NFR-006 |
| WP-4 Screens | The decision screens, the resource display, the simulation result and the explanations | `Assets/_Project/Scripts/UI/`, `Assets/_Project/Prefabs/UI/` | MIS, SPC, INS and LAO on screen; REQ-RES-001, REQ-RES-002, REQ-FBK-003 to REQ-FBK-005, REQ-SHP-002, REQ-SHP-005 |
| WP-5 Builds and validation | The browser build, the checks on the development PC, the test in the headset | `Assets/_Project/Scripts/Editor/Build/` | REQ-NFR-002, REQ-NFR-007, REQ-NFR-008 |
| WP-6 Submission | Project page, demo, credits, AI declaration, English check | `CREDITS.md`, `AI_USAGE.md`, the page itself | SUB, REQ-NFR-003 to REQ-NFR-005 |

What is known about the machines today: the PC with the headset has Unity 6000.6.9f1 and Claude Code; a second
teammate PC has Claude Code and a clone of the repository but no Unity; the development PC has Unity and
validates.

## Document history

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-11-14 | First draft, as a flat list of requirements |
| 0.2 | 2026-11-14 | Rewritten on the team's QA template for an ERS (ISO/IEC/IEEE 29148:2018, clause 9.6); requirement IDs changed to `REQ-<MODULE>-NNN`; open decisions put in the order they should be taken |
