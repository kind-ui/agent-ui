import {
  codeSpans,
  type StepApi,
  type StepGroupOptions,
  type StepGroupState,
  type StepOpenChangeReason,
  stepGroupPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";

const TRIGGER = `<kind-step-group-trigger><button><kind-step-group-icon></kind-step-group-icon><kind-step-group-title></kind-step-group-title><kind-step-group-meta></kind-step-group-meta></button></kind-step-group-trigger>`;

// Parts this element filled in. A part someone wrote into keeps what they wrote, as React's children do. Kept
// across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
const filled = new WeakMap<Element, string>();

// Writes text with its backticks as `code` elements.
const fill = (part: Element | null, text: string) => {
  // Pretty-printed markup leaves whitespace in a part nobody wrote into.
  if (!part || !(owned.has(part) || (!part.firstElementChild && !part.textContent?.trim()))) return;
  owned.add(part);
  if (filled.get(part) === text) return;
  filled.set(part, text);
  part.replaceChildren(
    ...codeSpans(text).map((piece, index) => {
      if (!(index % 2)) return piece;
      const code = part.ownerDocument.createElement("code");
      code.textContent = piece;
      return code;
    }),
  );
};

/**
 * `<kind-step-group>` takes its steps inside a `<kind-step-group-content>` (in a `<kind-step-group-children>`), and
 * adds its trigger before that unless it has one of its own. `items` and `kinds` are properties.
 */
export function defineStepGroup(): void {
  if (customElements.get("kind-step-group")) return;
  createParts(stepGroupPrimitive, {
    root: {
      tag: "kind-step-group",
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
        // The trigger goes before the content, never the other way, so a framework rendering the steps keeps every
        // node where it put it.
        if (!own("kind-step-group-trigger")) {
          let content = el.querySelector(":scope > kind-step-group-content");
          if (!content) content = el.appendChild(el.ownerDocument.createElement("kind-step-group-content"));
          content.insertAdjacentHTML("beforebegin", TRIGGER);
        }
        const draw = () => {
          const { title, meta } = instance.get() as StepGroupState;
          fill(own("kind-step-group-title"), title);
          fill(own("kind-step-group-meta"), meta);
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    trigger: { tag: "kind-step-group-trigger", target: wrappedButton, display: "contents" },
    icon: "kind-step-group-icon",
    title: "kind-step-group-title",
    meta: "kind-step-group-meta",
    content: "kind-step-group-content",
    children: "kind-step-group-children",
  });
}

export type KindStepGroupEvents = { openchange: UiChangeEvent<boolean, StepOpenChangeReason> };

export interface KindStepGroupElement
  extends UiElement<KindStepGroupEvents>,
    AttributeProperties<typeof stepGroupPrimitive, "api" | "open"> {
  open: boolean;
  items?: StepGroupOptions["items"];
  kinds?: StepGroupOptions["kinds"];
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
  }
}
