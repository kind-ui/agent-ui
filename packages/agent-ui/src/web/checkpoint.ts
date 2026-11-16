import { type CheckpointApi, type CheckpointState, checkpointPrimitive } from "@kind-ui/agent-ui/core";
import type { ActionDetails } from "@ui-sdk/core";
import type { AlertDialogOpenChangeReason } from "@ui-sdk/core/alert-dialog";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineInternalAlertDialog } from "./internal/alert-dialog.js";
import { defineInternalTooltip } from "./internal/tooltip.js";

const DEFAULT_PARTS = `<kind-checkpoint-label></kind-checkpoint-label><kind-checkpoint-description></kind-checkpoint-description><kind-checkpoint-line></kind-checkpoint-line><kind-checkpoint-restore><kind-internal-alert-dialog><ui-alert-dialog><kind-internal-tooltip><ui-tooltip><ui-tooltip-trigger><ui-alert-dialog-trigger><button data-checkpoint-trigger></button></ui-alert-dialog-trigger></ui-tooltip-trigger><ui-tooltip-content hidden>Restore checkpoint</ui-tooltip-content></ui-tooltip></kind-internal-tooltip><ui-alert-dialog-backdrop hidden></ui-alert-dialog-backdrop><ui-alert-dialog-content hidden><ui-alert-dialog-title></ui-alert-dialog-title><ui-alert-dialog-description></ui-alert-dialog-description><div data-checkpoint-answers><kind-checkpoint-error>Couldn't restore. Try again.</kind-checkpoint-error><kind-checkpoint-cancel><button>Cancel</button></kind-checkpoint-cancel><kind-checkpoint-confirm><button>Restore</button></kind-checkpoint-confirm></div></ui-alert-dialog-content></ui-alert-dialog></kind-internal-alert-dialog></kind-checkpoint-restore><kind-checkpoint-restored><span aria-hidden="true" data-status-mark data-status="complete"></span>Restored</kind-checkpoint-restored>`;

// Parts this element wrote text into. A part someone wrote text into keeps it, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const fill = (part: Element | null, text: string) => {
  if (!part || !(owned.has(part) || !part.textContent)) return;
  owned.add(part);
  if (part.textContent !== text) part.textContent = text;
};

const write = <Target extends object, Key extends keyof Target>(
  target: Target | null,
  key: Key,
  value: Target[Key],
) => {
  if (target && target[key] !== value) target[key] = value;
};

type DialogElement = Element & { controller?: unknown; dismissible?: boolean };
type ContentElement = Element & { initialFocus?: string };

/**
 * `<kind-checkpoint label="Checkpoint" description="Before editing auth.ts">` fills in its parts when it has no
 * children. The `can-restore` attribute shows Restore, which opens a dialog; the dialog's Restore fires `restore`:
 * call `event.detail.waitUntil(promise)` to keep the dialog open until it settles.
 */
export function defineCheckpoint(): void {
  if (customElements.get("kind-checkpoint")) return;
  defineInternalAlertDialog();
  defineInternalTooltip();
  createParts(checkpointPrimitive, {
    root: {
      tag: "kind-checkpoint",
      kinds: { canRestore: "boolean" },
      // Without the attribute, the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindCheckpointElement).canRestore ? {} : { onRestore: undefined }),
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const api = instance.api as CheckpointApi;
        const draw = () => {
          const state = instance.get() as CheckpointState;
          fill(el.querySelector("kind-checkpoint-label"), state.label);
          fill(el.querySelector("kind-checkpoint-description"), state.description ?? "");
          const { controller, dismissible, initialFocus, title, description } = api.dialogState(state);
          const dialog = el.querySelector<DialogElement>("kind-checkpoint-restore ui-alert-dialog");
          write(dialog, "controller", controller);
          write(dialog, "dismissible", dismissible);
          write(el.querySelector<ContentElement>("ui-alert-dialog-content"), "initialFocus", initialFocus);
          fill(el.querySelector("ui-alert-dialog-title"), title);
          fill(el.querySelector("ui-alert-dialog-description"), description);
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        const arrivals = new MutationObserver((records) => {
          if (records.some((record) => [...record.addedNodes].some((node) => node instanceof Element)))
            draw();
        });
        arrivals.observe(el, { childList: true, subtree: true });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    label: "kind-checkpoint-label",
    description: "kind-checkpoint-description",
    line: "kind-checkpoint-line",
    restore: { tag: "kind-checkpoint-restore", display: "contents" },
    restored: "kind-checkpoint-restored",
    error: "kind-checkpoint-error",
    cancel: { tag: "kind-checkpoint-cancel", target: wrappedButton, display: "contents" },
    confirm: { tag: "kind-checkpoint-confirm", target: wrappedButton, display: "contents" },
  });
}

export type KindCheckpointEvents = {
  openchange: UiChangeEvent<boolean, AlertDialogOpenChangeReason>;
  restore: CustomEvent<{ value: ActionDetails } & Pick<UiActionDetail, "waitUntil">>;
};

export interface KindCheckpointElement
  extends UiElement<KindCheckpointEvents>,
    AttributeProperties<typeof checkpointPrimitive, "api" | "open"> {
  canRestore: boolean;
  open: boolean;
  api: Pick<CheckpointApi, "isOpen" | "setOpen">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-checkpoint": KindCheckpointElement;
    "kind-checkpoint-label": HTMLElement;
    "kind-checkpoint-description": HTMLElement;
    "kind-checkpoint-line": HTMLElement;
    "kind-checkpoint-restore": HTMLElement;
    "kind-checkpoint-restored": HTMLElement;
    "kind-checkpoint-error": HTMLElement;
    "kind-checkpoint-cancel": HTMLElement;
    "kind-checkpoint-confirm": HTMLElement;
  }
}
