import {
  createFocusRecovery,
  createRovingFocus,
  type PrimitiveContext,
  type RovingFocusOptions,
} from "@ui-sdk/core";

/** What `createListFocus` returns, kept on a list primitive's api for its item slot. */
export type ListFocus<State extends object, Props extends object> = {
  roving: ReturnType<typeof createRovingFocus<State, Props>>;
  recovery: ReturnType<typeof createFocusRecovery<Props>>;
};

/**
 * One Tab stop for a list's items, arrow keys between them, and focus that moves to a neighbor when the focused
 * item leaves. The item slot calls `roving.keydown` in `on.keydown`, and `roving.bind` and `recovery.bind` in `bind`.
 */
export const createListFocus = <State extends object, Props extends object>(
  context: Pick<PrimitiveContext<unknown, State, string>, "store" | "onDestroy">,
  {
    slot,
    key = "focused" as keyof State & string,
    orientation,
    focusable,
    move,
    fallback,
  }: {
    slot: string;
    /**
     * The state key holding the item with the Tab stop, for a component with two lists.
     * @default "focused"
     */
    key?: keyof State & string;
    orientation?: RovingFocusOptions<State, Props>["orientation"];
    focusable?: (item: { key: string }) => boolean;
    /** Replaces the arrow keys, Home and End, as `createRovingFocus`'s `move` does: for items that aren't rendered. */
    move?: RovingFocusOptions<State, Props>["move"];
    /** Where focus goes when no item is left to take it. */
    fallback?: () => HTMLElement | null | undefined;
  },
): ListFocus<State, Props> => {
  // Recovery runs after the removed item has left `roving.items()`, so keep the order from before.
  let current: string[] = [];
  let previous: string[] = [];
  const roving = createRovingFocus<State, Props>(context, {
    slot,
    key,
    ...(orientation && { orientation }),
    ...(focusable && { focusable }),
    ...(move && { move }),
    onItemsChange: () => {
      previous = current;
      current = roving.items().map((item) => item.key);
    },
  });
  const recovery = createFocusRecovery<Props>({
    fallback: (lost) => {
      const order = current.includes(lost.key) ? current : previous;
      const index = order.indexOf(lost.key);
      const items = roving.items().filter((item) => focusable?.(item) ?? true);
      const at = (key: string | undefined) => items.find((item) => item.key === key);
      // An item that moved to a new element, like a Queue item that completed, keeps focus.
      return (
        (at(lost.key) ?? at(order[index + 1]) ?? at(order[index - 1]) ?? items.at(-1))?.el ?? fallback?.()
      );
    },
  });
  return { roving, recovery };
};
