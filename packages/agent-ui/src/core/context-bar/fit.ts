/**
 * How many chips fit in a row `available` pixels wide, from their widths in order and the `gap` between them. All of
 * them when they fit; else as many as leave room for the "+N" button, `reserve` pixels wide. A chip not measured yet
 * (`undefined`) and every chip after it don't fit.
 */
export const fitChips = (
  widths: readonly (number | undefined)[],
  available: number,
  gap: number,
  reserve: number,
): number => {
  // Half a pixel of slack, since layout rounds widths to device pixels.
  const room = available + 0.5;
  const ends: number[] = [];
  for (const width of widths) {
    if (width === undefined) break;
    ends.push((ends.at(-1) ?? -gap) + gap + width);
  }
  if (ends.length === widths.length && (ends.at(-1) ?? 0) <= room) return widths.length;
  let count = ends.length;
  while (count > 0 && (ends[count - 1] as number) + gap + reserve > room) count--;
  return count;
};
