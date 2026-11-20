import "@ui-sdk/web/input";
import {
  SHARE_DIALOG_DESCRIPTIONS,
  type ShareDialogActionDetails,
  type ShareDialogApi,
  type ShareDialogOptions,
  type ShareDialogState,
  type ShareVisibility,
  type ShareVisibilityChangeReason,
  shareDialogPrimitive,
} from "@kind-ui/agent-ui/core";
import type { DialogOpenChangeReason } from "@ui-sdk/core/dialog";
import { createParts, type UiActionDetail, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type {
  AttributeProperties,
  UiChangeEvent,
  UiDetailedChangeEvent,
  UiElement,
} from "@ui-sdk/web/events";
import { defineInternalSegmentedControl } from "./internal/segmented-control.js";

const DEFAULT_PARTS = `
  <kind-share-dialog-trigger><button></button></kind-share-dialog-trigger>
  <kind-share-dialog-backdrop hidden></kind-share-dialog-backdrop>
  <kind-share-dialog-content hidden>
    <div data-share-dialog-header>
      <kind-share-dialog-title><h2></h2></kind-share-dialog-title>
      <kind-share-dialog-description><p></p></kind-share-dialog-description>
    </div>
    <kind-share-dialog-visibility>
      <kind-internal-segmented-control><ui-segmented-control data-agent-hidden><ui-segmented-control-indicator></ui-segmented-control-indicator><ui-segmented-control-item value="private">Only you</ui-segmented-control-item><ui-segmented-control-item value="link">Anyone with the link</ui-segmented-control-item></ui-segmented-control></kind-internal-segmented-control>
    </kind-share-dialog-visibility>
    <div data-share-dialog-link-row>
      <kind-share-dialog-create><button></button></kind-share-dialog-create>
      <kind-share-dialog-link><ui-input><input data-agent-hidden></ui-input></kind-share-dialog-link>
      <kind-share-dialog-copy><button></button></kind-share-dialog-copy>
    </div>
    <div data-share-dialog-footer>
      <kind-share-dialog-error><p></p></kind-share-dialog-error>
      <kind-share-dialog-revoke><button></button></kind-share-dialog-revoke>
      <kind-share-dialog-close><button>Done</button></kind-share-dialog-close>
    </div>
  </kind-share-dialog-content>`;

// Parts this element filled in, and so writes. A part someone wrote keeps its own, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
const instances = new WeakMap<Element, { get: () => unknown }>();
const viewports = new WeakMap<Element, Element>();

const owns = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || (!part.firstElementChild && !part.textContent?.trim()))) return false;
  owned.add(part);
  return true;
};

const text = (part: Element | null, value: string) => {
  if (owns(part) && part.textContent !== value) part.textContent = value;
};

// A pending action keeps a running mark beside its words.
const action = (part: Element | null, label: string, state: ShareDialogState) => {
  if (!owns(part) || part.textContent === label) return;
  const mark = part.ownerDocument.createElement("span");
  for (const [name, value] of Object.entries({
    "aria-hidden": "true",
    "data-status-mark": "",
    "data-status": "running",
    "data-motion": state.motion,
  }))
    mark.setAttribute(name, value);
  part.replaceChildren(...(state.pending ? [mark] : []), label);
};

const write = <Target extends object, Key extends keyof Target>(
  target: Target | null,
  key: Key,
  value: Target[Key],
) => {
  if (target && target[key] !== value) target[key] = value;
};

/**
 * `<kind-share-dialog>` fills in its trigger and dialog when it has no children. Set `link` once the host has made
 * one. `can-create-link` offers Create link, which fires `createlink`; `can-revoke` offers Stop sharing, which fires
 * `revoke`. Choosing who can open the chat fires `sharevisibilitychange`, and Copy link `linkcopy`.
 */
