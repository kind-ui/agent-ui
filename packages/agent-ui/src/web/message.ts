import {
  type MessageApi,
  type MessageBranchChangeReason,
  type MessageOptions,
  messagePrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type {
  AttributeProperties,
  UiChangeEvent,
  UiDetailedChangeEvent,
  UiElement,
} from "@ui-sdk/web/events";

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
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const { canRegenerate, canEdit } = el as KindMessageElement;
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

export type KindMessageEvents = {
  branchchange: UiChangeEvent<number, MessageBranchChangeReason>;
  messagecopy: UiDetailedChangeEvent<string, Parameters<NonNullable<MessageOptions["onCopy"]>>[1]>;
  regenerate: UiDetailedChangeEvent<string, Parameters<NonNullable<MessageOptions["onRegenerate"]>>[1]>;
  edit: UiDetailedChangeEvent<string, Parameters<NonNullable<MessageOptions["onEdit"]>>[1]>;
};

export interface KindMessageElement
  extends UiElement<KindMessageEvents>,
    AttributeProperties<typeof messagePrimitive, "api"> {
  canRegenerate: boolean;
  canEdit: boolean;
  api: Pick<MessageApi, "copy">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-message": KindMessageElement;
    "kind-message-avatar": HTMLElement;
    "kind-message-content": HTMLElement;
    "kind-message-editor": HTMLElement;
    "kind-message-toolbar": HTMLElement;
    "kind-message-copy": HTMLElement;
    "kind-message-regenerate": HTMLElement;
    "kind-message-edit": HTMLElement;
    "kind-message-branch": HTMLElement;
    "kind-message-branch-previous": HTMLElement;
    "kind-message-branch-label": HTMLElement;
    "kind-message-branch-next": HTMLElement;
  }
}
