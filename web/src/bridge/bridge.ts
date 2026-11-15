import type { PageToUnity, PageType, PayloadOf, UnityToPage } from "./types";
import { createStandin } from "./standin";
import { inUnityBuild } from "./engine";

declare global {
  interface Window {
    unityInstance?: { SendMessage(object: string, method: string, json: string): void };
    MissionUI?: { receive(json: string): void };
  }
}

type Handler = (msg: UnityToPage) => void;
const handlers = new Set<Handler>();

function dispatch(msg: UnityToPage) {
  handlers.forEach((h) => h(msg));
}

// Unity calls this (through the .jslib plugin).
window.MissionUI = { receive: (json) => dispatch(JSON.parse(json) as UnityToPage) };

const standin = createStandin(dispatch);

/** True while there is no Unity and none is coming: the stand-in answers from fixture data. Inside a Unity build it
 * is never true, even when Unity has not started: fake data over a dead canvas is worse than a message. */
export const isStandin = () => !window.unityInstance && !inUnityBuild();

export function send<T extends PageType>(type: T, payload: PayloadOf<T>): void {
  const msg = { type, payload } as PageToUnity;
  if (window.unityInstance) window.unityInstance.SendMessage("Bridge", "Receive", JSON.stringify(msg));
  else if (!inUnityBuild()) standin.handle(msg);
  // In a Unity build that has not started, the message is dropped: the page sends `ready` again when Unity is up.
}

export function subscribe(handler: Handler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

/** Developer bar helper: emit a Unity-to-page message while in the stand-in. */
export const standinEmit = dispatch;
