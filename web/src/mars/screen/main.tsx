import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MarsPage } from "./MarsPage";
import { marsFactory } from "./marsFactory";
import { fixtureFactory } from "./tests/fixtureEngine";

// The page runs the rules (MarsWorld). Query, for screenshots and tests: ?seed=N&design=good|middling|poor&paused=1;
// `?engine=fixture` runs the small hand-written stand-in of the tests instead.
const q = new URLSearchParams(window.location.search);
const seed = q.get("seed");
const design = q.get("design") as "good" | "middling" | "poor" | null;
createRoot(document.getElementById("root")!).render(
  <StrictMode><MarsPage factory={q.get("engine") === "fixture" ? fixtureFactory : marsFactory} seed={seed ? Number(seed) : undefined} design={design ?? undefined} autoplay={q.get("paused") !== "1"} /></StrictMode>,
);
