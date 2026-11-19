import {
  APPROVAL_MODE_GROUP,
  APPROVAL_MODE_LEARN_MORE,
  type ApprovalModeApi,
  type ApprovalModeChangeReason,
  type ApprovalModeContentState,
  type ApprovalModeOptions,
  type ApprovalModeRow,
  type ApprovalModeState,
  approvalModePrimitive,
} from "@kind-ui/agent-ui/core";
import type { MenuOpenChangeReason } from "@ui-sdk/core/menu";
import { createParts } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import {
  defineInternalMenu,
  drawMenuItemContent,
  menuElement as element,
  placeMenuChild as place,
} from "./internal/menu.js";

const DEFAULT_PARTS = `<kind-internal-menu><ui-menu><kind-approval-mode-trigger><ui-menu-trigger><button type="button" data-agent-hidden></button></ui-menu-trigger></kind-approval-mode-trigger><kind-approval-mode-content><ui-menu-content side-offset="6" align="start"></ui-menu-content></kind-approval-mode-content></ui-menu></kind-internal-menu>`;

// Buttons and contents this element filled in, and so draws. Ones someone wrote keep theirs, as React's children do.
// Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
const drawnTrigger = new WeakMap<Element, string>();
const drawnContent = new WeakMap<Element, ApprovalModeContentState>();

type Selectable = HTMLElement & { value: string | null };

const warningMark = (document: Document) =>
  element(document, "span", { "data-status-mark": "", "data-status": "warning", "aria-hidden": "true" });

const drawTrigger = (button: Element, mode: ApprovalModeRow | undefined) => {
  const document = button.ownerDocument;
  const children: Node[] = [
    element(document, "span", { "data-menu-trigger-icon": "", "aria-hidden": "true" }),
  ];
  if (mode) children.push(element(document, "span", { "data-approval-mode-value": "" }, mode.label));
  if (mode?.danger) children.push(warningMark(document));
  button.replaceChildren(...children);
};

const drawHeader = (group: Element, state: ApprovalModeContentState) => {
  const document = group.ownerDocument;
  let header = group.querySelector(":scope > [data-approval-mode-header]");
  if (!header) {
    header = element(document, "div", { "data-approval-mode-header": "" });
    header.append(element(document, "ui-menu-group-label"));
  }
  place(group, header, group.firstElementChild);
  const title = header.querySelector(":scope > ui-menu-group-label");
  if (title && title.textContent !== state.label) title.textContent = state.label;
  let learnMore = header.querySelector(":scope > [data-approval-mode-learn-more]");
  const link = state.learnMoreHref !== undefined;
  if (learnMore && (!state.learnMore || learnMore.hasAttribute("as-child") !== link)) {
    learnMore.remove();
    learnMore = null;
  }
  if (!state.learnMore) return;
  if (!learnMore) {
    const attributes = { value: APPROVAL_MODE_LEARN_MORE, "data-approval-mode-learn-more": "" };
    learnMore = element(document, "ui-menu-item", link ? { "as-child": "", ...attributes } : attributes);
    learnMore.append(link ? element(document, "a", {}, "Learn more") : "Learn more");
    header.append(learnMore);
  }
  const anchor = learnMore.querySelector(":scope > a");
  if (anchor && state.learnMoreHref && anchor.getAttribute("href") !== state.learnMoreHref)
    anchor.setAttribute("href", state.learnMoreHref);
};

const drawRow = (document: Document, el: Element | undefined, row: ApprovalModeRow) => {
  let item = el;
  if (!item) {
    item = element(document, "ui-menu-radio-item", { value: row.value, "close-on-select": "" });
    const indicator = element(document, "ui-menu-item-indicator", { "keep-mounted": "" });
    indicator.append(element(document, "span", { "data-menu-check": "", "aria-hidden": "true" }));
    item.append(indicator);
  }
  item.setAttribute("label", row.label);
  item.toggleAttribute("data-danger", row.danger);
  const indicator = item.querySelector(":scope > ui-menu-item-indicator");
  let risk = item.querySelector(":scope > [data-approval-mode-risk]");
  // Clears the item when the label or description changed, so the indicator and the risk badge go back after.
  drawMenuItemContent(item, row);
  if (indicator) place(item, indicator, item.firstElementChild);
  if (row.danger) {
    if (!risk) {
      risk = element(document, "span", { "data-approval-mode-risk": "" });
      risk.append(warningMark(document), "Risky");
    }
    place(item, risk, null);
  } else risk?.remove();
  return item;
};

/**
 * Draws the header and the rows into the radio group, reusing each radio item by its `value` and moving only what is
 * out of place, so a person's focus and highlight survive a change of `modes` or `value` while the menu is open.
 */
