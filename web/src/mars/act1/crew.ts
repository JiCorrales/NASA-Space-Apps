// Crew setup: four players, each with one of the four looks and, separately, one of the four roles. Every role is
// taken once; looks may repeat (a look is only how a character is drawn). Pure logic; CrewScreen draws it.

import { ROLES, type CrewSetup, type Look, type Role } from "./types";

/** The art's four builds (web/src/mars/art/characters.ts). */
export type ArtLook = "round" | "broad" | "tall" | "compact";
export const ART_LOOKS: readonly ArtLook[] = ["round", "broad", "tall", "compact"];

/**
 * The Act 2 contract names looks by colour; the art names them by build. Each build has its trim colour in the
 * B art (round blue-teal, broad amber, compact violet, tall green), so they pair as below. To be unified with
 * Act 2 when both land.
 */
export const LOOK_OF_ART: Record<ArtLook, Look> = { round: "teal", broad: "amber", compact: "violet", tall: "coral" };
export const ART_OF_LOOK: Record<Look, ArtLook> = { teal: "round", amber: "broad", violet: "compact", coral: "tall" };

export const ROLE_NAME: Record<Role, string> = {
  commander: "Commander", engineer: "Engineer", scientist: "Scientist", comms: "Communications officer",
};
export const ROLE_SKILLS: Record<Role, string> = {
  commander: "Planning, logistics, first aid",
  engineer: "Construction, repair, power",
  scientist: "Geology, analysis, navigation",
  comms: "Radio, relay, forecasting",
};
export const LOOK_NAME: Record<ArtLook, string> = { round: "Round", broad: "Broad", tall: "Tall", compact: "Compact" };

/** A seat at the table: the look and role picked so far. */
export interface Seat { name: string; look: ArtLook | null; role: Role | null }

export const emptySeats = (): Seat[] => [1, 2, 3, 4].map((n) => ({ name: `Player ${n}`, look: null, role: null }));

/** Gives a role to a seat; whoever had it gives it up, so every role is taken once. */
export function assignRole(seats: Seat[], index: number, role: Role): Seat[] {
  return seats.map((s, i) => (i === index ? { ...s, role } : s.role === role ? { ...s, role: null } : s));
}
export function assignLook(seats: Seat[], index: number, look: ArtLook): Seat[] {
  return seats.map((s, i) => (i === index ? { ...s, look } : s));
}
export function rename(seats: Seat[], index: number, name: string): Seat[] {
  return seats.map((s, i) => (i === index ? { ...s, name: name.slice(0, 24) } : s));
}

/** For a person playing alone: every empty look and role filled, roles in order, looks not yet used first. */
export function fillTheRest(seats: Seat[]): Seat[] {
  const freeRoles = ROLES.filter((r) => !seats.some((s) => s.role === r));
  const unusedLooks = ART_LOOKS.filter((l) => !seats.some((s) => s.look === l));
  let ri = 0, li = 0;
  return seats.map((s, i) => ({
    ...s,
    name: s.name.trim() || `Player ${i + 1}`,
    role: s.role ?? freeRoles[ri++]!,
    look: s.look ?? unusedLooks[li++] ?? ART_LOOKS[i % ART_LOOKS.length]!,
  }));
}

export const crewComplete = (seats: Seat[]) =>
  seats.length === 4 && seats.every((s) => s.look && s.role) && new Set(seats.map((s) => s.role)).size === 4;

/** The crew in the Act 2 contract's form. */
export function toCrewSetup(seats: Seat[]): CrewSetup[] {
  if (!crewComplete(seats)) throw new Error("The crew is not complete");
  return seats.map((s, i) => ({ name: s.name.trim() || `Player ${i + 1}`, role: s.role!, look: LOOK_OF_ART[s.look!] }));
}
