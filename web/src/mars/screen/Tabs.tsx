import type { PlayerId } from "../types";
import { Icon, Portrait } from "./Icon";
import { ROLE_NAME } from "./Panel";
import type { MarsRun } from "./useMarsRun";

/**
 * The four-tab switcher of the narrow layouts (tablet portrait, phone): one panel at a time. Each tab carries the
 * portrait and the link state, so a cut-off player is visible from any tab. Hidden at wide widths by CSS.
 */
export function Tabs({ run, shown, onShow }: { run: MarsRun; shown: PlayerId; onShow: (p: PlayerId) => void }) {
  return (
    <div className="tabs" role="tablist" aria-label="Players">
      {run.views.map((v, i) => {
        const linked = v.self.linked, p = i as PlayerId;
        return (
          <button key={i} type="button" role="tab" id={`tab-${i}`} aria-selected={shown === p} aria-controls={`panel-${i}`} className="tab"
            data-link={linked ? "up" : "down"} onClick={() => onShow(p)}>
            <Portrait look={v.self.look} role={v.self.role} />
            <span className="tab__who"><b>{v.self.name}</b><span>{ROLE_NAME[v.self.role]}</span></span>
            <span className="tab__link"><Icon name={linked ? "link_linked" : "link_cutoff"} />{linked ? "UP" : "DOWN"}{v.self.status === "out" ? " - OUT" : ""}</span>
          </button>
        );
      })}
    </div>
  );
}
