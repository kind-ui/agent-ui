import {
  type ConnectionStatusRetryDetails,
  connectionStatusPrimitive,
  connectionStatusText,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiElement } from "@ui-sdk/web/events";

const PARTS = [
  ["kind-connection-status-mark", ""],
  ["kind-connection-status-text", ""],
  ["kind-connection-status-retry", "<button></button>"],
] as const;

// The text and Retry labels this element filled in. One someone wrote text into keeps it, as React's children do.
// Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const fill = (el: Element | null, text: string) => {
  if (!el || (!owned.has(el) && el.textContent)) return;
  owned.add(el);
  if (el.textContent !== text) el.textContent = text;
};

/**
 * `<kind-connection-status state="…">` adds its mark, its words and Retry, unless it has them, and fills in the
 * words and Retry's label unless they hold text of their own. The `can-retry` attribute
 * shows Retry, which fires `retry`: call `event.detail.waitUntil(promise)` to keep it pending until the promise
 * settles. `labels` is a property.
 */
export function defineConnectionStatus(): void {
  if (customElements.get("kind-connection-status")) return;
  createParts(connectionStatusPrimitive, {
    root: {
      tag: "kind-connection-status",
      kinds: { canRetry: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindConnectionStatusElement).canRetry ? {} : { onRetry: undefined }),
      render: (el, instance) => {
        let after: Element | null = null;
        for (const [tag, inner] of PARTS) {
          let part = el.querySelector(`:scope > ${tag}`);
          if (!part) {
            part = document.createElement(tag);
            part.innerHTML = inner;
            if (after) after.after(part);
            else el.prepend(part);
          }
          after = part;
        }
        const text = el.querySelector(":scope > kind-connection-status-text");
        const retry = el.querySelector(":scope > kind-connection-status-retry > button");
        // Reads the live `seconds`, as React's text part does.
        const draw = () => {
          const state = instance.get();
          fill(text, connectionStatusText(state));
          fill(retry, state.labels.retry);
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    mark: "kind-connection-status-mark",
    text: "kind-connection-status-text",
    retry: { tag: "kind-connection-status-retry", target: wrappedButton, display: "contents" },
  });
}

export type KindConnectionStatusEvents = {
  retry: CustomEvent<ConnectionStatusRetryDetails & Pick<UiActionDetail, "waitUntil">>;
};

export interface KindConnectionStatusElement
  extends UiElement<KindConnectionStatusEvents>,
    AttributeProperties<typeof connectionStatusPrimitive> {
  canRetry: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-connection-status": KindConnectionStatusElement;
    "kind-connection-status-mark": HTMLElement;
    "kind-connection-status-text": HTMLElement;
    "kind-connection-status-retry": HTMLElement;
  }
}
