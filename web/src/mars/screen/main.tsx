import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MarsPage } from "./MarsPage";
import { fixtureFactory } from "./tests/fixtureEngine";

// Until MarsWorld (package A) lands this page runs the fixture engine; replace `fixtureFactory` by the
// factory built on MarsWorld. Query: ?seed=N&design=good|middling|poor&paused=1 (for screenshots).
const q = new URLSearchParams(window.location.search);
const seed = q.get("seed");
const design = q.get("design") as "good" | "middling" | "poor" | null;
createRoot(document.getElementById("root")!).render(
  <StrictMode><MarsPage factory={fixtureFactory} seed={seed ? Number(seed) : undefined} design={design ?? undefined} autoplay={q.get("paused") !== "1"} /></StrictMode>,
);
