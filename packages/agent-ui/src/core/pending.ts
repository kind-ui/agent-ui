import type { PrimitiveContext } from "@ui-sdk/core";

type PendingContext<Key extends string> = Pick<PrimitiveContext<unknown, object, string>, "onDestroy"> & {
  store: { get(): Record<Key, boolean>; set(state: NoInfer<Record<Key, boolean>>): void };
};

export interface PendingActionOptions<Key extends string> {
  /** The boolean state key that is `true` while a call is pending. */
  state: Key;
  /**
   * What the call acts on, like an approval's `approvalKey`. A result after it changes is stale and keeps the
   * lock, so call `release` when the key changes. Without it, only `release` and destroy make a result stale.
   */
  key?: () => string;
}

export interface PendingAction {
  /**
   * Sets the state key and calls `call` (a throw counts as a rejection). Returns `undefined` and calls nothing
   * while a call is pending. Resolves with `"stale"`, writing nothing, when the action was released or destroyed,
   * or `key` changed, before the call settled; otherwise clears the state key.
   */
  run(call: () => unknown): Promise<"done" | "failed" | "stale"> | undefined;
  /** Clears the state key and makes a pending call's result stale, as when the host replaces a request. */
  release(): void;
}

/** One action at a time, with the spec §4.1 lock: disabled at once, available again on failure, late results ignored. */
export function createPendingAction<Key extends string>(
  context: PendingContext<Key>,
  options: PendingActionOptions<Key>,
): PendingAction {
  const setPending = (pending: boolean) =>
    context.store.set({ [options.state]: pending } as Record<Key, boolean>);
  let current = 0;
  context.onDestroy(() => {
    current++;
  });
  return {
    run(call) {
      if (context.store.get()[options.state]) return undefined;
      const id = ++current;
      const key = options.key?.();
      setPending(true);
      const settle = (outcome: "done" | "failed") => {
        if (id !== current || options.key?.() !== key) return "stale";
        setPending(false);
        return outcome;
      };
      return new Promise((resolve) => resolve(call())).then(
        () => settle("done"),
        () => settle("failed"),
      );
    },
    release() {
      current++;
      setPending(false);
    },
  };
}
