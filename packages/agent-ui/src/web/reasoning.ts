import { reasoningPrimitive, type StepApi, type StepOpenChangeReason } from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineMarkdown, type KindMarkdownElement } from "./markdown.js";

const DEFAULT_PARTS = `<kind-reasoning-trigger><button><kind-reasoning-icon></kind-reasoning-icon><kind-reasoning-title></kind-reasoning-title></button></kind-reasoning-trigger><kind-reasoning-content><kind-markdown></kind-markdown></kind-reasoning-content>`;

/**
 * `<kind-reasoning status="…" text="…">` fills in its trigger and content when it has no children. It writes its
 * title into an empty `<kind-reasoning-title>`, and its `text` into a `<kind-markdown>` inside its content.
 */
export function defineReasoning(): void {
  if (customElements.get("kind-reasoning")) return;
  defineMarkdown();
  createParts(reasoningPrimitive, {
    root: {
      tag: "kind-reasoning",
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen", "expand", "collapse", "toggle"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        // A title someone wrote text into keeps it, as React's `ReasoningTitle` children do.
        const owned = new WeakSet<Element>();
        const draw = () => {
          const { title, text, status } = instance.get();
          const titlePart = el.querySelector("kind-reasoning-title");
          if (titlePart && (owned.has(titlePart) || !titlePart.textContent)) {
            owned.add(titlePart);
            if (titlePart.textContent !== title) titlePart.textContent = title;
          }
          const markdown = el.querySelector<KindMarkdownElement>(
            ":scope > kind-reasoning-content > kind-markdown",
          );
          if (markdown) {
            if (markdown.source !== text) markdown.source = text;
            const streaming = status === "running";
            if (markdown.streaming !== streaming) markdown.streaming = streaming;
          }
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
    trigger: { tag: "kind-reasoning-trigger", target: wrappedButton, display: "contents" },
    icon: "kind-reasoning-icon",
    title: "kind-reasoning-title",
    content: "kind-reasoning-content",
  });
}

export type KindReasoningEvents = { openchange: UiChangeEvent<boolean, StepOpenChangeReason> };

export interface KindReasoningElement
  extends UiElement<KindReasoningEvents>,
    AttributeProperties<typeof reasoningPrimitive, "api" | "open"> {
  open: boolean;
  api: Pick<StepApi, "isOpen" | "setOpen" | "expand" | "collapse" | "toggle">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-reasoning": KindReasoningElement;
    "kind-reasoning-trigger": HTMLElement;
    "kind-reasoning-icon": HTMLElement;
    "kind-reasoning-title": HTMLElement;
    "kind-reasoning-content": HTMLElement;
  }
}
