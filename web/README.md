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
- `src/screens/` : steps goals, concept, requirements, design, build. `index.tsx` exports `StepScreen`; each
  screen takes `state` and an optional `send` (tests pass a mock). `parts/` holds the pixel-art planets and
  CubeSat (SVG rectangles, no image files) and the pieces the five screens share; `tests/` renders each screen
  from the stand-in's fixture state.
- `src/cockpit/` : step fly (cockpit agent).
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

### Combining the build with Unity's WebGL output (for the build task, not done here)

`pnpm build` writes `web/dist/` with fixed names (`assets/page.js`, `assets/page.css`), so no hashes to track.
The right way is a Unity WebGL template, `Assets/WebGLTemplates/EarthWatch/index.html`, selected in Player
Settings. Unity fills the `{{{ ... }}}` macros when it builds. Sketch:

```html
<link rel="stylesheet" href="page/assets/page.css" />
<canvas id="unity-canvas"></canvas>
<div id="root"></div>
<script src="Build/{{{ LOADER_FILENAME }}}"></script>
<script>
  createUnityInstance(document.querySelector("#unity-canvas"), {
    dataUrl: "Build/{{{ DATA_FILENAME }}}", frameworkUrl: "Build/{{{ FRAMEWORK_FILENAME }}}",
    codeUrl: "Build/{{{ CODE_FILENAME }}}",
  }).then((instance) => { window.unityInstance = instance; });
</script>
<script type="module" src="page/assets/page.js"></script>
```

Then copy `web/dist/` into the build output as `page/` (script step after the Unity build), and serve the folder
over HTTP. The page sends `ready` on load; if Unity finishes loading later, Unity should call
`window.MissionUI.receive` with the first `state` itself, or the page should resend `ready` once
`window.unityInstance` is set (small follow-up for the build task). Unity-to-page calls need a `.jslib` plugin
that calls `window.MissionUI.receive(json)`.

The WebGL canvas must keep its own id `unity-canvas`; Unity project files are owned by another agent and are not
touched by this folder.
