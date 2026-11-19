/**
 * The first element after `el` that Tab reaches, else the last one before it, looking inside open shadow roots. UI SDK
 * finds these with a function it doesn't export, and `createFocusRecovery` asks its `fallback` for the element.
 */
export const nearestTabStop = (el: HTMLElement): HTMLElement | undefined => {
  let previous: HTMLElement | undefined;
  let passed = false;
  // A shadow root's elements count where its host is, which is where Tab reaches them.
  const next = (root: ParentNode): HTMLElement | undefined => {
    for (const candidate of root.querySelectorAll<HTMLElement>("*")) {
      if (candidate === el) passed = true;
      if (el.contains(candidate) || candidate.closest("[inert]")) continue;
      if (isTabStop(candidate)) {
        if (passed) return candidate;
        previous = candidate;
      }
      const inside = candidate.shadowRoot && next(candidate.shadowRoot);
      if (inside) return inside;
    }
    return undefined;
  };
  return next(el.ownerDocument.body) ?? previous;
};

const isTabStop = (candidate: HTMLElement) =>
  candidate.tabIndex >= 0 &&
  // Chrome reports 0 for a link without `href`, which takes no focus.
  !candidate.matches(":is(a, area):not([href])") &&
  !candidate.matches(":disabled") &&
  candidate.checkVisibility({ visibilityProperty: true });
