import {
  type StepOpenChangeReason,
  type ToolApi,
  type ToolOptions,
  type ToolState,
  toolPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineCodeBlock, type KindCodeBlockElement } from "./code-block.js";
import { defineMarkdown, type KindMarkdownElement } from "./markdown.js";

const DEFAULT_PARTS = `<kind-tool-trigger><button><kind-tool-icon></kind-tool-icon><kind-tool-title></kind-tool-title><kind-tool-approval></kind-tool-approval></button></kind-tool-trigger><kind-tool-content><kind-tool-input></kind-tool-input><kind-tool-output></kind-tool-output><kind-tool-error></kind-tool-error></kind-tool-content>`;
const INPUT_PARTS = `<div data-tool-heading>Input<span data-tool-badge>Partial</span><kind-tool-input-copy><button></button></kind-tool-input-copy></div><kind-code-block headerless language="json"></kind-code-block>`;
const OUTPUT_PARTS = `<div data-tool-heading>Output<span data-tool-badge>Preliminary</span><kind-tool-output-copy><button></button></kind-tool-output-copy></div><kind-code-block headerless language="json"></kind-code-block><kind-markdown></kind-markdown>`;

// Parts this element wrote text or parts into. A part someone wrote text or parts into keeps them, as React's
// children do. Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const fill = (part: Element | null, text: string) => {
  if (!part || !(owned.has(part) || !part.textContent)) return;
  owned.add(part);
  if (part.textContent !== text) part.textContent = text;
};

const fillParts = (part: Element | null, html: string) => {
  if (part && !part.firstElementChild) {
    part.innerHTML = html;
    owned.add(part);
  }
  return part;
};

// Names a code block this element wrote, after the tool, as React's default parts do.
const label = (part: Element | null, code: KindCodeBlockElement | null | undefined, text: string) => {
  if (part && code && owned.has(part)) write(code, "ariaLabel", text);
};

const write = <Target extends object, Key extends keyof Target>(
  target: Target,
  key: Key,
  value: Target[Key],
) => {
  if (target[key] !== value) target[key] = value;
};

/**
 * `<kind-tool>` fills in its trigger and content when it has no children, and an empty `<kind-tool-input>` or
 * `<kind-tool-output>` with its heading, copy button and code block. Set `call` as a property. It writes its title,
 * approval and error into those parts while they're empty, and its values into the code blocks and Markdown view.
 */
export function defineTool(): void {
  if (customElements.get("kind-tool")) return;
  defineCodeBlock();
  defineMarkdown();
  createParts(toolPrimitive, {
    root: {
      tag: "kind-tool",
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
          const state = instance.get() as ToolState;
          const { highlight } = state;
          fill(el.querySelector("kind-tool-title"), state.title);
          fill(el.querySelector("kind-tool-approval"), state.approvalLabel ?? "");
          fill(el.querySelector("kind-tool-error"), state.errorMessage);
          const input = fillParts(el.querySelector("kind-tool-input"), INPUT_PARTS);
          const inputCode = input?.querySelector<KindCodeBlockElement>(":scope > kind-code-block");
          label(input, inputCode, state.inputLabel);
          if (inputCode) {
            write(inputCode, "code", state.input);
            write(inputCode, "streaming", state.inputStreaming);
            write(inputCode, "highlight", highlight);
          }
          const output = fillParts(el.querySelector("kind-tool-output"), OUTPUT_PARTS);
          const code = output?.querySelector<KindCodeBlockElement>(":scope > kind-code-block");
          label(output, code, state.outputLabel);
          if (code) {
            write(code, "hidden", state.output !== "code");
            if (state.output === "code") {
              write(code, "code", state.outputText);
              write(code, "streaming", state.outputPreliminary);
              write(code, "highlight", highlight);
            }
          }
          const markdown = output?.querySelector<KindMarkdownElement>(":scope > kind-markdown");
          if (markdown) {
            write(markdown, "hidden", state.output !== "markdown");
            if (state.output === "markdown") {
              write(markdown, "source", state.outputText);
              write(markdown, "streaming", state.outputPreliminary);
              write(markdown, "highlight", highlight);
            }
          }
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        const arrivals = new MutationObserver((records) => {
          // The lines and blocks the code blocks and Markdown view render aren't parts.
          const arrived = records.some(
            (record) =>
              !(
                record.target instanceof Element && record.target.closest("kind-code-block, kind-markdown")
              ) && [...record.addedNodes].some((node) => node instanceof Element),
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
    trigger: { tag: "kind-tool-trigger", target: wrappedButton, display: "contents" },
    icon: "kind-tool-icon",
    title: "kind-tool-title",
    approval: "kind-tool-approval",
    content: "kind-tool-content",
    input: "kind-tool-input",
    "input-copy": { tag: "kind-tool-input-copy", target: wrappedButton, display: "contents" },
    output: "kind-tool-output",
    "output-copy": { tag: "kind-tool-output-copy", target: wrappedButton, display: "contents" },
    error: "kind-tool-error",
  });
}

export type KindToolEvents = { openchange: UiChangeEvent<boolean, StepOpenChangeReason> };

export interface KindToolElement
  extends UiElement<KindToolEvents>,
    AttributeProperties<typeof toolPrimitive, "api" | "open" | "call" | "error" | "highlight"> {
  open: boolean;
  call?: ToolOptions["call"];
  error?: ToolOptions["error"];
  highlight?: ToolOptions["highlight"];
  api: Pick<ToolApi, "isOpen" | "setOpen" | "expand" | "collapse" | "toggle">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-tool": KindToolElement;
    "kind-tool-trigger": HTMLElement;
    "kind-tool-icon": HTMLElement;
    "kind-tool-title": HTMLElement;
    "kind-tool-approval": HTMLElement;
    "kind-tool-content": HTMLElement;
    "kind-tool-input": HTMLElement;
    "kind-tool-input-copy": HTMLElement;
    "kind-tool-output": HTMLElement;
    "kind-tool-output-copy": HTMLElement;
    "kind-tool-error": HTMLElement;
  }
}
