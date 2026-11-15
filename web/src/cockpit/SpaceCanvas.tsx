import { useEffect, useRef } from "react";
import { CockpitScene, STAGE_H, STAGE_W, type SceneInput } from "./scene/drawScene";

/**
 * The window onto space. React renders this once; a requestAnimationFrame loop then draws every frame
 * from refs, so the 60 fps animation never re-renders React. New SimFrames only update the input ref.
 */
export function SpaceCanvas({ input, scale }: { input: SceneInput; scale: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef(input);
  const kRef = useRef(1);
  inputRef.current = input;

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const k = Math.min(2, Math.max(1, (window.devicePixelRatio || 1) * scale));
    kRef.current = k;
    cv.width = Math.round(STAGE_W * k);
    cv.height = Math.round(STAGE_H * k);
  }, [scale]);

  useEffect(() => {
    const cv = canvasRef.current;
    let ctx: CanvasRenderingContext2D | null = null;
    try { ctx = cv?.getContext("2d") ?? null; } catch { ctx = null; }
    if (!ctx) return; // no canvas support (tests)
    const scene = new CockpitScene();
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      scene.step(still ? Math.min(dt, 0.1) * 0.15 : dt, inputRef.current);
      scene.draw(ctx!, inputRef.current, kRef.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="ck-space" width={STAGE_W} height={STAGE_H} aria-hidden="true" />;
}
