import type { Option } from "../bridge/types";
import { SourceTag } from "./SourceTag";

/** One choice in a decision group. Selected is shown with a mark and text, not only a colour. */
export function OptionCard({ option, selected, onSelect }: { option: Option; selected: boolean; onSelect: () => void }) {
  return (
    <div>
      <button type="button" className="card" aria-pressed={selected} onClick={onSelect}>
        <span className="card__name">
          <span>{option.name}</span>
          <span className="card__mark">{selected ? "[x] SELECTED" : "[ ]"}</span>
        </span>
        <span className="card__summary" style={{ display: "block" }}>{option.summary}</span>
        {option.stats.length > 0 && (
          <ul className="card__stats">
            {option.stats.map((s) => (
              <li key={s.label}>{s.label}: <b>{s.value}</b> {s.unit}</li>
            ))}
          </ul>
        )}
      </button>
      <div className="card__foot"><SourceTag source={option.source} /></div>
    </div>
  );
}
