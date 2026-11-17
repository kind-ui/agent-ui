/** Hears one event of a composed UI SDK component: its `detail`, and the event to cancel or read the target of. */
export type ComposedHandler = (detail: unknown, event: Event) => void;

/**
 * Hands the named events of the `ui-*` elements inside `el` to `handlers`, as React's props get them. `@ui-sdk/web`
 * fires a component's events on its own element without bubbling, so `el` hears them as they capture; an event a
 * listener above already cancelled isn't handed on. React renders no `ui-*` elements, so this hears nothing there.
 * Call it from a slot's `bind`, and return what it returns.
 */
export function hearComposed(el: HTMLElement, handlers: Record<string, ComposedHandler>): () => void {
  const listeners = Object.entries(handlers).map(([name, handler]) => {
    const listener = (event: Event) => {
      if (event.defaultPrevented || !(event.target as Element).localName.startsWith("ui-")) return;
      handler((event as CustomEvent).detail, event);
    };
    el.addEventListener(name, listener, true);
    return [name, listener] as const;
  });
  return () => {
    for (const [name, listener] of listeners) el.removeEventListener(name, listener, true);
  };
}
