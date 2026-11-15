// Seeded randomness. Every roll is a pure function of the seed and a list of keys, so the same seed and the same
// choices replay the same run, and what one player does never shifts the rolls of another.

function mix(h: number, k: number): number {
  h = Math.imul(h ^ (k | 0), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** A number in [0, 1) from a seed and keys. */
export function roll(seed: number, ...keys: number[]): number {
  let h = 0x9e3779b9 ^ (seed | 0);
  for (const k of keys) h = mix(h, k);
  h = mix(h, 0x27d4eb2f);
  return h / 4294967296;
}

/** Stable small integer for a string key, for use in `roll`. */
export function keyOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h | 0;
}

/** A sequence generator for map making, where order of use is fixed. */
export function stream(seed: number, ...keys: number[]): () => number {
  let i = 0;
  return () => roll(seed, ...keys, i++);
}

export const rangeInt = (r: number, lo: number, hi: number) => lo + Math.floor(r * (hi - lo + 1));
