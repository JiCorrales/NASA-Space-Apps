import { useEffect, useState } from "react";

declare global {
  interface Window {
    /** Set by the Unity WebGL template before the page script: this page is running over a Unity build. */
    __unityBuild?: boolean;
    /** Kept up to date by the template; it also fires a "unitystatus" event on every change. */
    __unityStatus?: { phase: "loading" | "starting" | "failed" | "ready"; progress: number };
  }
}

/** How long Unity may take to start once its files are downloaded, before the page gives up. */
export const START_TIMEOUT_MS = 90_000;

/** True inside a Unity build. There the page never uses the stand-in or shows the developer bar. */
export const inUnityBuild = () => window.__unityBuild === true;

export type EngineStatus =
  | { phase: "standin" } // plain `pnpm dev`: no Unity, the stand-in answers
  | { phase: "loading"; progress: number } // downloading, progress 0 to 1
  | { phase: "starting" } // downloaded, Unity is starting
  | { phase: "failed" }
  | { phase: "ready" };

function read(): EngineStatus {
  if (!inUnityBuild()) return { phase: "standin" };
  if (window.unityInstance) return { phase: "ready" };
  const s = window.__unityStatus;
  if (!s || s.phase === "loading") return { phase: "loading", progress: s?.progress ?? 0 };
  return s.phase === "starting" ? { phase: "starting" } : s.phase === "failed" ? { phase: "failed" } : { phase: "ready" };
}

/** Where the Unity engine is: loading, starting, failed (it rejected, or did not start in time) or ready. */
export function useEngine(timeoutMs = START_TIMEOUT_MS): EngineStatus {
  const [status, setStatus] = useState<EngineStatus>(read);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const update = () => setStatus(read());
    update();
    window.addEventListener("unitystatus", update);
    window.addEventListener("unityready", update);
    return () => {
      window.removeEventListener("unitystatus", update);
      window.removeEventListener("unityready", update);
    };
  }, []);

  // The 90 seconds start when the downloads end: the downloads themselves may take as long as the connection needs.
  const starting = status.phase === "starting";
  useEffect(() => {
    if (!starting) return;
    const id = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(id);
  }, [starting, timeoutMs]);

  return timedOut && status.phase !== "ready" ? { phase: "failed" } : status;
}
