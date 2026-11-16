import {
  type StepApi,
  type StepOpenChangeReason,
  stepListPrimitive,
  stepPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement, UiPartElement } from "@ui-sdk/web/events";

export function defineStep(): void {
  if (customElements.get("kind-step")) return;
  createParts(stepPrimitive, {
    root: {
      tag: "kind-step",
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen", "expand", "collapse", "toggle"],
    },
    trigger: { tag: "kind-step-trigger", target: wrappedButton, display: "contents" },
    icon: "kind-step-icon",
    title: "kind-step-title",
    meta: "kind-step-meta",
    content: "kind-step-content",
    children: "kind-step-children",
  });
}

/** Wrap each `<kind-step-trigger>` in a `<kind-step-list-item value="…">` to join the list's single Tab stop. */
export function defineStepList(): void {
  if (customElements.get("kind-step-list")) return;
  createParts(stepListPrimitive, {
    root: "kind-step-list",
    item: { tag: "kind-step-list-item", target: (el) => el.querySelector("button"), display: "contents" },
  });
}

export type KindStepEvents = { openchange: UiChangeEvent<boolean, StepOpenChangeReason> };

export interface KindStepElement
  extends UiElement<KindStepEvents>,
    AttributeProperties<typeof stepPrimitive, "api" | "open"> {
  open: boolean;
  api: Pick<StepApi, "isOpen" | "setOpen" | "expand" | "collapse" | "toggle">;
}

export interface KindStepListElement
  extends UiElement<Record<never, never>>,
    AttributeProperties<typeof stepListPrimitive> {}

declare global {
  interface HTMLElementTagNameMap {
    "kind-step": KindStepElement;
    "kind-step-trigger": HTMLElement;
    "kind-step-icon": HTMLElement;
    "kind-step-title": HTMLElement;
    "kind-step-meta": HTMLElement;
    "kind-step-content": HTMLElement;
    "kind-step-children": HTMLElement;
    "kind-step-list": KindStepListElement;
    "kind-step-list-item": UiPartElement<typeof stepListPrimitive, "item", "value">;
  }
}