export function defineShareDialog(): void {
  if (customElements.get("kind-share-dialog")) return;
  defineInternalSegmentedControl();
  createParts(shareDialogPrimitive, {
    root: {
      tag: "kind-share-dialog",
      kinds: { canCreateLink: "boolean", canRevoke: "boolean" },
      defaults: { agentConfirm: true },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const element = el as KindShareDialogElement;
        return {
          ...(element.canCreateLink ? {} : { onCreateLink: undefined }),
          ...(element.canRevoke ? {} : { onRevoke: undefined }),
        };
      },
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
        visibility: {
          get: (api) => api.getVisibility(),
          set: (api, visibility) => api.changeVisibility(visibility),
        },
      },
      // `visibilitychange` is the document's Page Visibility event, and Copy link's native `copy` bubbles.
      events: { onCopy: "linkcopy", onVisibilityChange: "sharevisibilitychange" },
      // `setVisibility`, `createLink`, `copyLink` and `revoke` are offered only while available, so they aren't
      // copied onto `api`.
      api: ["isOpen", "setOpen", "getVisibility", "changeVisibility"],
      // A sheet sits in a full-screen viewport, which the content moves into while it presents as one.
      portal: {
        slots: ["content"],
        container: (el) => {
          if ((instances.get(el)?.get() as ShareDialogState | undefined)?.presentation !== "sheet")
            return null;
          let viewport = viewports.get(el);
          if (!viewport) {
            const created = el.ownerDocument.createElement("kind-share-dialog-viewport");
            // It leaves once the content has moved back in place.
            new MutationObserver(() => created.hasChildNodes() || created.remove()).observe(created, {
              childList: true,
            });
            viewports.set(el, created);
            viewport = created;
          }
          if (viewport.parentNode !== el) el.append(viewport);
          return viewport;
        },
      },
      render: (el, instance) => {
        instances.set(el, instance);
        const api = instance.api as ShareDialogApi;
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const draw = () => {
          const state = instance.get() as ShareDialogState;
          text(el.querySelector("kind-share-dialog-trigger > button"), state.label);
          text(el.querySelector("kind-share-dialog-title > h2"), state.dialogLabel);
          text(
            el.querySelector("kind-share-dialog-description > p"),
            SHARE_DIALOG_DESCRIPTIONS[state.visibility],
          );
          text(el.querySelector("kind-share-dialog-copy > button"), state.copied ? "Copied" : "Copy link");
          action(
            el.querySelector("kind-share-dialog-create > button"),
            state.pending ? "Creating link" : "Create link",
            state,
          );
          action(
            el.querySelector("kind-share-dialog-revoke > button"),
            state.pending ? "Stopping" : "Stop sharing",
            state,
          );
          text(el.querySelector("kind-share-dialog-error > p"), state.error ?? "");
          const control = el.querySelector<Element & Record<string, unknown>>(
            "kind-share-dialog-visibility ui-segmented-control",
          );
          // The control keeps its first `defaultValue`; later values reach it through the controller.
          const { options, defaultValue, "aria-label": ariaLabel, ...props } = api.visibilityState(state);
          if (control)
            for (const [key, value] of Object.entries({ ...props, ariaLabel })) write(control, key, value);
          // `ui-input` holds the value, and the native input its attributes.
          const { value, readOnly, "aria-label": inputLabel } = api.linkState(state);
          write(
            el.querySelector<Element & { value: string }>("kind-share-dialog-link ui-input"),
            "value",
            value,
          );
          const input = el.querySelector<HTMLInputElement>("kind-share-dialog-link input");
          write(input, "readOnly", readOnly);
          write(input, "ariaLabel", inputLabel);
          api.syncVisibility();
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    trigger: { tag: "kind-share-dialog-trigger", target: wrappedButton, display: "contents" },
    backdrop: "kind-share-dialog-backdrop",
    viewport: "kind-share-dialog-viewport",
    content: "kind-share-dialog-content",
    title: { tag: "kind-share-dialog-title", target: wrappedChild("h2"), display: "contents" },
    description: { tag: "kind-share-dialog-description", target: wrappedChild("p"), display: "contents" },
    visibility: "kind-share-dialog-visibility",
    link: "kind-share-dialog-link",
    create: { tag: "kind-share-dialog-create", target: wrappedButton, display: "contents" },
    copy: { tag: "kind-share-dialog-copy", target: wrappedButton, display: "contents" },
    revoke: { tag: "kind-share-dialog-revoke", target: wrappedButton, display: "contents" },
    error: { tag: "kind-share-dialog-error", target: wrappedChild("p"), display: "contents" },
    close: { tag: "kind-share-dialog-close", target: wrappedButton, display: "contents" },
  });
}

export type KindShareDialogEvents = {
  openchange: UiChangeEvent<boolean, DialogOpenChangeReason>;
  sharevisibilitychange: UiChangeEvent<ShareVisibility, ShareVisibilityChangeReason>;
  createlink: CustomEvent<ShareDialogActionDetails & Pick<UiActionDetail, "waitUntil">>;
  revoke: CustomEvent<ShareDialogActionDetails & Pick<UiActionDetail, "waitUntil">>;
  linkcopy: UiDetailedChangeEvent<string, Parameters<NonNullable<ShareDialogOptions["onCopy"]>>[1]>;
};

export interface KindShareDialogElement
  extends UiElement<KindShareDialogEvents>,
    AttributeProperties<typeof shareDialogPrimitive, "api" | "open" | "visibility"> {
  open: boolean;
  visibility: ShareVisibility;
  canCreateLink: boolean;
  canRevoke: boolean;
  api: Pick<ShareDialogApi, "isOpen" | "setOpen" | "getVisibility" | "changeVisibility">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-share-dialog": KindShareDialogElement;
    "kind-share-dialog-trigger": HTMLElement;
    "kind-share-dialog-backdrop": HTMLElement;
    "kind-share-dialog-viewport": HTMLElement;
    "kind-share-dialog-content": HTMLElement;
    "kind-share-dialog-title": HTMLElement;
    "kind-share-dialog-description": HTMLElement;
    "kind-share-dialog-visibility": HTMLElement;
    "kind-share-dialog-link": HTMLElement;
    "kind-share-dialog-create": HTMLElement;
    "kind-share-dialog-copy": HTMLElement;
    "kind-share-dialog-revoke": HTMLElement;
    "kind-share-dialog-error": HTMLElement;
    "kind-share-dialog-close": HTMLElement;
  }
}
