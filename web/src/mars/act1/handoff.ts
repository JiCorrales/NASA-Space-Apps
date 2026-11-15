// The hand-over to Act 2 and the attempts list. Act 2 (mars.html, another package) reads `mars.handoff` and
// writes its results under `mars.history`; Act 1 keeps its own launch attempts under `mars.act1.attempts`.

import type { MarsSession } from "./session";
import type { Act1Handoff, CrewSetup } from "./types";

export const HANDOFF_KEY = "mars.handoff";
export const HISTORY_KEY = "mars.history";
export const ATTEMPTS_KEY = "mars.act1.attempts";
export const ACT2_PAGE = "mars.html";

/** The storage seam: `window.localStorage` fits. */
export interface KeyValueStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }

const store = (): KeyValueStorage | null => { try { return window.localStorage; } catch { return null; } };

/** The hand-over object, for when Act 1 and Act 2 are joined in one page. Exactly { design, extras, crew, capabilities }. */
export function handoffOf(session: MarsSession, crew: CrewSetup[]): Act1Handoff {
  return {
    design: JSON.parse(JSON.stringify(session.design)),
    extras: session.extras(),
    crew: crew.map((c) => ({ name: c.name, role: c.role, look: c.look })),
    capabilities: session.capabilities(),
  };
}

export function writeHandoff(h: Act1Handoff, storage: KeyValueStorage | null = store()): void {
  try { storage?.setItem(HANDOFF_KEY, JSON.stringify(h)); } catch { /* storage full or blocked: the button still works */ }
}

/** One line of the attempts list on the board. */
export interface AttemptLine { label: string; outcome: string; sol: number | null; cause: string | null }

/** Act 1's own launch attempts, kept across reloads. */
export interface StoredLaunch { number: number; outcome: string; cause: string; at: string }

export function readLaunches(storage: KeyValueStorage | null = store()): StoredLaunch[] {
  try {
    const v = JSON.parse(storage?.getItem(ATTEMPTS_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : [];
  } catch { return []; }
}
export function appendLaunch(entry: Omit<StoredLaunch, "number">, storage: KeyValueStorage | null = store()): StoredLaunch[] {
  const all = readLaunches(storage);
  const next = [...all, { number: all.length + 1, ...entry }];
  try { storage?.setItem(ATTEMPTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * Act 2's results under `mars.history`, if any. The shape belongs to Act 2: only the outcome, the sol it ended and
 * the cause are read, wherever they are found (at the top of an entry or under `result`), and only if present.
 */
export function readHistory(storage: KeyValueStorage | null = store()): AttemptLine[] {
  let raw: unknown;
  try { raw = JSON.parse(storage?.getItem(HISTORY_KEY) ?? "null"); } catch { return []; }
  const list: unknown[] = Array.isArray(raw) ? raw : raw && typeof raw === "object" && Array.isArray((raw as { attempts?: unknown }).attempts)
    ? (raw as { attempts: unknown[] }).attempts : [];
  return list.filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object").map((a, i) => {
    const res = (a.result && typeof a.result === "object" ? a.result : {}) as Record<string, unknown>;
    const causes = Array.isArray(res.causes) ? res.causes : Array.isArray(a.causes) ? a.causes : [];
    const firstCause = causes.map((c) => (c && typeof c === "object" ? str((c as { text?: unknown }).text) : str(c))).find(Boolean) ?? null;
    return {
      label: `On Mars ${i + 1}`,
      outcome: str(a.outcome) ?? str(res.outcome) ?? "unknown",
      sol: num(a.endedOnSol) ?? num(res.endedOnSol) ?? num(a.sol),
      cause: str(a.cause) ?? str(res.cause) ?? firstCause,
    };
  });
}
