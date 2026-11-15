// Every attempt is kept: the design, each sol's plan, who was cut off and what they did alone, what ended it.
import type { Attempt, KeyValueStorage } from "./types";

export const HISTORY_KEY = "mars-relay-history-v1";

/** In-memory storage for tests and for pages without localStorage. */
export class MemoryStorage implements KeyValueStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

/** `window.localStorage` when the page has it, else memory. */
export function browserStorage(): KeyValueStorage {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch { /* storage blocked: fall through */ }
  return new MemoryStorage();
}

export class History {
  constructor(private storage: KeyValueStorage = browserStorage(), private key = HISTORY_KEY) {}

  list(): Attempt[] {
    const raw = this.storage.getItem(this.key);
    if (!raw) return [];
    try {
      const v = JSON.parse(raw) as unknown;
      return Array.isArray(v) ? (v as Attempt[]) : [];
    } catch {
      return []; // a damaged entry must not stop the game
    }
  }

  add(a: Attempt): void { this.storage.setItem(this.key, JSON.stringify([...this.list(), a])); }
  clear(): void { this.storage.removeItem(this.key); }
}
