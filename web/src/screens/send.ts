import { send as bridgeSend } from "../bridge/bridge";
import type { PageType, PayloadOf } from "../bridge/types";

/** What a screen calls to tell Unity what the player did. Tests pass a mock instead of the bridge. */
export type Send = <T extends PageType>(type: T, payload: PayloadOf<T>) => void;

export const defaultSend: Send = bridgeSend;
