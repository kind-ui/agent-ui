/**
 * The first element after `el` that Tab reaches, else the last one before it. UI SDK finds these with a function it
 * doesn't export, and `createFocusRecovery` asks its `fallback` for the element.
 */
export const nearestTabStop = (el: HTMLElement): HTMLElement | undefined => {
  const stops = [...el.ownerDocument.body.querySelectorAll<HTMLElement>("*")].filter(
    (candidate) =>
      candidate.tabIndex >= 0 &&
      // Chrome reports 0 for a link without `href`, which takes no focus.
      !candidate.matches(":is(a, area):not([href])") &&
      !el.contains(candidate) &&
      !candidate.matches(":disabled") &&
      !candidate.closest("[inert]") &&
      candidate.checkVisibility({ visibilityProperty: true }),
  );
  const isAfter = (candidate: HTMLElement) =>
    Boolean(el.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING);
  return stops.find(isAfter) ?? stops.filter((candidate) => !isAfter(candidate)).at(-1);
};
