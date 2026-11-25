import { createStore, del, get, set } from "idb-keyval";
import type { WorkspaceSnapshot } from "./workspace";

// The thread and workspace are kept in this browser's IndexedDB so a reload picks up where it was. "New session"
// clears them. Nothing here leaves the device.

const store = typeof indexedDB === "undefined" ? undefined : createStore("fx-gui", "state");
const KEY = "session";
const API_KEY = "fx-gui:gateway-key";

export type Saved<Message, Approval> = {
  messages: Message[];
  approvals: Record<string, Approval>;
  workspace: WorkspaceSnapshot;
  model?: string;
  effort?: string;
};

export const loadSession = <M, A>() =>
  store ? get<Saved<M, A>>(KEY, store).catch(() => undefined) : undefined;
export const saveSession = <M, A>(value: Saved<M, A>) =>
  store ? set(KEY, value, store).catch(() => {}) : undefined;
export const clearSession = () => (store ? del(KEY, store).catch(() => {}) : undefined);

/** A pasted AI Gateway key, saved on this device only. Disconnect removes it. */
export const savedKey = () => {
  try {
    return localStorage.getItem(API_KEY);
  } catch {
    return null;
  }
};
export const saveKey = (key: string | null) => {
  try {
    if (key) localStorage.setItem(API_KEY, key);
    else localStorage.removeItem(API_KEY);
  } catch {}
};
