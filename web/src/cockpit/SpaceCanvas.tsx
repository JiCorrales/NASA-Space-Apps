import { useEffect, useRef } from "react";
import { CockpitScene, STAGE_H, STAGE_W, type SceneInput } from "./scene/drawScene";

/**
 * The window onto space. React renders this once; a requestAnimationFrame loop then draws every frame
 * from refs, so the 60 fps animation never re-renders React. New SimFrames only update the input ref.
 */
// 8-bit look: the scene is drawn at half the stage size and the browser scales it up without smoothing
// (`image-rendering: pixelated` on .ck-space), so every drawn pixel shows as a 2 x 2 block.
const PIXEL = 0.5;

export function SpaceCanvas({ input }: { input: SceneInput }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef(input);
  inputRef.current = input;

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
      scene.draw(ctx!, inputRef.current, PIXEL);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="ck-space" width={STAGE_W * PIXEL} height={STAGE_H * PIXEL} aria-hidden="true" />;
}
