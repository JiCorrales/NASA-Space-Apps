import type { Resource } from "../bridge/types";

type Level = "unknown" | "ok" | "near" | "over";

// Display only: the thresholds below pick a label; Unity decides what is actually a problem (issues).
function level(r: Resource): Level {
  if (!r.known) return "unknown";
  if (r.used > r.available) return "over";
  return r.used >= r.available * 0.9 ? "near" : "ok";
}
const WORD: Record<Level, string> = { unknown: "NOT SET YET", ok: "OK", near: "NEAR LIMIT", over: "OVER LIMIT" };

export function ResourceBar({ resource: r }: { resource: Resource }) {
  const lv = level(r);
  const pct = lv === "unknown" || r.available <= 0 ? 0 : Math.min(100, (r.used / r.available) * 100);
  return (
    <div className="res" data-level={lv}>
      <div className="res__row">
        <span className="res__label">{r.kind}</span>
        <span>
          {lv === "unknown" ? "not set yet" : `${r.used} / ${r.available} ${r.unit}`}
        </span>
      </div>
      <div className="res__track" role="meter" aria-label={r.kind} aria-valuemin={0}
        aria-valuemax={lv === "unknown" ? 0 : r.available} aria-valuenow={lv === "unknown" ? 0 : r.used}
        aria-valuetext={lv === "unknown" ? "not set yet" : `${r.used} of ${r.available} ${r.unit}, ${WORD[lv]}`}>
        <div className="res__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="res__state">{WORD[lv]}</span>
    </div>
  );
}
