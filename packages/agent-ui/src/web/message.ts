import {
  type MessageApi,
  type MessageBranchChangeReason,
  type MessageOptions,
  type MessageRegenerateContentState,
  type MessageState,
  messagePrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type {
  AttributeProperties,
  UiChangeEvent,
  UiDetailedChangeEvent,
  UiElement,
} from "@ui-sdk/web/events";
import {
  defineInternalMenu,
  drawMenuItemContent,
  menuElement as element,
  placeMenuChild as place,
} from "./internal/menu.js";

type RegenerateOption = MessageRegenerateContentState["options"][number];

// Contents this element filled in, and so draws the rows of. A content someone wrote keeps its rows, as React's
// children do. Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
const drawn = new WeakMap<Element, MessageRegenerateContentState>();

/**
 * Draws a level's rows into `parent` (a separator after `first`, when given), reusing each row's element by its `id`
 * and moving only what is out of place, so a person's focus and highlight survive a change of options.
 */
const drawLevel = (parent: Element, options: RegenerateOption[], first?: RegenerateOption) => {
  const document = parent.ownerDocument;
  const rows = new Map<string, Element>();
  for (const row of parent.querySelectorAll(":scope > [data-row]"))
    rows.set(row.getAttribute("data-row") ?? "", row);
  const drawRow = (option: RegenerateOption) => {
    let el = rows.get(option.id);
    rows.delete(option.id);
    const opens = option.items !== undefined;
    if (el && (el.localName === "ui-menu-sub") !== opens) el = undefined;
    if (!option.items) {
      el ??= element(document, "ui-menu-item", { "data-row": option.id });
      el.setAttribute("value", option.id);
      el.setAttribute("label", option.label);
      drawMenuItemContent(el, option);
      return el;
    }
    if (!el) {
      el = element(document, "ui-menu-sub", { "data-row": option.id });
      el.append(element(document, "ui-menu-sub-trigger"), element(document, "ui-menu-sub-content"));
    }
    const trigger = el.querySelector(":scope > ui-menu-sub-trigger");
    if (trigger)
      drawMenuItemContent(trigger, option, [element(document, "span", { "data-menu-chevron": "" })]);
    const sub = el.querySelector(":scope > ui-menu-sub-content");
    if (sub) drawLevel(sub, option.items);
    return el;
  };
  const wanted = first
    ? [
        drawRow(first),
        parent.querySelector(":scope > ui-menu-separator") ?? element(document, "ui-menu-separator"),
      ]
    : [];
  for (const option of options) wanted.push(drawRow(option));
  let previous: Element | null = null;
  for (const child of wanted) {
    place(parent, child, previous ? previous.nextElementSibling : parent.firstElementChild);
    previous = child;
  }
  const kept = new Set(wanted);
  for (const child of [...parent.children]) if (!kept.has(child)) child.remove();
};

/**
 * The `can-regenerate` and `can-edit` attributes offer those actions. Callbacks are events: `regenerate`, `edit`,
 * `branchchange` and `messagecopy`. Write each action as a wrapper around a toolbar button,
 * `<kind-message-copy><ui-toolbar-button><button aria-label="Copy">`, inside a
 * `<kind-internal-toolbar><ui-toolbar aria-label="Message actions">`, and the editor as
 * `<kind-message-editor><textarea hidden></textarea></kind-message-editor>`.
 *
 * With `regenerateOptions` (a property), write Regenerate as a menu whose trigger is the toolbar button:
 * `<kind-message-regenerate><kind-internal-menu><ui-menu>` holding
 * `<kind-message-regenerate-trigger><ui-toolbar-button><ui-menu-trigger><button aria-label="Regenerate">` and
 * `<kind-message-regenerate-content><ui-menu-content data-agent-hidden>`, which gets the rows while empty. The
 * `regenerate` event's `detail.optionId` is the option chosen.
 */
export function defineMessage(): void {
  if (customElements.get("kind-message")) return;
  defineInternalMenu();
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
      render: (el, instance) => {
        const api = instance.api as MessageApi;
        const draw = () => {
          const state = instance.get() as MessageState;
          for (const part of el.querySelectorAll("kind-message-regenerate")) {
            if (part.closest("kind-message") !== el) continue;
            // Controlled even without options, when the menu stays closed.
            const props = api.regenerateMenu.partState.menu(state);
            const menu = part.querySelector("ui-menu");
            if (menu) {
              if (menu.controller !== props.controller) menu.controller = props.controller;
              if (menu.presentation !== props.presentation) menu.presentation = props.presentation;
              if (menu.open !== props.open) menu.open = props.open;
            }
            const content = part.querySelector("kind-message-regenerate-content > ui-menu-content");
            if (!content) continue;
            const rows = api.regenerateContentState(state);
            // A content written empty fills itself in, as React's bare `MessageRegenerateContent` does.
            if (!content.firstChild) owned.add(content);
            if (owned.has(content) && drawn.get(content) !== rows) {
              drawn.set(content, rows);
              if (rows.options.length) drawLevel(content, rows.options, rows.tryAgain);
              else content.replaceChildren();
            }
          }
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    avatar: "kind-message-avatar",
    content: "kind-message-content",
    editor: { tag: "kind-message-editor", target: wrappedChild("textarea"), display: "contents" },
    toolbar: "kind-message-toolbar",
    copy: { tag: "kind-message-copy", display: "contents" },
    regenerate: { tag: "kind-message-regenerate", display: "contents" },
    "regenerate-trigger": { tag: "kind-message-regenerate-trigger", display: "contents" },
    "regenerate-content": { tag: "kind-message-regenerate-content", display: "contents" },
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
    AttributeProperties<typeof messagePrimitive, "api" | "regenerateOptions"> {
  /**
   * An option's `icon` is an image URL, or an element (such as an `svg`) copied into its row. A copy keeps the
   * element's ids, so pass an icon that uses `defs` (gradients, masks) as an image URL.
   */
  regenerateOptions?: (Omit<NonNullable<MessageOptions["regenerateOptions"]>[number], "icon" | "items"> & {
    icon?: string | Element;
    items?: NonNullable<KindMessageElement["regenerateOptions"]>;
  })[];
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
    "kind-message-regenerate-trigger": HTMLElement;
    "kind-message-regenerate-content": HTMLElement;
    "kind-message-edit": HTMLElement;
    "kind-message-branch": HTMLElement;
    "kind-message-branch-previous": HTMLElement;
    "kind-message-branch-label": HTMLElement;
    "kind-message-branch-next": HTMLElement;
  }
}
