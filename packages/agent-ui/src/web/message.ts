import "@ui-sdk/web/avatar";
import {
  durationLabel,
  type MessageApi,
  type MessageAvatarState,
  type MessageBranchChangeReason,
  type MessageOptions,
  type MessageOutcomeDetails,
  type MessageRegenerateContentState,
  type MessageState,
  type MessageWithdrawDetails,
  messageDeliveryText,
  messageOutcomeText,
  messagePrimitive,
  retryText,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton, wrappedChild } from "@ui-sdk/web";
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

const HEADER = `<kind-message-author></kind-message-author><kind-message-time><time></time></kind-message-time><kind-message-duration></kind-message-duration><kind-message-delivery></kind-message-delivery>`;
const DELIVERY = `<kind-message-delivery-icon></kind-message-delivery-icon><kind-message-delivery-text></kind-message-delivery-text><kind-message-withdraw><button>Withdraw</button></kind-message-withdraw>`;
const EDIT_ACTIONS = `<kind-message-edit-cancel><button>Cancel</button></kind-message-edit-cancel><kind-message-edit-save><button>Save</button></kind-message-edit-save>`;
const OUTCOME = `<kind-message-outcome-icon></kind-message-outcome-icon><kind-message-outcome-text></kind-message-outcome-text><kind-message-retry><button>Retry</button></kind-message-retry><kind-message-continue><button>Continue</button></kind-message-continue>`;

// Header, outcome and text parts this element filled in. A part someone wrote into keeps what they wrote, as
// React's children do. Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const filled = new WeakSet<Element>();
const claim = (part: Element | null | undefined): part is Element => {
  if (!part || !(filled.has(part) || !part.firstChild)) return false;
  filled.add(part);
  return true;
};
const fill = (part: Element | null | undefined, text: string) => {
  if (claim(part) && part.textContent !== text) part.textContent = text;
};

/** Fills an empty avatar part with a UI SDK Avatar of the author, and keeps the one it wrote current. */
const drawAvatar = (part: Element, { name, initials, src }: MessageAvatarState) => {
  if (!name) {
    if (filled.has(part)) part.replaceChildren();
    return;
  }
  if (!claim(part)) return;
  const document = part.ownerDocument;
  let avatar = part.querySelector("ui-avatar");
  if (!avatar) {
    avatar = document.createElement("ui-avatar");
    avatar.append(document.createElement("ui-avatar-fallback"));
    part.replaceChildren(avatar);
  }
  let image = avatar.querySelector(":scope > img");
  if (src) {
    if (!image) {
      image = document.createElement("img");
      image.setAttribute("alt", "");
      avatar.prepend(image);
    }
    if (image.getAttribute("src") !== src) image.setAttribute("src", src);
  } else image?.remove();
  const fallback = avatar.querySelector("ui-avatar-fallback");
  if (fallback && fallback.textContent !== initials) fallback.textContent = initials;
};

/** Fills an empty retrying part with its mark and keeps its words current, one text node a tick. */
const drawRetrying = (part: Element, text: string) => {
  if (!claim(part)) return;
  if (!part.firstChild)
    part.replaceChildren(part.ownerDocument.createElement("kind-message-retrying-icon"), "");
  const label = part.lastChild;
  if (label?.nodeType === Node.TEXT_NODE && label.textContent !== text) label.textContent = text;
};

