import { createFocusRecovery, createRovingFocus, type PrimitiveContext } from "@ui-sdk/core";

/** What `createListFocus` returns, kept on a list primitive's api for its item slot. */
export type ListFocus<State extends { focused: string | null }, Props extends { value: string }> = {
  roving: ReturnType<typeof createRovingFocus<State, Props>>;
  recovery: ReturnType<typeof createFocusRecovery<Props>>;
};

/**
 * One Tab stop for a list's items, arrow keys between them, and focus that moves to a neighbor when the focused
 * item leaves. The item slot calls `roving.keydown` in `on.keydown`, and `roving.bind` and `recovery.bind` in `bind`.
 */
export const createListFocus = <State extends { focused: string | null }, Props extends { value: string }>(
  context: Pick<PrimitiveContext<unknown, State, string>, "store" | "onDestroy">,
  { slot }: { slot: string },
): ListFocus<State, Props> => {
  // Recovery runs after the removed item has left `roving.items()`, so keep the order from before.
  let current: string[] = [];
  let previous: string[] = [];
  const roving = createRovingFocus<State, Props>(context, {
    slot,
    key: "focused",
    onItemsChange: () => {
      previous = current;
      current = roving.items().map((item) => item.key);
    },
  });
  const recovery = createFocusRecovery<Props>({
    fallback: (lost) => {
      const order = current.includes(lost.key) ? current : previous;
      const index = order.indexOf(lost.key);
      const items = roving.items();
      const at = (key: string | undefined) => items.find((item) => item.key === key);
      return (at(order[index + 1]) ?? at(order[index - 1]) ?? items.at(-1))?.el;
    },
  });
  return { roving, recovery };
};
