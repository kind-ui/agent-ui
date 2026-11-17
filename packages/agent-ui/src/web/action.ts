import { actionPrimitive, type StepApi, type StepOpenChangeReason } from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineMarkdown, type KindMarkdownElement } from "./markdown.js";

const DEFAULT_PARTS = `<kind-action-trigger><button><kind-action-icon></kind-action-icon><kind-action-title></kind-action-title></button></kind-action-trigger><kind-action-content><kind-action-quote><blockquote hidden></blockquote></kind-action-quote><kind-action-result hidden><kind-markdown></kind-markdown></kind-action-result></kind-action-content>`;

// Titles and quotes this element filled in. One someone wrote text into keeps it, as React's children do. Kept
// across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const fill = (part: Element | null, text: string) => {
  if (!part || !(owned.has(part) || !part.textContent)) return;
  owned.add(part);
  if (part.textContent !== text) part.textContent = text;
};

const fillEmpty = (part: Element | null, html: string) => {
  if (part && !part.firstElementChild && !part.textContent?.trim()) part.innerHTML = html;
};

/**
 * `<kind-action label="…" quote="…" result="…" status="…">` fills in its trigger and content when it has no
 * children. It writes its title into an empty `<kind-action-title>`, its `quote` into an empty `<blockquote>` in
 * `<kind-action-quote>`, and its `result` into a `<kind-markdown>` inside `<kind-action-result>`.
 */
export function defineAction(): void {
  if (customElements.get("kind-action")) return;
  defineMarkdown();
  createParts(actionPrimitive, {
    root: {
      tag: "kind-action",
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen", "expand", "collapse", "toggle"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const draw = () => {
          const { title, quote, result, status } = instance.get();
          // Parts a page wrote empty are filled in, as React's defaults are.
          fillEmpty(el.querySelector("kind-action-quote"), "<blockquote hidden></blockquote>");
          fillEmpty(el.querySelector("kind-action-result"), "<kind-markdown></kind-markdown>");
          fill(el.querySelector("kind-action-title"), title);
          fill(el.querySelector("kind-action-quote > blockquote"), quote);
          const markdown = el.querySelector<KindMarkdownElement>(
            ":scope > kind-action-content > kind-action-result > kind-markdown",
          );
          if (markdown) {
            if (markdown.source !== result) markdown.source = result;
            const streaming = status === "running";
            if (markdown.streaming !== streaming) markdown.streaming = streaming;
          }
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        const arrivals = new MutationObserver((records) => {
          // The blocks `kind-markdown` renders for each chunk aren't parts.
          const arrived = records.some(
            (record) =>
              !(record.target instanceof Element && record.target.closest("kind-markdown")) &&
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
    trigger: { tag: "kind-action-trigger", target: wrappedButton, display: "contents" },
    icon: "kind-action-icon",
    title: "kind-action-title",
    content: "kind-action-content",
    quote: { tag: "kind-action-quote", target: wrappedChild("blockquote"), display: "contents" },
    result: "kind-action-result",
  });
}

export type KindActionEvents = { openchange: UiChangeEvent<boolean, StepOpenChangeReason> };

export interface KindActionElement
  extends UiElement<KindActionEvents>,
    AttributeProperties<typeof actionPrimitive, "api" | "open"> {
  open: boolean;
  api: Pick<StepApi, "isOpen" | "setOpen" | "expand" | "collapse" | "toggle">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-action": KindActionElement;
    "kind-action-trigger": HTMLElement;
    "kind-action-icon": HTMLElement;
    "kind-action-title": HTMLElement;
    "kind-action-content": HTMLElement;
    "kind-action-quote": HTMLElement;
    "kind-action-result": HTMLElement;
  }
}
