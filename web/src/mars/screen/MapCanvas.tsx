import { useEffect, useRef } from "react";
import { MapScene, type SceneInput } from "./MapScene";

/**
 * The map of one panel. React renders this once per phase or view change; a requestAnimationFrame loop then draws
 * every frame from refs, so the animation never re-renders React. Whole pixels, an integer scale, no smoothing.
 */
export function MapCanvas({ input, label }: { input: SceneInput; label: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const scene = useRef<MapScene>(null as unknown as MapScene);
  scene.current ??= new MapScene();
  const inputRef = useRef(input);
  inputRef.current = input;

  // callbacks may change every render; the scene always calls the latest
  useEffect(() => {
    scene.current.setInput({ ...input, onBeat: (e) => inputRef.current.onBeat?.(e), onDone: () => inputRef.current.onDone?.() });
  });

  useEffect(() => {
    const canvas = cv.current, box = wrap.current;
    let ctx: CanvasRenderingContext2D | null = null;
    try { ctx = canvas?.getContext("2d") ?? null; } catch { ctx = null; }
    if (!canvas || !box || !ctx) return; // no canvas support (tests)
    let w = 0, h = 0, s = 2;
    const fit = () => {
      const bw = Math.max(64, Math.floor(box.clientWidth)), bh = Math.max(64, Math.floor(box.clientHeight));
      s = bw >= 560 && bh >= 420 ? 3 : 2;
      w = Math.floor(bw / s); h = Math.floor(bh / s);
      canvas.width = w; canvas.height = h;
      canvas.style.width = `${w * s}px`; canvas.style.height = `${h * s}px`;
    };
    fit();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(box);
    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      scene.current.step(dt);
      scene.current.draw(ctx!, w, h);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); };
  }, []);

  return (
    <div ref={wrap} className="mp__canvas">
      <canvas ref={cv} role="img" aria-label={label} />
    </div>
  );
}
