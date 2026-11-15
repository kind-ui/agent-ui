import { messagePrimitive } from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";

type MessageElement = HTMLElement & { canRegenerate: boolean; canEdit: boolean };

/**
 * The `can-regenerate` and `can-edit` attributes offer those actions. Callbacks are events: `regenerate`, `edit`,
 * `branchchange` and `messagecopy`. Write each action as a wrapper around a toolbar button,
 * `<kind-message-copy><ui-toolbar-button><button aria-label="Copy">`, inside a
 * `<kind-internal-toolbar><ui-toolbar aria-label="Message actions">`, and the editor as
 * `<kind-message-editor><textarea hidden></textarea></kind-message-editor>`.
 */
export function defineMessage(): void {
  if (customElements.get("kind-message")) return;
  createParts(messagePrimitive, {
    root: {
      tag: "kind-message",
      kinds: { canRegenerate: "boolean", canEdit: "boolean" },
      // A listener can't be seen, so an attribute offers the action and an unset one takes its callback away.
      options: (el) => {
        const { canRegenerate, canEdit } = el as MessageElement;
        return {
          ...(!canRegenerate && { onRegenerate: undefined }),
          ...(!canEdit && { onEdit: undefined }),
        };
      },
      events: { onCopy: "messagecopy" },
      api: ["copy"],
    },
    avatar: "kind-message-avatar",
    content: "kind-message-content",
    editor: { tag: "kind-message-editor", target: wrappedChild("textarea"), display: "contents" },
    toolbar: "kind-message-toolbar",
    copy: { tag: "kind-message-copy", display: "contents" },
    regenerate: { tag: "kind-message-regenerate", display: "contents" },
    edit: { tag: "kind-message-edit", display: "contents" },
    branch: "kind-message-branch",
    "branch-previous": { tag: "kind-message-branch-previous", target: wrappedButton, display: "contents" },
    "branch-label": "kind-message-branch-label",
    "branch-next": { tag: "kind-message-branch-next", target: wrappedButton, display: "contents" },
  });
}
