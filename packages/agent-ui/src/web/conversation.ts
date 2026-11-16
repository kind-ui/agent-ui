import {
  type ConversationApi,
  type ConversationOptions,
  conversationPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiElement, UiPartElement } from "@ui-sdk/web/events";

/**
 * With `virtualize`, render a `<kind-conversation-row value index>` for each row of the root's
 * `rowschange` event (`detail.value`), starting from `element.api.getRows()`. Write the jump control as
 * `<kind-conversation-jump><button hidden></button></kind-conversation-jump>`, and the empty part
 * with `hidden` unless there are no messages, so neither shows before the elements upgrade; the
 * primitive writes the button's text.
 */
export function defineConversation(): void {
  if (customElements.get("kind-conversation")) return;
  createParts(conversationPrimitive, {
    root: { tag: "kind-conversation", api: ["scrollToEnd", "prepend", "isFollowing", "getRows"] },
    viewport: "kind-conversation-viewport",
    content: "kind-conversation-content",
    row: "kind-conversation-row",
    jump: { tag: "kind-conversation-jump", target: wrappedButton, display: "contents" },
    empty: "kind-conversation-empty",
  });
}

export type KindConversationEvents = {
  rowschange: CustomEvent<{ value: ReturnType<ConversationApi["getRows"]> }>;
};

export interface KindConversationElement
  extends UiElement<KindConversationEvents>,
    AttributeProperties<typeof conversationPrimitive, "api" | "controller" | "rowKey"> {
  api: Pick<ConversationApi, "scrollToEnd" | "prepend" | "isFollowing" | "getRows">;
  controller?: ConversationOptions["controller"];
  rowKey?: ConversationOptions["rowKey"];
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-conversation": KindConversationElement;
    "kind-conversation-viewport": HTMLElement;
    "kind-conversation-content": HTMLElement;
    "kind-conversation-row": UiPartElement<typeof conversationPrimitive, "row", "value" | "index">;
    "kind-conversation-jump": HTMLElement;
    "kind-conversation-empty": HTMLElement;
  }
}
