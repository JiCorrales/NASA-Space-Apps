import { useState } from "react";
import type { Source } from "../bridge/types";

const LABEL = { nasa: "NASA", derived: "DERIVED", team: "TEAM" } as const;

/** Where a number comes from. The word is always visible; click to read the source text. */
export function SourceTag({ source }: { source: Source }) {
  const [open, setOpen] = useState(false);
  return (
    <span>
      <button type="button" className="src" data-status={source.status} aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
        {LABEL[source.status]} {open ? "-" : "+"}
      </button>
      {open && <span className="src__text">{source.text}</span>}
    </span>
  );
}