const drawContent = (content: Element, state: ApprovalModeContentState) => {
  const document = content.ownerDocument;
  let group = content.querySelector<Selectable>(":scope > ui-menu-radio-group");
  if (!group) {
    group = element(document, "ui-menu-radio-group", { name: APPROVAL_MODE_GROUP }) as Selectable;
    content.append(group);
  }
  drawHeader(group, state);
  const existing = new Map<string, Element>();
  for (const item of group.querySelectorAll(":scope > ui-menu-radio-item"))
    existing.set(item.getAttribute("value") ?? "", item);
  let previous = group.querySelector(":scope > [data-approval-mode-header]");
  for (const row of state.rows) {
    const item = drawRow(document, existing.get(row.value), row);
    existing.delete(row.value);
    place(group, item, previous ? previous.nextElementSibling : group.firstElementChild);
    previous = item;
  }
  for (const item of existing.values()) item.remove();
  if (group.value !== state.value) group.value = state.value;
};

/**
 * `<kind-approval-mode>` fills in its trigger and menu when it has no children. Set `modes` as a property and `value`
 * as a property or attribute; a person's choice fires `modechange`. With `can-learn-more`, Learn more fires
 * `learnmore`. Markup you write puts the `ui-menu` inside a `kind-internal-menu`, which styles it, and an empty
 * `ui-menu-content` in `kind-approval-mode-content` gets the header and the modes.
 */
export function defineApprovalMode(): void {
  if (customElements.get("kind-approval-mode")) return;
  defineInternalMenu();
  createParts(approvalModePrimitive, {
    root: {
      tag: "kind-approval-mode",
      kinds: { canLearnMore: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindApprovalModeElement).canLearnMore ? {} : { onLearnMore: undefined }),
      defaults: { agentConfirm: true },
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
        value: {
          get: (api) => api.getValue(),
          set: (api, value) => api.setValue?.(String(value)),
        },
      },
      // The inner menu fires a `valuechange` and an `action` of its own.
      events: { onValueChange: "modechange", onLearnMore: "learnmore" },
      api: ["isOpen", "setOpen", "getValue"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const api = instance.api as ApprovalModeApi;
        const draw = () => {
          const state = instance.get() as ApprovalModeState;
          const { controller, presentation, open } = api.partState.menu(state);
          const menu = el.querySelector("ui-menu");
          if (menu) {
            if (menu.controller !== controller) menu.controller = controller;
            if (menu.presentation !== presentation) menu.presentation = presentation;
            if (menu.open !== open) menu.open = open;
          }
          const trigger = el.querySelector("kind-approval-mode-trigger > ui-menu-trigger");
          const props = api.triggerState(state);
          trigger?.toggleAttribute("disabled", props.disabled);
          const button = trigger?.querySelector("button");
          if (button) {
            if (button.ariaLabel !== props["aria-label"]) button.ariaLabel = props["aria-label"];
            if (!button.firstChild) owned.add(button);
            // By content, since every new `modes` array makes new rows.
            const { mode } = props;
            const key = mode ? `${mode.danger}:${mode.label}` : "";
            if (owned.has(button) && drawnTrigger.get(button) !== key) {
              drawnTrigger.set(button, key);
              drawTrigger(button, props.mode);
            }
          }
          const content = el.querySelector("kind-approval-mode-content > ui-menu-content");
          const contentState = api.contentState(state);
          if (content && !content.firstChild) owned.add(content);
          if (content && owned.has(content) && drawnContent.get(content) !== contentState) {
            drawnContent.set(content, contentState);
            drawContent(content, contentState);
          }
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    trigger: { tag: "kind-approval-mode-trigger", display: "contents" },
    content: { tag: "kind-approval-mode-content", display: "contents" },
  });
}

export type KindApprovalModeEvents = {
  modechange: UiChangeEvent<string, ApprovalModeChangeReason>;
  learnmore: UiChangeEvent<string | undefined, "item-press">;
  openchange: UiChangeEvent<boolean, MenuOpenChangeReason>;
};

export interface KindApprovalModeElement
  extends UiElement<KindApprovalModeEvents>,
    AttributeProperties<typeof approvalModePrimitive, "api" | "modes" | "value" | "open"> {
  modes?: NonNullable<ApprovalModeOptions["modes"]>;
  /** The chosen mode's `value`. Setting it chooses that mode without firing `modechange`. */
  get value(): string | undefined;
  set value(value: string);
  open: boolean;
  /** Whether the menu offers Learn more without a `learn-more-href`, which fires `learnmore`. */
  canLearnMore: boolean;
  api: Pick<ApprovalModeApi, "isOpen" | "setOpen" | "getValue">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-approval-mode": KindApprovalModeElement;
    "kind-approval-mode-trigger": HTMLElement;
    "kind-approval-mode-content": HTMLElement;
  }
}
