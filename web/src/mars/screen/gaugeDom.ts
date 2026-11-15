// Gauges move during the sol without a React render: when a gauge event plays, the bars of that player's panel are
// set straight in the DOM from the view after the sol, and the one that changed gets a short mark.
import type { GaugeView } from "../types";

export const gaugeText = (g: GaugeView): string => `${g.value}${g.unit === "points" ? "" : ` ${g.unit}`}${g.low ? " LOW" : ""}`;
export const gaugePct = (g: GaugeView): number => Math.round(Math.max(0, Math.min(1, g.good)) * 100);

/** Returns how many of the gauges shown in `root` changed. */
export function applyGauges(root: HTMLElement, gauges: GaugeView[]): number {
  let changed = 0;
  for (const g of gauges) {
    const row = root.querySelector<HTMLElement>(`[data-gauge="${g.id}"]`);
    const fill = row?.querySelector<HTMLElement>(".gauge__fill");
    const val = row?.querySelector<HTMLElement>(".gauge__val");
    if (!row || !fill || !val) continue;
    const width = `${gaugePct(g)}%`, text = gaugeText(g);
    const moved = fill.style.width !== width || val.textContent !== text;
    fill.style.width = width; val.textContent = text; row.dataset.low = String(g.low);
    if (moved) { changed++; row.dataset.changed = "true"; setTimeout(() => { delete row.dataset.changed; }, 1400); }
  }
  return changed;
}
