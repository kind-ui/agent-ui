import { announce, type PrimitiveContext } from "@ui-sdk/core";

const COPIED_MS = 2000;

type CopyContext<Key extends string> = Pick<PrimitiveContext<unknown, object, string>, "onDestroy"> & {
  store: { set(state: NoInfer<Record<Key, boolean>>): void };
};

/**
 * Writes text to the clipboard (spec §2 exception: UI SDK has no clipboard utility), sets `key` in state for
 * `COPIED_MS` and announces the outcome. Resolves with whether the write went through.
 */
export function createCopy<Key extends string = "copied">(
  context: CopyContext<Key>,
  key = "copied" as Key,
): (text: string) => Promise<boolean> {
  const setCopied = (copied: boolean) => context.store.set({ [key]: copied } as Record<Key, boolean>);
  let timer: ReturnType<typeof setTimeout> | undefined;
  context.onDestroy(() => clearTimeout(timer));
  return async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      clearTimeout(timer);
      setCopied(false);
      announce("Copy failed", { priority: "polite" });
      return false;
    }
    clearTimeout(timer);
    setCopied(true);
    announce("Copied", { priority: "polite" });
    timer = setTimeout(() => setCopied(false), COPIED_MS);
    return true;
  };
}
