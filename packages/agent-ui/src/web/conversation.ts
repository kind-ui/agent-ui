import { conversationPrimitive } from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";

/**
 * With `virtualize`, render a `<kind-conversation-row value index>` for each row of the root's
 * `rowschange` event. Write `<kind-conversation-jump><button></button></kind-conversation-jump>`:
 * the primitive writes the button's text.
 */
export function defineConversation(): void {
  if (customElements.get("kind-conversation")) return;
  createParts(conversationPrimitive, {
    root: { tag: "kind-conversation", api: ["scrollToEnd"] },
    viewport: "kind-conversation-viewport",
    content: "kind-conversation-content",
    row: "kind-conversation-row",
    jump: { tag: "kind-conversation-jump", target: wrappedButton, display: "contents" },
    empty: "kind-conversation-empty",
  });
}
