import { conversationPrimitive } from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";

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
