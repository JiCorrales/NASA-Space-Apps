# Game plan: one mission console, one fixed mission

> Draft 0.1, 2026-11-14, 20:00. For the team to correct. **Nothing in this plan gets coded until the team
> agrees to it.** Items the team has not decided are marked *(to decide)* and collected in
> [section 12](#12-decisions-needed-before-any-code).

## 1. What changes

| | Today on `develop` | This plan |
|---|---|---|
| Where the decisions are made | Eight screens along a 24 m corridor | **One mission console.** Everything about the mission is on that one screen |
| Using a screen | Stand in front of it and click | **Interact with the console and the view locks onto it** (section 4) until the player leaves it |
| Which mission | Four objectives, free choice | **One fixed mission** with a known path to success, the "happy path" (section 5) |
| Order of the decisions | The challenge statement's list | NASA's six steps, including the one the game lacks today, "Define Concept" |

What stays: the mission data with its sources, the six resources, the checks that explain why something fails,
the month-by-month simulation, VR and keyboard-and-mouse in the same scene, the browser build.

## 2. The experience from start to finish

Target length: 3 to 5 minutes for a first-time player *(to decide)*.

1. The player appears inside the ship, in a control room. Ahead is the mission console. Through a window:
   the Earth and the stars. On a stand: the satellite, still empty.
2. One line on screen says what to do and how to move (it changes with VR or keyboard and mouse).
3. The player walks to the console and interacts with it. The view locks onto the console.
4. The console shows the mission and six steps. The player goes through them in order. Every choice moves the
   six resources on the same screen, and the satellite on the stand changes with the design.
5. At the last step the player launches. The mission plays out month by month, then the result: did it meet
   its goal, how much science came home, and why.
6. The player leaves the console (the view unlocks), or changes the design and flies again.

## 3. The console: one screen for the whole mission

Regions of the screen:

- **Top:** the mission's name and the six steps as tabs, with a mark on the ones already done.
- **Centre:** the choices of the current step, each with its numbers and where they come from.
- **Side:** the six resources (mass, power, budget, data, communications, time), used against available, always
  visible, and under them the problems found, each with its reason.
- **Bottom:** back, next, and "leave console".

The six steps are NASA's own (Design and Develop Science Missions webinar, slide 10):

| Step | What the player does | Choices (from the data files) |
|---|---|---|
| 1. Need and goals | Reads the mission: who needs the data, the goals, what counts as success | None: the mission is fixed |
| 2. Concept | Decides how the mission will operate | Orbit and mission length *(to decide: what else belongs here)* |
| 3. Requirements | Sees the numbers that follow from the goals and the concept, each with how it will be checked | None in the happy path *(to decide: whether the player may tighten or relax them)* |
| 4. Design | Builds the mission, in four groups | Spacecraft (size, power); instruments; communications (radio, ground station); launch |
| 5. Build and verify | Chooses the tests and keeps a reserve; each requirement of step 3 gets marked as verified or not | Verification tests |
| 6. Implement | Launches and watches the mission month by month; reads the result | Launch, fly again, change the design |

Each choice also carries one of NASA's four mission segments as a label: launch, space, ground or user. That
gives the user segment (who uses the data) a place, at step 1.

## 4. Locking the view

- **Keyboard and mouse:** on interacting, the camera moves to a fixed position facing the console, the
  movement keys stop moving the player, and the cursor is free to click. Escape or "leave console" gives
  control back. This also suits the browser, where capturing the mouse is awkward.
- **VR:** a headset's view must keep following the head, or the player feels sick. The equivalent is:
  walking and turning are switched off, the player is placed on a marked spot at reading distance from the
  console, and they point and select with the controller. "Leave console" switches walking back on.
- **In both:** the console is the only thing that responds while the view is locked.

## 5. The fixed mission and its happy path

**Proposed mission** *(to decide)*: the cloud ice survey, a 3U CubeSat in low Earth orbit carrying a radiometer.
It is the objective whose instrument has the most figures read from a NASA document (mass, power, data per
day), and a real NASA CubeSat flew this kind of mission, which helps the Validity and Relevance criteria.
The alternative is Earth imaging: easier to explain to anyone, but its camera values are the team's own.

In the data today, the cloud ice mission has: budget 900,000 USD, 30 months to reach orbit, 12 months of
operation, 45 science points needed, and two allowed orbits. Those four numbers are the team's to confirm.

**The happy path** is one set of choices, one per step, that:

- passes every check with margin on all six resources and keeps the 10% budget reserve NASA advises;
- succeeds when flown. In the guided mission the simulation uses a fixed seed chosen so that it does; "fly
  again" uses a new seed, so the player sees that preparation and luck both count;
- can be completed by a first-time player by following the recommended option at each step.

The exact choices are not written here on purpose: they are fixed only after the set is run through the
evaluator and the simulator, and after the simulator's balance fixes are in (section 6).

**One planted mistake** *(to decide)*: at one step the obvious choice is wrong, the console says why, and the
player fixes it. A candidate that already exists in the game: a radio whose band the chosen ground station
cannot receive. It shows the trade-off the challenge asks for in a few seconds, which also suits the demo.

**After the happy path** *(to decide)*: the other choices unlock, so different designs can be tried for the
same mission. The other three objectives stay in the data but are not offered for the hackathon.

## 6. The game logic behind the console

Exists and is reused: the data catalog (every value with its source and whether it is NASA's, derived or the
team's), the evaluator of the six resources, the simulator with its event deck, the score, difficulty levels
and crew roles.

Changes this plan needs:

1. The orbit and the mission length move to step 2, before the requirements.
2. Each requirement gains a "how it is checked", and step 5 marks it verified or not.
3. A guided mode: the recommended option per step, the planted mistake, and the fixed seed.
4. The simulator's open review findings are fixed first (a careful design must win more often than a careless
   one; the lessons must not blame precautions the player took). Work in progress: `wip/sim-review-fixes`.

Not needed for the hackathon: more objectives, difficulty levels, crew roles on screen *(to decide)*.

## 7. The ship around the console

- **Layout** *(to decide)*: one control room, or the control room at the end of the existing corridor.
- **What the player looks at besides the console:** the window with the Earth and the stars; the satellite
  model that changes with the design; a small globe with the chosen orbit.
- **Sound:** a quiet ship hum, clicks on the console, a rumble at launch. In the browser, sound starts only
  after the first click.
- **Assets:** NASA and CC0 assets live in the repository. The four Unity Asset Store packages already
  downloaded (skies, corridor, props, sounds) may be used inside the builds but stay out of the public
  repository, so the game must still open and build without them.

## 8. What exists and what this plan needs

| Piece | State today | Needed |
|---|---|---|
| Mission data, evaluator, simulator | On `develop`, with tests | The four changes of section 6 |
| Station screens (eight) | On `develop`, with tests | Replaced by one console with six steps; the screen components are reused |
| Resource dashboard | On `develop` | Moves into the console |
| Keyboard-and-mouse rig, VR rig | On `develop`; VR never tried in the headset | View lock for both; first headset test |
| Corridor | On `develop`, generated by the ship builder | Control room *(layout to decide)* |
| Satellite model, orbit display, Earth window | Merged or being merged | Placed in the control room |
| Windows VR build, browser build | Build commands exist; browser build of the ship not yet made | Rebuilt at the end; public link |
| Requirements specification | Draft | Updated to match this plan once agreed |

## 9. Work packages

Only two computers have Unity: the development PC and the PC with the headset. Everything that must compile
or run goes to those two. The other two teammate PCs take work that needs no Unity.

| Package | Scope | Needs Unity |
|---|---|---|
| A. Console and view lock | The one-screen console with six steps; locking and unlocking the view in both modes | Yes |
| B. Logic changes | Section 6, items 1 to 3, with tests | Yes |
| C. Simulator fixes | Section 6, item 4 | Yes |
| D. Fixed mission | The mission's numbers confirmed by the team; the happy path found and proven with the evaluator and simulator | Partly |
| E. Control room | Layout, window, satellite stand, orbit globe, sound | Yes |
| F. Builds and link | Windows VR build, browser build, public address | Yes |
| G. Headset test | A person plays the happy path in the headset and reports | The headset |
| H. Submission | Project page, 30-second video or 7 slides, credits, AI declaration, English | No |

A and B meet at one boundary (what the console asks the logic and what it answers); it is agreed in writing
before either starts. E waits for A's layout. D waits for C.

## 10. Order of work

| Block | Work | Done when |
|---|---|---|
| Saturday night | The decisions of section 12; pending pull requests merged | The plan is agreed |
| 1 | A with the existing logic; C in parallel | The mission can be played end to end on the console with the mouse |
| 2 | B and D; first headset test (G) | The happy path succeeds every time; a person finishes it in the headset |
| 3, until Sunday 14:00 | E, then F | The browser link opens the game; the VR build runs |
| Sunday 14:00 | **Feature freeze** | |
| Sunday 14:00 to 19:00 | H; fixes only | Every link opens in a private window |
| Sunday 19:00 to 21:00 | Submit, with the evening as buffer | "Submit for Judging" pressed |

## 11. How we will know it works

- Automated tests for the logic and for the console (the happy path passes every check; the planted mistake
  shows its message; the view locks and unlocks in both modes; the fixed seed gives a success).
- The happy path played by hand with the mouse on the development PC, then in the headset.
- The browser build opened from its public address in a private window.
- One person who has never seen the game plays it without help, and we time them.

## 12. Decisions needed before any code

1. **The mission:** cloud ice survey, Earth imaging, or another; and its four numbers.
2. **The room:** one control room, or the console at the end of the existing corridor.
3. **Step 2, Concept:** what the player decides there besides orbit and mission length.
4. **Requirements:** shown only, or adjustable by the player.
5. **The planted mistake:** yes or no, and which.
6. **After the happy path:** unlock the other choices, or end there.
7. **Group play for up to four:** in the hackathon version or not.
8. **Asset Store packages:** use them in the builds, or stay with NASA and CC0 assets only.
9. **Session length** and who records the 30-second demo.

## 13. Risks

- **VR has never been tried in the headset.** The first test may change sections 4 and 7.
- **Time:** about 28 hours remain. Section 10 puts the console and the happy path first so that there is
  always something playable to submit.
- **One screen holds a lot.** If the console is hard to read in the headset, the fallback is one step per page
  with larger text, not more screens.
- **The simulator's balance** must be fixed before the happy path is chosen, or the fixed seed hides a real
  problem.
