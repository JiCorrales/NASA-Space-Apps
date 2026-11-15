# Game plan: Earth Watch

> Draft 0.3, 2026-11-14, 21:45. It replaces draft 0.1 with the decisions Jose took on the evening of
> 2026-11-14. **Nothing in this plan gets coded until the team agrees to it.** What is still open is in
> [section 11](#11-still-open).

## 1. The game in one paragraph

The player is inside a spaceship, in a round control room, and plays with keyboard and mouse in a web browser.
Six screens on the wall are the six steps of designing a space mission. Clicking a screen locks the view and
opens a full-size 2D interface, in a retro pixel style, where the player makes that step's decisions. At the
last screen the mission flies for a year and the player watches the CubeSat work, handles problems, and gets a
report that explains why it succeeded or failed. Then they change the design and try again.

## 2. Decisions taken

| Topic | Decision |
|---|---|
| Platform | Keyboard and mouse in the browser. VR is dropped: its rig stays in the project, unsupported and untested |
| Mission | **Earth Watch (EW-1):** a 3U CubeSat photographs the same region of Earth once a week for 52 weeks. An image counts only when it reaches the scientists |
| Other missions and planets | Shown but locked. Only Earth, and only Earth Watch, can be chosen. Each locked planet's card shows what would change there, from NASA data the team collected: less sunlight for the panels, a weaker radio signal, and the travel time. Opening them for play is the first addition if time allows |
| Regions | Three presets, a choice of story only: Costa Rica's forests, the Amazon, Arctic sea ice. The numbers do not change with the region |
| Sky | The Unity Asset Store sky stays. It ships inside the build and is kept out of the public repository |
| Ship | A round control room: six screens on the wall in front, the CubeSat on a stand in the centre, large windows behind |
| Outside the windows | The Earth, the red nebula sky from the SpaceSkies pack, and other planets passing by as scenery |
| Screens in the ship | "Covers": each shows only its step number, its name and its state (to do, now, done, problem), in large type |
| Using a screen | Click it: the view locks and the 2D interface opens over the ship, which stays visible but dimmed. Escape returns |
| Order | Forced the first time through (only the next step opens). A finished step can be reopened freely |
| 2D interfaces | Retro pixel style ("Retro 4" in the design artifact): pixel-art planets and satellite, the ship's dark background and cyan accents, one pixel font for titles and one monospace font for numbers |
| How the 2D is built | React with TypeScript (Vite, pnpm), drawn by the browser on top of the Unity canvas. It exists only in the browser build |
| Game logic | Stays in Unity (C#) for now and answers the 2D interface through a bridge. Moving it to TypeScript is a later option |
| Steps | NASA's six (Design and Develop Science Missions webinar, slide 10): need and goals, concept, requirements, design, build and verify, implement |
| Requirements | The player can adjust them |
| Resources | Shown only on the screens where they change |
| Wrong choices | Nothing is blocked. The player chooses, watches it fail, and learns from it |
| Hints | None |
| Sources | A small tag next to each value that expands on click, saying whether it is NASA's, derived, or the team's |
| Attempts | Every attempt is saved: what was chosen, what failed and when, and the result |
| Final screen | The cockpit simulation of the team's reference animation and its brief: a window onto Earth with the CubeSat, six status screens, commands, three kinds of problem, and a report |

## 3. The six steps and their 2D screens

Layouts A, B and C are the three in the first row of the design artifact, redrawn in the retro style. Jose's
answer on which to use was "everyone", read here as: all three, each where it fits *(to confirm)*.

| Step | What the player does | Layout |
|---|---|---|
| 1. Need and goals | Picks a world from a row of pixel planets (only Earth is open), then a mission (only Earth Watch is open), reads who needs the data and why, and picks the region to watch | Mission select, already drawn as "Retro 4" |
| 2. Concept | Decides how the mission will operate: the orbit, and how often the satellite must see the region | C, guided: one decision at a time |
| 3. Requirements | Sees the numbers the mission must meet, each with how it will be checked, and may tighten or relax them | A, console: a list |
| 4. Design | Builds the mission in four groups: spacecraft, instrument, communications, launch. The six resources are shown here | B, blueprint: the pixel CubeSat in the centre, changing with each choice |
| 5. Build and verify | Chooses the tests (vibration, thermal vacuum, "day in the life") and how much budget to keep in reserve; sees which requirements are verified | A, console |
| 6. Implement | Launches and runs the year (section 4) | The cockpit |

Design choices the simulation needs and the game's data does not have yet: the attitude control system, the
image storage capacity, and a backup ground station.

## 4. The final screen: flying the mission

As specified in the team's brief ("Simulación de la misión") and shown in its reference animation
`admin-cockpit.html`. In short:

- **The view:** from the ship's cockpit, the curve of the Earth below, the CubeSat ahead, the target region and
  the ground station passing underneath.
- **Each week:** the satellite passes over the region and takes one image; it passes over the ground station
  and sends it down; its state updates. Two speeds: detail and fast forward.
- **Six status screens:** power, attitude, data link, thermal, imaging (a grid of 52 weeks), mission.
- **Problems the player answers with commands,** each answer with a cost, including doing nothing: a solar
  storm, a ground station failure, an attitude fault.
- **The values come from the player's design,** not from fixed numbers.
- **The report:** the success rate and its four factors, the two or three design decisions that weighed most,
  one concrete suggestion for the next attempt, the strip of 52 images with its gaps, and "retry" or "change
  design".

Every number in that brief marked illustrative stays labelled "Illustrative values" on screen.

## 5. The ship

- **Shape:** round. The player starts near the back, facing the six covers; the windows are behind. Everything
  is a few steps away.
- **Covers:** green when done, cyan for the one to do now, grey when still locked, red when its step has a
  problem.
- **Centre:** the CubeSat model, changing as it is designed.
- **Windows:** half the wall. The real Earth, the red sky, and planets as scenery.
- **Look:** the realism lives outside the windows; the screens are deliberately pixel art. Lighting needs fixing:
  the browser quality level currently has extra lights and post-processing off, which is why the ship looks flat.
- **The Modular Sci-Fi Corridor pack was tested and is too heavy for the browser** (297 MB of textures, about
  100,000 triangles per 3 m section). At most a few reduced pieces could be used.

## 6. How the two halves talk

| Side | Owns |
|---|---|
| Unity | The ship, movement, the covers, the view lock, the mission data, the checks, the simulation |
| React page over the canvas | Every 2D screen and the cockpit simulation's display |

Unity tells the page which screen to open and what the current design and results are. The page tells Unity
what the player chose and which command they pressed. The messages are agreed in writing before either side is
built. Because the 2D screens exist only in the browser build, they are developed and tested in a browser, with
a stand-in for Unity's answers so the page can be worked on without Unity.

## 7. What exists and what changes

| Piece | Today on `develop` | In this plan |
|---|---|---|
| Mission data, checks, simulator | Built, with tests | Kept. Adjusted to Earth Watch: weekly images, storage, attitude, the three problems and commands |
| Eight station screens in Unity's UI | Built | Replaced by six covers and the React screens |
| Corridor | Built by the ship builder | Replaced by the round room |
| Satellite model, orbit globe, Earth, sky | Built or in an open pull request | Kept and placed in the room |
| Keyboard-and-mouse movement | Built | Kept, with the view lock added |
| Browser build | The command exists; the ship has not been built for the browser yet | The product |
| Simulator review findings | Open (`wip/sim-review-fixes`) | Superseded where the new weekly simulation replaces the old one; the lesson stands: a careful design must win more often |

## 8. Work packages

Only two computers have Unity (the development PC and Alexander's). The React work needs no Unity, so the
other two teammate PCs can take it.

| Package | Scope | Needs Unity |
|---|---|---|
| A. Bridge | The messages between Unity and the page, written down, with a stand-in on each side | No |
| B. React shell | The page over the canvas, the retro style (fonts, colours, pixel components), open and close | No |
| C. Screens 1 to 5 | Mission select, concept, requirements, design, build and verify | No |
| D. Cockpit | The reference animation turned into the real simulation display | No |
| E. Round room | The room, the covers, the view lock, lighting, windows, planets | Yes |
| F. Logic for Earth Watch | Data and rules for the weekly simulation, the problems and commands, the report, saved attempts | Yes |
| G. Build and link | The browser build with the page on top, and its public address | Yes |
| H. Submission | Project page, 30-second video or 7 slides, credits, AI declaration, English | No |

A comes first: B, C, D, E and F all depend on it.

## 9. Order of work

| Block | Work | Done when |
|---|---|---|
| 1 | A, then B and E in parallel | A cover clicked in the room opens an empty retro screen in the browser, and Escape returns |
| 2 | C and F | Steps 1 to 5 can be played in the browser with real data |
| 3 | D and the rest of F | A mission can be flown to its report |
| 4, until Sunday 14:00 | G, lighting, planets | The public link plays the whole game |
| Sunday 14:00 | **Feature freeze** | |
| Sunday 14:00 to 19:00 | H; fixes only | Every link opens in a private window |
| Sunday 19:00 to 21:00 | Submit | "Submit for Judging" pressed |

This is more than a day of work for the time left. If it does not fit, the order of cuts is: planets as
scenery, saved attempts, adjustable requirements, then steps 2 and 3 merged into one screen. The mission
select, the design step and the cockpit are the last things to cut.

## 10. How we will know it works

- The whole game played by hand in the browser build, from mission select to the report.
- Text on every 2D screen sharp at 1366 x 768 and at 1920 x 1080.
- Automated tests for the logic: a balanced design finishes the year; each of the three problems has a cost for
  every answer, including none; the report names the decisions that mattered.
- One person who has never seen the game plays it without help, timed.

## 11. Still open

1. The layouts per step, as read in section 3.
2. The values NASA does not give (below), and every value the brief marks as to be defined.
3. Who takes each work package. Proposed: Andres's and Padilla's computers take the React screens (packages
   A to D), which need no Unity; Alexander's and the development PC take the round room and the logic (E to G).
4. Where the browser build is hosted.
5. Who records the 30-second demo, and what to do with the research notes that are in Spanish.

### Mission numbers and where they come from

Jose's rule: use NASA data. This is what the sources in the repository give for Earth Watch.

| Number | Source | Value |
|---|---|---|
| Deadline to reach orbit | NASA, CubeSat 101: 9 months at the fastest, 18 to 24 typical | 24 months |
| Budget reserve | NASA, CubeSat 101: at least 10% | 10% |
| Launch cost covered | NASA, CubeSat 101: up to 300,000 USD on launches NASA provides | 300,000 USD |
| Size and mass limit | 3U, 10 x 10 x 34 cm (NASA, CubeSat 101); up to 6 kg (CubeSat Design Specification rev 14.1) | 3U, 6 kg |
| Orbit, eclipse, ground contact | Derived, `Tools/orbits/` | As computed |
| Total budget | None: NASA publishes no budget for a CubeSat of this kind | The team's *(to define)* |
| Minimum images for success | None: a rule of the game | The team's; proposed 40 of 52 |

## 12. Risks

- **Time.** About 26 hours remain and this plan rebuilds the interface. Section 9 says what to cut first.
- **Two codebases and a bridge** that nobody on the team has built before.
- **The 2D screens cannot be seen in the Unity editor,** only in a browser.
- **Download size** of the browser build, with the ship, the planets and the page.
