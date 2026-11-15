import { useEffect, useRef } from "react";
import type { LaunchFrame } from "../types";
/** The stage size the launch scene was drawn for (the cockpit window of origin/feat/launch-phase). */
const STAGE_W = 1280;
const STAGE_H = 720;
import { LaunchScene } from "./launchScene";

/**
 * The launch window. Like the cockpit's `SpaceCanvas`: React renders it once, then a
 * requestAnimationFrame loop draws every frame from a ref, so the animation never re-renders React.
 * Same pixel grid: drawn at half the stage size and scaled up without smoothing.
 */
const PIXEL = 0.5;

export function LaunchCanvas({ launch }: { launch: LaunchFrame }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const launchRef = useRef(launch);
  launchRef.current = launch;

  useEffect(() => {
    const cv = canvasRef.current;
    let ctx: CanvasRenderingContext2D | null = null;
    try { ctx = cv?.getContext("2d") ?? null; } catch { ctx = null; }
    if (!ctx) return; // no canvas support (tests)
    const scene = new LaunchScene();
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      scene.step(still ? Math.min(dt, 0.1) * 0.3 : dt, launchRef.current);
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      scene.draw(ctx!, launchRef.current, PIXEL);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="lx-canvas" data-testid="launch-canvas" width={STAGE_W * PIXEL} height={STAGE_H * PIXEL} aria-hidden="true" />;
}
