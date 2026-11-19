import {
  type ConversationApi,
  type ConversationOptions,
  type ConversationRetryDetails,
  type ConversationState,
  conversationPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiElement, UiPartElement } from "@ui-sdk/web/events";

const SKELETON_ROWS = "<span></span><span></span><span></span>";
const ERROR_PARTS = `<kind-conversation-error-text></kind-conversation-error-text><kind-conversation-retry><button>Retry</button></kind-conversation-retry>`;

// Parts this element wrote into, so it keeps them current while leaving a host's own content alone. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const owns = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || !part.firstChild)) return false;
  owned.add(part);
  return true;
};

const fill = (part: Element | null, html: string) => {
  if (owns(part) && !part.firstChild) part.innerHTML = html;
};

/**
 * With `virtualize`, render a `<kind-conversation-row value index>` for each row of the root's
 * `rowschange` event (`detail.value`), starting from `element.api.getRows()`. Write the jump control as
 * `<kind-conversation-jump><button hidden></button></kind-conversation-jump>`, and the empty, skeleton,
 * loading and error parts with `hidden` unless their state shows, so none shows before the elements
 * upgrade; the primitive writes the button's text. An empty `kind-conversation-skeleton`,
 * `kind-conversation-loading`, `kind-conversation-error` or `kind-conversation-error-text` is filled in.
 * The `can-retry` attribute offers Retry, which fires `retry`.
 */
export function defineConversation(): void {
  if (customElements.get("kind-conversation")) return;
  createParts(conversationPrimitive, {
    root: {
      tag: "kind-conversation",
      kinds: { canRetry: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindConversationElement).canRetry ? {} : { onRetry: undefined }),
      api: ["scrollToEnd", "prepend", "isFollowing", "getRows"],
      render: (el, instance) => {
        let drawn: string | undefined;
        const draw = () => {
          const { status, error } = instance.get() as ConversationState;
          if (`${status}\n${error}` === drawn) return;
          drawn = `${status}\n${error}`;
          fill(el.querySelector("kind-conversation-skeleton"), SKELETON_ROWS);
          const loading = el.querySelector("kind-conversation-loading");
          if (owns(loading) && !loading.textContent) loading.textContent = "Loading conversation";
          fill(el.querySelector("kind-conversation-error"), ERROR_PARTS);
          const text = el.querySelector("kind-conversation-error-text");
          if (owns(text) && text.textContent !== error) text.textContent = error;
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    viewport: "kind-conversation-viewport",
    content: "kind-conversation-content",
    row: "kind-conversation-row",
    jump: { tag: "kind-conversation-jump", target: wrappedButton, display: "contents" },
    empty: "kind-conversation-empty",
    "empty-title": "kind-conversation-empty-title",
    "empty-description": "kind-conversation-empty-description",
    skeleton: "kind-conversation-skeleton",
    loading: "kind-conversation-loading",
    error: "kind-conversation-error",
    "error-text": "kind-conversation-error-text",
    retry: { tag: "kind-conversation-retry", target: wrappedButton, display: "contents" },
  });
}

export type KindConversationEvents = {
  rowschange: CustomEvent<{ value: ReturnType<ConversationApi["getRows"]> }>;
  retry: CustomEvent<ConversationRetryDetails & Pick<UiActionDetail, "waitUntil">>;
};

export interface KindConversationElement
  extends UiElement<KindConversationEvents>,
    AttributeProperties<typeof conversationPrimitive, "api" | "controller" | "rowKey"> {
  api: Pick<ConversationApi, "scrollToEnd" | "prepend" | "isFollowing" | "getRows">;
  controller?: ConversationOptions["controller"];
  rowKey?: ConversationOptions["rowKey"];
  /** Offers Retry while `status` is `"error"`; pressing it fires `retry`. */
  canRetry: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-conversation": KindConversationElement;
    "kind-conversation-viewport": HTMLElement;
    "kind-conversation-content": HTMLElement;
    "kind-conversation-row": UiPartElement<typeof conversationPrimitive, "row", "value" | "index">;
    "kind-conversation-jump": HTMLElement;
    "kind-conversation-empty": HTMLElement;
    "kind-conversation-empty-title": HTMLElement;
    "kind-conversation-empty-description": HTMLElement;
    "kind-conversation-skeleton": HTMLElement;
    "kind-conversation-loading": HTMLElement;
    "kind-conversation-error": HTMLElement;
    "kind-conversation-error-text": HTMLElement;
    "kind-conversation-retry": HTMLElement;
  }
}
