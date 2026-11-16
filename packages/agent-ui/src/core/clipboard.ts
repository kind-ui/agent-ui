import { announce, type PrimitiveContext } from "@ui-sdk/core";

const COPIED_MS = 2000;

type CopyContext = Pick<PrimitiveContext<unknown, { copied: boolean }, string>, "store" | "onDestroy">;

/**
 * Writes text to the clipboard (spec §2 exception: UI SDK has no clipboard utility), sets `copied` for
 * `COPIED_MS` and announces the outcome. Resolves with whether the write went through.
 */
export function createCopy(context: CopyContext): (text: string) => Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  context.onDestroy(() => clearTimeout(timer));
  return async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      clearTimeout(timer);
      context.store.set({ copied: false });
      announce("Copy failed", { priority: "polite" });
      return false;
    }
    clearTimeout(timer);
    context.store.set({ copied: true });
    announce("Copied", { priority: "polite" });
    timer = setTimeout(() => context.store.set({ copied: false }), COPIED_MS);
    return true;
  };
}
