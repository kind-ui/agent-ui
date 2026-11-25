import {
  type StepApi,
  type StepGroupOptions,
  type StepGroupState,
  type StepOpenChangeReason,
  stepGroupMeta,
  stepGroupPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";

const TRIGGER = `<kind-step-group-trigger><button><kind-step-group-icon></kind-step-group-icon><kind-step-group-title></kind-step-group-title><kind-step-group-meta></kind-step-group-meta></button></kind-step-group-trigger>`;
const CANCEL = `<kind-step-group-cancel><button><span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true"></span>Stop all</button></kind-step-group-cancel>`;

// Parts this element filled in. A part someone wrote into keeps what they wrote, as React's children do. Kept
// across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const fill = (part: Element | null, text: string) => {
  // Pretty-printed markup leaves whitespace in a part nobody wrote into.
  if (!part || !(owned.has(part) || (!part.firstElementChild && !part.textContent?.trim()))) return;
  owned.add(part);
  if (part.textContent !== text) part.textContent = text;
};

/**
 * `<kind-step-group>` takes its steps inside a `<kind-step-group-content>`, and adds its trigger before that and
 * its Stop all button after it, unless it has a trigger of its own. `items` and `groupLabels` are properties. The
 * `can-cancel` attribute shows Stop all, which fires `stepgroupcancel`: call `event.detail.waitUntil(promise)` to
 * keep it pending.
 */
export function defineStepGroup(): void {
  if (customElements.get("kind-step-group")) return;
  createParts(stepGroupPrimitive, {
    root: {
      tag: "kind-step-group",
      kinds: { canCancel: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindStepGroupElement).canCancel ? {} : { onCancel: undefined }),
      events: { onCancel: "stepgroupcancel" },
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen", "expand", "collapse", "toggle"],
      render: (el, instance) => {
        // Lookups stay out of nested groups.
        const own = (tag: string) =>
          [...el.querySelectorAll(tag)].find((part) => part.closest("kind-step-group") === el) ?? null;
        // The parts go around the content, never the other way, so a framework rendering the steps keeps every node
        // where it put it.
        if (!own("kind-step-group-trigger")) {
          let content = el.querySelector(":scope > kind-step-group-content");
          if (!content) content = el.appendChild(el.ownerDocument.createElement("kind-step-group-content"));
          content.insertAdjacentHTML("beforebegin", TRIGGER);
          content.insertAdjacentHTML("afterend", CANCEL);
        }
        const draw = () => {
          const { title, running, durationSeconds } = instance.get() as StepGroupState;
          fill(own("kind-step-group-title"), title);
          fill(own("kind-step-group-meta"), stepGroupMeta(running, durationSeconds));
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        const arrivals = new MutationObserver((records) => {
          // The group's steps aren't its parts.
          const arrived = records.some(
            (record) =>
              !(record.target instanceof Element && record.target.closest("kind-step-group-content")) &&
              [...record.addedNodes].some((node) => node instanceof Element),
          );
          if (arrived) draw();
        });
        arrivals.observe(el, { childList: true, subtree: true });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    trigger: { tag: "kind-step-group-trigger", target: wrappedButton, display: "contents" },
    icon: "kind-step-group-icon",
    title: "kind-step-group-title",
    meta: "kind-step-group-meta",
    content: "kind-step-group-content",
    children: "kind-step-group-children",
    cancel: { tag: "kind-step-group-cancel", target: wrappedButton, display: "contents" },
  });
}

export type KindStepGroupEvents = {
  openchange: UiChangeEvent<boolean, StepOpenChangeReason>;
  stepgroupcancel: CustomEvent<Pick<UiActionDetail, "waitUntil">>;
};

export interface KindStepGroupElement
  extends UiElement<KindStepGroupEvents>,
    AttributeProperties<typeof stepGroupPrimitive, "api" | "open"> {
  open: boolean;
  canCancel: boolean;
  items?: StepGroupOptions["items"];
  groupLabels?: StepGroupOptions["groupLabels"];
  api: Pick<StepApi, "isOpen" | "setOpen" | "expand" | "collapse" | "toggle">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-step-group": KindStepGroupElement;
    "kind-step-group-trigger": HTMLElement;
    "kind-step-group-icon": HTMLElement;
    "kind-step-group-title": HTMLElement;
    "kind-step-group-meta": HTMLElement;
    "kind-step-group-content": HTMLElement;
    "kind-step-group-children": HTMLElement;
    "kind-step-group-cancel": HTMLElement;
  }
}
