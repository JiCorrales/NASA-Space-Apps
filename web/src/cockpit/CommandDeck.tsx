import type { CommandName, SimFrame } from "../bridge/types";
import { pad } from "./status";

/** Admin command buttons, straight from `frame.commands`, and the three latest log lines. */
export function CommandDeck({ frame, onCommand }: { frame: SimFrame | null; onCommand: (name: CommandName) => void }) {
  const ended = Boolean(frame?.report);
  const commands = ended ? [] : frame?.commands ?? [];
  const log = frame?.log.slice(-3) ?? [];
  return (
    <div className="ck-deck">
      <div>
        <h4 id="ck-cmds">ADMIN COMMANDS</h4>
        <div className="ck-cmds" role="group" aria-labelledby="ck-cmds">
          {commands.length === 0 && <span className="ck-none">{ended ? "Mission complete · no more commands" : "No commands until launch"}</span>}
          {commands.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`ck-cmd${c.active ? " on" : ""}`}
              data-command={c.name}
              disabled={!c.enabled}
              aria-pressed={c.active}
              onClick={() => { if (c.enabled) onCommand(c.name); }}
            >
              <span>{c.label}</span>
              <small>{c.active ? "ACTIVE" : c.enabled ? "READY" : "NOT AVAILABLE"}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="ck-logbox">
        <h4>MISSION LOG</h4>
        <div className="ck-log" aria-live="polite" data-testid="log">
          {log.map((l, i) => (
            <div key={`${l.week}-${i}-${l.text}`} className={l.kind === "alert" ? "a" : l.kind === "good" ? "g" : undefined}>
              W{pad(l.week)} · {l.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
