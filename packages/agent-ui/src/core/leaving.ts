import { enter, exit, layout, type MotionMode, type MotionOptions, resolvedMotion } from "./motion/index.js";

/** An item a component renders from host data, kept while it plays its exit after the host removed it (spec §6). */
export type LeavingRow<T> = { item: T; leaving: boolean };

/**
 * The rows to render for the host's `next` items: every item in `next`'s order, plus each removed one, still
 * leaving, right after the row it followed. An item that comes back stops leaving.
 */
export const mergeLeaving = <T extends { id: string }>(
  rows: readonly LeavingRow<T>[],
  next: readonly T[],
): LeavingRow<T>[] => {
  const ids = new Set(next.map((item) => item.id));
  const after = new Map<string | undefined, LeavingRow<T>[]>();
  let previous: string | undefined;
  for (const row of rows) {
    if (ids.has(row.item.id)) {
      previous = row.item.id;
      continue;
    }
    const leaving = after.get(previous) ?? [];
    leaving.push(row.leaving ? row : { item: row.item, leaving: true });
    after.set(previous, leaving);
  }
  const merged: LeavingRow<T>[] = [...(after.get(undefined) ?? [])];
  for (const item of next) merged.push({ item, leaving: false }, ...(after.get(item.id) ?? []));
  return merged;
};

/** `mergeLeaving`, except that with `motion` `"none"` a removed item leaves at once. */
export const leavingRows = <T extends { id: string }>(
  rows: readonly LeavingRow<T>[],
  next: readonly T[],
  motion: MotionMode | undefined,
): LeavingRow<T>[] => {
  const merged = mergeLeaving(rows, next);
  return resolvedMotion(motion) === "none" ? merged.filter((row) => !row.leaving) : merged;
};

/** The rows without `id` once its exit has finished, unless the host brought it back meanwhile. */
export const dropRow = <T extends { id: string }>(
  rows: readonly LeavingRow<T>[],
  id: string,
): LeavingRow<T>[] => rows.filter((row) => !(row.leaving && row.item.id === id));

/**
 * Binds a row's element: `join` (focus, moves) while it's present. Once it starts leaving, it leaves first, so a
 * focused row hands focus to a neighbor before the exit makes it inert, then plays the `"fade"` exit and calls
 * `drop`. A row that comes back joins again and fades in. Returns the unbind.
 */
export function bindLeavingRow(
  el: HTMLElement,
  row: {
    store: { subscribe: (listener: () => void) => () => void };
    isLeaving: () => boolean;
    motion: () => MotionOptions;
    join: () => () => void;
    drop: () => void;
  },
): () => void {
  let unjoin = row.join();
  let leaving = false;
  const follow = () => {
    const now = row.isLeaving();
    if (now === leaving) return;
    leaving = now;
    if (!leaving) {
      unjoin = row.join();
      void enter(el, "fade", row.motion());
      return;
    }
    unjoin();
    unjoin = () => {};
    exit(el, "fade", row.motion()).then(
      row.drop,
      // The item came back during its exit.
      () => {},
    );
  };
  follow();
  const unsubscribe = row.store.subscribe(follow);
  return () => {
    unsubscribe();
    unjoin();
  };
}

/**
 * Slides rows into place after a change moves them, so the rows after a dropped one close its gap. Call `measure`
 * with the rows before and after, just before they change: when a row moved, each row then slides from where
 * it was once the change reaches the page, on the first DOM change inside the bound element (before it paints),
 * else in the next frame. Only at full motion.
 */
export function createRowSlide(rows: ReadonlyMap<string, HTMLElement>, motion: () => MotionMode) {
  let root: HTMLElement | undefined;
  let pending: (() => void) | undefined;
  return {
    bind: (el: HTMLElement) => {
      root = el;
      return () => {
        pending?.();
        root = undefined;
      };
    },
    measure: <T extends { id: string }>(from: readonly LeavingRow<T>[], to: readonly LeavingRow<T>[]) => {
      // Rows added or dropped at the end move none of the others.
      const reordered = from.some((row, index) => index < to.length && row.item.id !== to[index]?.item.id);
      if (!reordered || !root || pending || resolvedMotion(motion()) !== "full") return;
      const before = new Map([...rows.values()].map((el) => [el, el.getBoundingClientRect()]));
      const slide = () => {
        pending?.();
        for (const [el, rect] of before)
          if (el.isConnected && el.checkVisibility()) void layout(el, rect, { motion: motion() });
      };
      const changes = new MutationObserver(slide);
      changes.observe(root, { childList: true, subtree: true });
      const frame = requestAnimationFrame(slide);
      pending = () => {
        changes.disconnect();
        cancelAnimationFrame(frame);
        pending = undefined;
      };
    },
  };
}
