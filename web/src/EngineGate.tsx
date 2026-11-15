import { useEffect } from "react";
import { engineDetails, useEngine } from "./bridge/engine";
import { PixelButton } from "./ui";

/** Covers the canvas while the Unity engine downloads and starts, and says so plainly when it cannot start. */
export function EngineGate() {
  const engine = useEngine();
  const covering = engine.phase === "loading" || engine.phase === "starting" || engine.phase === "failed";
  // The template's own text ("Loading 100%") would show through or stay forever: this takes over.
  useEffect(() => {
    const t = document.getElementById("loading");
    if (t) t.style.display = covering ? "none" : "";
  }, [covering]);
  if (!covering) return null;

  return (
    <div className="engine" role={engine.phase === "failed" ? "alert" : "status"} data-phase={engine.phase}>
      {engine.phase === "failed" ? (
        <div className="engine__box">
          <h1 className="engine__title">The game could not start</h1>
          <p>
            The game could not start on this device and browser. It needs a desktop browser with WebGL 2
            (Chrome, Edge or Firefox on a computer) and a keyboard and mouse.
          </p>
          <ul className="engine__details" aria-label="Details">
            {engineDetails().map((line) => <li key={line}>{line}</li>)}
          </ul>
          <PixelButton primary onClick={() => window.location.reload()}>Try again</PixelButton>
        </div>
      ) : (
        <div className="engine__box">
          <h1 className="engine__title">
            {engine.phase === "starting" ? "Starting the game engine..." : "Loading the game..."}
          </h1>
          {engine.phase === "loading" && <p className="num">{Math.round(engine.progress * 100)}%</p>}
          {engine.phase === "starting" && <p>This can take a little while on the first visit.</p>}
          {engine.phase === "starting" && (window.__unityErrors?.length ?? 0) > 0 && (
            <ul className="engine__details" aria-label="Details">
              {engineDetails().map((line) => <li key={line}>{line}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
