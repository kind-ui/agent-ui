import {
  type CheckpointApi,
  type CheckpointRestoreDetails,
  type CheckpointScopeState,
  type CheckpointState,
  checkpointPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ActionDetails } from "@ui-sdk/core";
import type { AlertDialogOpenChangeReason } from "@ui-sdk/core/alert-dialog";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineInternalAlertDialog } from "./internal/alert-dialog.js";
import { defineInternalRadio } from "./internal/radio.js";
import { defineInternalTooltip } from "./internal/tooltip.js";

const DEFAULT_PARTS = `<kind-checkpoint-label></kind-checkpoint-label><kind-checkpoint-description></kind-checkpoint-description><kind-checkpoint-line></kind-checkpoint-line><kind-checkpoint-restore><kind-internal-alert-dialog><ui-alert-dialog><kind-internal-tooltip><ui-tooltip type="label"><ui-tooltip-trigger><ui-alert-dialog-trigger><button data-checkpoint-trigger data-kind-icon-button></button></ui-alert-dialog-trigger></ui-tooltip-trigger><ui-tooltip-content hidden>Restore checkpoint</ui-tooltip-content></ui-tooltip></kind-internal-tooltip><ui-alert-dialog-backdrop hidden></ui-alert-dialog-backdrop><ui-alert-dialog-content hidden><ui-alert-dialog-title></ui-alert-dialog-title><p data-checkpoint-point></p><kind-checkpoint-scope></kind-checkpoint-scope><ui-alert-dialog-description data-checkpoint-loss><span data-checkpoint-loss-text></span><span data-checkpoint-note></span></ui-alert-dialog-description><div data-checkpoint-answers><kind-checkpoint-compare><button><span data-checkpoint-compare-icon aria-hidden="true"></span>Compare</button></kind-checkpoint-compare><kind-checkpoint-error>Couldn't restore. Try again.</kind-checkpoint-error><kind-checkpoint-cancel><button>Cancel</button></kind-checkpoint-cancel><kind-checkpoint-confirm><button><span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true"></span>Restore</button></kind-checkpoint-confirm></div></ui-alert-dialog-content></ui-alert-dialog></kind-internal-alert-dialog></kind-checkpoint-restore><kind-checkpoint-restored><span aria-hidden="true" data-status-mark data-status="complete"></span><span data-checkpoint-outcome></span><span data-checkpoint-outcome-meta></span></kind-checkpoint-restored>`;

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
type GroupElement = HTMLElement & { controller?: unknown; defaultValue?: string | null };

// The scope's label and radios, built from its data and before the group connects, since a Radio group reads
// `defaultValue` as it connects. Drawn again only for a new list of scopes.
const drawn = new WeakMap<Element, CheckpointScopeState["options"]>();
const drawScope = (part: Element | null, scope: CheckpointScopeState) => {
  if (!part || drawn.get(part) === scope.options || !(drawn.has(part) || !part.firstElementChild)) return;
  drawn.set(part, scope.options);
  const document = part.ownerDocument;
  const template = document.createElement("template");
  template.innerHTML = '<span aria-hidden="true" data-checkpoint-scope-label></span>';
  const label = template.content.firstElementChild as Element;
  label.textContent = scope.label;
  const group = document.createElement("ui-radio-group") as GroupElement;
  group.controller = scope.controller;
  group.defaultValue = scope.defaultValue;
  group.ariaLabel = scope.label;
  group.setAttribute("data-agent-hidden", "");
  for (const option of scope.options) {
    const row = document.createElement("label");
    row.setAttribute("data-checkpoint-option", "");
    const radio = document.createElement("ui-radio");
    radio.setAttribute("value", option.value);
    radio.append(document.createElement("ui-radio-indicator"));
    row.append(radio, option.label);
    group.append(row);
  }
  const wrapper = document.createElement("kind-internal-radio");
  wrapper.append(group);
  part.replaceChildren(label, wrapper);
};
type ContentElement = Element & { initialFocus?: string; ariaBusy: string | null };

/**
 * `<kind-checkpoint label="Checkpoint" description="Before editing auth.ts">` fills in its parts when it has no
 * children. The `can-restore` attribute shows Restore, which opens a dialog; the dialog's Restore fires `restore`
 * with the chosen `scope`: call `event.detail.waitUntil(promise)` to keep the dialog open until it settles.
 * `can-compare` shows Compare in the dialog, which fires `compare`. `scopes`, `changes` and the counts are properties.
 */
export function defineCheckpoint(): void {
  if (customElements.get("kind-checkpoint")) return;
  defineInternalAlertDialog();
  defineInternalTooltip();
  defineInternalRadio();
  createParts(checkpointPrimitive, {
    root: {
      tag: "kind-checkpoint",
      kinds: { canRestore: "boolean", canCompare: "boolean" },
      defaults: { agentConfirm: true },
      // Without the attribute, the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const { canRestore, canCompare } = el as KindCheckpointElement;
        return {
          ...(canRestore ? {} : { onRestore: undefined }),
          ...(canCompare ? {} : { onCompare: undefined }),
        };
      },
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
          const { controller, dismissible, busy, initialFocus, title, point, description, note } =
            api.dialogState(state);
          const dialog = el.querySelector<DialogElement>("kind-checkpoint-restore ui-alert-dialog");
          write(dialog, "controller", controller);
          write(dialog, "dismissible", dismissible);
          const content = el.querySelector<ContentElement>("ui-alert-dialog-content");
          write(content, "initialFocus", initialFocus);
          write(content, "ariaBusy", busy ? "true" : null);
          fill(el.querySelector("ui-alert-dialog-title"), title);
          fill(el.querySelector("[data-checkpoint-point]"), point);
          fill(el.querySelector("[data-checkpoint-loss-text]"), description);
          fill(el.querySelector("[data-checkpoint-note]"), note);
          if (state.scopes.length > 1)
            drawScope(el.querySelector("kind-checkpoint-scope"), api.scopeState(state));
          fill(el.querySelector("[data-checkpoint-outcome]"), state.outcome);
          fill(el.querySelector("[data-checkpoint-outcome-meta]"), state.outcomeMeta);
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
    scope: "kind-checkpoint-scope",
    compare: { tag: "kind-checkpoint-compare", target: wrappedButton, display: "contents" },
    error: "kind-checkpoint-error",
    cancel: { tag: "kind-checkpoint-cancel", target: wrappedButton, display: "contents" },
    confirm: { tag: "kind-checkpoint-confirm", target: wrappedButton, display: "contents" },
  });
}

export type KindCheckpointEvents = {
  openchange: UiChangeEvent<boolean, AlertDialogOpenChangeReason>;
  restore: CustomEvent<{ value: CheckpointRestoreDetails } & Pick<UiActionDetail, "waitUntil">>;
  compare: CustomEvent<{ value: ActionDetails } & Pick<UiActionDetail, "waitUntil">>;
};

export interface KindCheckpointElement
  extends UiElement<KindCheckpointEvents>,
    AttributeProperties<typeof checkpointPrimitive, "api" | "open"> {
  canRestore: boolean;
  canCompare: boolean;
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
    "kind-checkpoint-scope": HTMLElement;
    "kind-checkpoint-compare": HTMLElement;
    "kind-checkpoint-error": HTMLElement;
    "kind-checkpoint-cancel": HTMLElement;
    "kind-checkpoint-confirm": HTMLElement;
  }
}
