/** Hears one event of a composed UI SDK component: its `detail`, and the event to cancel or read the target of. */
export type ComposedHandler = (detail: unknown, event: Event) => void;

// The event names each element hears, so an outer element can leave an event to a nearer one.
const hearing = new WeakMap<Element, Map<string, number>>();

const nearer = (event: Event, el: Element) => {
  for (let node = event.target as Element | null; node && node !== el; node = node.parentElement)
    if (hearing.get(node)?.has(event.type)) return true;
  return false;
};

/**
 * Hands the named events of the `ui-*` elements inside `el` to `handlers`, as React's props get them. `@ui-sdk/web`
 * fires a component's events on its own element without bubbling, so `el` hears them as they capture; an event a
 * listener above already cancelled isn't handed on, nor one an element nearer its target hears (a component nested
 * in `el`'s content hears its own). React renders no `ui-*` elements, so this hears nothing there. Call it from a
 * slot's `bind`, and return what it returns.
 */
export function hearComposed(el: HTMLElement, handlers: Record<string, ComposedHandler>): () => void {
  let names = hearing.get(el);
  if (!names) {
    names = new Map();
    hearing.set(el, names);
  }
  const heard = names;
  const listeners = Object.entries(handlers).map(([name, handler]) => {
    const listener = (event: Event) => {
      if (event.defaultPrevented || !(event.target as Element).localName.startsWith("ui-")) return;
      if (nearer(event, el)) return;
      handler((event as CustomEvent).detail, event);
    };
    el.addEventListener(name, listener, true);
    heard.set(name, (heard.get(name) ?? 0) + 1);
    return [name, listener] as const;
  });
  return () => {
    for (const [name, listener] of listeners) {
      el.removeEventListener(name, listener, true);
      const count = (heard.get(name) ?? 1) - 1;
      if (count) heard.set(name, count);
      else heard.delete(name);
    }
  };
}
