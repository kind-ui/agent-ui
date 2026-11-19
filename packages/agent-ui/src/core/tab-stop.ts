/**
 * The first element after `el` that Tab reaches, else the last one before it. It walks the flat tree, as Tab does: an
 * open shadow root in its host's place, and slotted elements where their slot is. UI SDK finds these with a function
 * it doesn't export, and `createFocusRecovery` asks its `fallback` for the element.
 */
export const nearestTabStop = (el: HTMLElement): HTMLElement | undefined => {
  let previous: HTMLElement | undefined;
  let passed = false;
  const visit = (candidate: Element): HTMLElement | undefined => {
    if (candidate === el) {
      passed = true;
      return undefined;
    }
    // A leaving part is often inert by now, with `el` inside it.
    if (candidate.hasAttribute("inert")) {
      if (candidate.contains(el)) passed = true;
      return undefined;
    }
    if (candidate instanceof HTMLSlotElement) {
      const assigned = candidate.assignedElements({ flatten: true });
      return walk(assigned.length > 0 ? assigned : candidate.children);
    }
    if (candidate instanceof HTMLElement && isTabStop(candidate)) {
      if (passed) return candidate;
      previous = candidate;
    }
    // A host's light children are reached through its slots.
    return walk(candidate.shadowRoot?.children ?? candidate.children);
  };
  const walk = (children: Iterable<Element>): HTMLElement | undefined => {
    for (const child of children) {
      const found = visit(child);
      if (found) return found;
    }
    return undefined;
  };
  return walk(el.ownerDocument.body.children) ?? previous;
};

const isTabStop = (candidate: HTMLElement) =>
  candidate.tabIndex >= 0 &&
  // Chrome reports 0 for a link without `href`, which takes no focus.
  !candidate.matches(":is(a, area):not([href])") &&
  !candidate.matches(":disabled") &&
  candidate.checkVisibility({ visibilityProperty: true });
