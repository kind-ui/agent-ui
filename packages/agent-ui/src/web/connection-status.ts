import {
  type ConnectionStatusRetryDetails,
  connectionStatusPrimitive,
  connectionStatusText,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiElement } from "@ui-sdk/web/events";

const PARTS =
  "<kind-connection-status-mark></kind-connection-status-mark>" +
  "<kind-connection-status-text></kind-connection-status-text>" +
  "<kind-connection-status-retry><button></button></kind-connection-status-retry>";

/**
 * `<kind-connection-status state="…">` fills itself with its mark, its words and Retry. The `can-retry` attribute
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
        if (!el.querySelector(":scope > kind-connection-status-text"))
          el.insertAdjacentHTML("beforeend", PARTS);
        const text = el.querySelector(":scope > kind-connection-status-text");
        const retry = el.querySelector(":scope > kind-connection-status-retry > button");
        // Reads the live `seconds`, as React's text part does.
        const draw = () => {
          const state = instance.get();
          const words = connectionStatusText(state);
          if (text && text.textContent !== words) text.textContent = words;
          if (retry && retry.textContent !== state.labels.retry) retry.textContent = state.labels.retry;
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
