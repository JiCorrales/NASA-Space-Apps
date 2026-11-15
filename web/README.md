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
- `src/screens/` : steps goals, concept, requirements, design, build (screens agent).
- `src/cockpit/` : step fly (cockpit agent).
- `src/App.tsx` : the shell. Shows nothing until `openScreen`, hides on `closeScreen`, Escape sends `close`.

To plug in a screen, render it from `App.tsx` for its step; it receives the `MissionState` and calls
`send(type, payload)`. Never compute resources or checks in the page: Unity is the source of truth.
