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

/** The rows without `id` once its exit has finished, unless the host brought it back meanwhile. */
export const dropRow = <T extends { id: string }>(
  rows: readonly LeavingRow<T>[],
  id: string,
): LeavingRow<T>[] => rows.filter((row) => !(row.leaving && row.item.id === id));
