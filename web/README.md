# Web page

React page that draws every 2D screen of the game over the Unity WebGL canvas. It talks to Unity only through
the JSON messages in [`../docs/bridge.md`](../docs/bridge.md); `src/bridge/types.ts` is their exact form.

## Commands (run from `web/`, pnpm only)

```
pnpm install
pnpm dev         # plain browser with the stand-in and a developer bar to open each step
pnpm typecheck
pnpm test
pnpm build       # output in web/dist
```

## Layout

- `src/bridge/` : `types.ts` (contract), `bridge.ts` (`send`, `subscribe`), `standin.ts` (fixture data and a
  fake Unity that reacts to `choose`, `toggle`, `setRequirement`, `setReserve`, `completeStep`, `close`).
  For step fly it replays the recorded flight in `fixtures/flight.ts` (`flightStandin.ts`): `fly` launches,
  pauses, resumes (detail speed), goes fast or retries; at each alert the recording waits until a command is
  pressed (or 15 s pass) and then shows the answer it was recorded with.
- `src/screens/` : steps goals, concept, requirements, design, build. `index.tsx` exports `StepScreen`; each
  screen takes `state` and an optional `send` (tests pass a mock). `parts/` holds the pixel-art planets and
  CubeSat (SVG rectangles, no image files) and the pieces the five screens share; `tests/` renders each screen
  from the stand-in's fixture state.
- `src/cockpit/` : step fly (cockpit agent).
- `src/sound.ts` : 8-bit sound effects made with the Web Audio API (no audio files): a click on every button,
  and the flight events of step fly. `SOUND ON/OFF` in the cockpit mutes them; the choice is kept in localStorage.
- `src/App.tsx` : the shell. Shows nothing until `openScreen`, hides on `closeScreen`, Escape sends `close`.

To plug in a screen, render it from `App.tsx` for its step; it receives the `MissionState` and calls
`send(type, payload)`. Never compute resources or checks in the page: Unity is the source of truth.

## Page over Unity

Layers, bottom to top: the Unity canvas (`#unity-canvas`, fixed, full window), then the React root (`#root`,
fixed, full window). `#root` has `pointer-events: none`, so mouse and touch reach the canvas; only an open
screen (`.shell`) sets `pointer-events: auto` and covers the canvas with a dimmed backdrop. Keyboard: the page
listens on `window`, so Escape reaches it even while the canvas has focus (only while a screen is open).
Unity should release pointer lock and the cursor on `openScreen` and take them back on `closeScreen`.

Two ways to run it:

- **Alone** (`pnpm dev`): `index.html` has an empty canvas; `window.unityInstance` is missing, so the stand-in
  in `src/bridge/standin.ts` answers and the developer bar opens each step.
- **With Unity:** the page is served next to the WebGL build. The bridge switches to Unity as soon as
  `window.unityInstance` exists, so nothing else changes. The developer bar disappears on the next render after
  that.

### Combined build

The Unity WebGL build does it all with one command (from the repo root, see CONTRIBUTING "Builds"):

```
<Unity> -batchmode -quit -projectPath . -buildTarget WebGL -executeMethod SpaceApps.Editor.Build.WebGLBuild.Build -logFile build.log
```

It runs `pnpm install --frozen-lockfile && pnpm build` here, builds Unity with the template
`Assets/WebGLTemplates/EarthWatch/index.html`, and copies `dist/` into `Builds/WebGL/page/`. `pnpm build` writes
fixed names (`assets/page.js`, `assets/page.css`), so the template needs no hashes. The template has the canvas
`#unity-canvas`, the React root `#root` over it, loads `page/assets/page.css` and `page/assets/page.js`, and sets
`window.unityInstance` when Unity has loaded. Serve `Builds/WebGL/` over HTTP.

Load order: the page usually loads first and sends `ready` to the stand-in. When Unity finishes loading, the template
sets `window.unityInstance` and fires a `unityready` event on `window`; the page then sends `ready` again (now to
Unity, which answers with the real `state`) and redraws, so the developer bar goes away. If Unity were ever first,
the first `ready` already goes to Unity. Unity-to-page calls use the `.jslib` plugin
(`Assets/_Project/Plugins/WebGL/MissionBridge.jslib`), which calls `window.MissionUI.receive(json)`. On the Unity
side `ShipBridgeLink` joins the ship to the bridge (cover click opens the screen, `close` releases the view). In a
WebGL player the page owns Escape (the ship's own Escape handling is off there).

The WebGL canvas must keep its own id `unity-canvas`; Unity project files are owned by another agent and are not
touched by this folder.
