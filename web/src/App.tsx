import { useEffect, useState } from "react";
import { isStandin, send, standinEmit, subscribe } from "./bridge/bridge";
import type { MissionState, Step } from "./bridge/types";
import { StepScreen } from "./screens";
import { Cockpit } from "./cockpit/Cockpit";
import { EngineGate } from "./EngineGate";

const STEPS: Step[] = ["goals", "concept", "requirements", "design", "build", "fly"];

export function App() {
  const [step, setStep] = useState<Step | null>(null);
  const [state, setState] = useState<MissionState | null>(null);
  const [, setUnityReady] = useState(false);

  useEffect(() => {
    const off = subscribe((m) => {
      if (m.type === "openScreen") setStep(m.payload.step);
      else if (m.type === "closeScreen") setStep(null);
      else if (m.type === "state") setState(m.payload);
    });
    send("ready", {});
    return off;
  }, []);

  // The Unity template sets window.unityInstance after the page has loaded and sent its first `ready` to the
  // stand-in. It then fires "unityready": ask Unity for the real state and redraw (the developer bar goes away).
  useEffect(() => {
    const onUnity = () => { setStep(null); setUnityReady(true); send("ready", {}); };
    window.addEventListener("unityready", onUnity);
    return () => window.removeEventListener("unityready", onUnity);
  }, []);

  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && send("close", {});
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  return (
    <>
      {step && state && (
        <div className="shell" role="dialog" aria-modal="true" aria-label={`Step: ${step}`}>
          {step === "fly" ? <Cockpit state={state} /> : <StepScreen step={step} state={state} />}
        </div>
      )}
      <EngineGate />
      {isStandin() && (
        <div className="devbar" aria-label="Developer bar">
          {STEPS.map((s) => (
            <button key={s} onClick={() => standinEmit({ type: "openScreen", payload: { step: s } })}>{s}</button>
          ))}
        </div>
      )}
    </>
  );
}