/** Writes the header, avatar, delivery, retrying and outcome parts of `el`, filling in any written empty. */
const drawDetails = (el: Element, api: MessageApi, state: MessageState) => {
  const own = (selector: string) =>
    [...el.querySelectorAll(selector)].filter((part) => part.closest("kind-message") === el);
  for (const part of own("kind-message-header")) if (claim(part) && !part.firstChild) part.innerHTML = HEADER;
  for (const part of own("kind-message-delivery"))
    if (claim(part) && !part.firstChild) part.innerHTML = DELIVERY;
  for (const part of own("kind-message-outcome"))
    if (claim(part) && !part.firstChild) part.innerHTML = OUTCOME;
  // An editor written without Cancel and Save gets them after it.
  if (!own("kind-message-edit-actions").length)
    own("kind-message-editor")[0]?.after(el.ownerDocument.createElement("kind-message-edit-actions"));
  for (const part of own("kind-message-edit-actions"))
    if (claim(part) && !part.firstChild) part.innerHTML = EDIT_ACTIONS;
  for (const part of own("kind-message-avatar")) drawAvatar(part, api.avatarState(state));
  for (const part of own("kind-message-author")) fill(part, state.author?.name ?? "");
  const { label } = api.timeState(state);
  for (const part of own("kind-message-time > time")) fill(part, label);
  for (const part of own("kind-message-duration"))
    fill(part, durationLabel(state.durationSeconds, state.locale));
  for (const part of own("kind-message-outcome-text")) fill(part, messageOutcomeText(state));
  for (const part of own("kind-message-delivery-text")) fill(part, messageDeliveryText(state.delivery));
  const retrying = state.retry ? retryText(state.retry, state.retrySeconds, state.locale) : "";
  for (const part of own("kind-message-retrying")) drawRetrying(part, retrying);
};

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
 * The `can-regenerate`, `can-edit`, `can-retry`, `can-continue` and `can-withdraw` attributes offer those actions.
 * Callbacks are events: `regenerate`, `edit`, `branchchange`, `messagecopy`, `retry`, `continue` and `withdraw` (call
 * `event.detail.waitUntil(promise)` to keep Retry, Continue or Withdraw pending). An empty `kind-message-delivery` or
 * `kind-message-retrying` fills itself in; `retry` is a property. Write each action as a wrapper around a toolbar button,
 * `<kind-message-copy><ui-toolbar-button><button aria-label="Copy">`, inside a
 * `<kind-internal-toolbar><ui-toolbar aria-label="Message actions">`, and the editor as
 * `<kind-message-editor><textarea hidden></textarea></kind-message-editor>`, which gets Cancel and Save after it in a
 * `kind-message-edit-actions` unless you write one: write yours `hidden`, holding
 * `<kind-message-edit-cancel><button>Cancel</button></kind-message-edit-cancel>` and its Save twin.
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
      kinds: {
        canRegenerate: "boolean",
        canEdit: "boolean",
        canRetry: "boolean",
        canContinue: "boolean",
        canWithdraw: "boolean",
      },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const { canRegenerate, canEdit, canRetry, canContinue, canWithdraw } = el as KindMessageElement;
        return {
          ...(!canRegenerate && { onRegenerate: undefined }),
          ...(!canEdit && { onEdit: undefined }),
          ...(!canRetry && { onRetry: undefined }),
          ...(!canContinue && { onContinue: undefined }),
          ...(!canWithdraw && { onWithdraw: undefined }),
        };
      },
      events: { onCopy: "messagecopy" },
      api: ["copy"],
      render: (el, instance) => {
        const api = instance.api as MessageApi;
        const draw = () => {
          const state = instance.get() as MessageState;
          drawDetails(el, api, state);
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
    "edit-actions": "kind-message-edit-actions",
    "edit-cancel": { tag: "kind-message-edit-cancel", target: wrappedButton, display: "contents" },
    "edit-save": { tag: "kind-message-edit-save", target: wrappedButton, display: "contents" },
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
    header: "kind-message-header",
    author: "kind-message-author",
    time: { tag: "kind-message-time", target: wrappedChild("time"), display: "contents" },
    duration: "kind-message-duration",
    outcome: "kind-message-outcome",
    "outcome-icon": "kind-message-outcome-icon",
    "outcome-text": "kind-message-outcome-text",
    retry: { tag: "kind-message-retry", target: wrappedButton, display: "contents" },
    continue: { tag: "kind-message-continue", target: wrappedButton, display: "contents" },
    delivery: "kind-message-delivery",
    "delivery-icon": "kind-message-delivery-icon",
    "delivery-text": "kind-message-delivery-text",
    withdraw: { tag: "kind-message-withdraw", target: wrappedButton, display: "contents" },
    retrying: "kind-message-retrying",
    "retrying-icon": "kind-message-retrying-icon",
  });
}

export type KindMessageEvents = {
  branchchange: UiChangeEvent<number, MessageBranchChangeReason>;
  messagecopy: UiDetailedChangeEvent<string, Parameters<NonNullable<MessageOptions["onCopy"]>>[1]>;
  regenerate: UiDetailedChangeEvent<string, Parameters<NonNullable<MessageOptions["onRegenerate"]>>[1]>;
  edit: UiDetailedChangeEvent<string, Parameters<NonNullable<MessageOptions["onEdit"]>>[1]>;
  retry: CustomEvent<MessageOutcomeDetails & Pick<UiActionDetail, "waitUntil">>;
  continue: CustomEvent<MessageOutcomeDetails & Pick<UiActionDetail, "waitUntil">>;
  withdraw: CustomEvent<MessageWithdrawDetails & Pick<UiActionDetail, "waitUntil">>;
};

export interface KindMessageElement
  extends UiElement<KindMessageEvents>,
    AttributeProperties<typeof messagePrimitive, "api" | "regenerateOptions" | "author" | "retry"> {
  /** Who wrote it: `{ id, name, avatarUrl? }`. */
  author?: MessageOptions["author"];
  /** The retry in progress: `{ attempt, maxAttempts?, retryAt?, reason? }`. */
  retry?: MessageOptions["retry"];
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
  canRetry: boolean;
  canContinue: boolean;
  canWithdraw: boolean;
  api: Pick<MessageApi, "copy">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-message": KindMessageElement;
    "kind-message-avatar": HTMLElement;
    "kind-message-content": HTMLElement;
    "kind-message-editor": HTMLElement;
    "kind-message-edit-actions": HTMLElement;
    "kind-message-edit-cancel": HTMLElement;
    "kind-message-edit-save": HTMLElement;
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
    "kind-message-header": HTMLElement;
    "kind-message-author": HTMLElement;
    "kind-message-time": HTMLElement;
    "kind-message-duration": HTMLElement;
    "kind-message-outcome": HTMLElement;
    "kind-message-outcome-icon": HTMLElement;
    "kind-message-outcome-text": HTMLElement;
    "kind-message-retry": HTMLElement;
    "kind-message-continue": HTMLElement;
    "kind-message-delivery": HTMLElement;
    "kind-message-delivery-icon": HTMLElement;
    "kind-message-delivery-text": HTMLElement;
    "kind-message-withdraw": HTMLElement;
    "kind-message-retrying": HTMLElement;
    "kind-message-retrying-icon": HTMLElement;
  }
}
