import type { CodeBlockApi, Highlight, MarkdownEngine } from "@kind-ui/agent-ui/core";
import { defineCodeBlock } from "../../../../src/web/code-block.js";
import { defineMarkdown } from "../../../../src/web/markdown.js";
import {
  answer,
  deferredHighlight,
  longAnswer,
  recordedEngine,
  unsafe,
  wideTable,
} from "../../shared/markdown.js";

const frame = "m-4 w-[36rem] text-[var(--kind-fg)]";

type MarkdownElement = HTMLElement & { engine?: MarkdownEngine };
type CodeElement = HTMLElement & { highlight?: Highlight; api: CodeBlockApi };

function markdown(root: HTMLElement, source: string, className = frame): MarkdownElement {
  defineMarkdown();
  const el = document.createElement("kind-markdown") as MarkdownElement;
  el.className = className;
  el.setAttribute("source", source);
  root.append(el);
  return el;
}

function code(root: HTMLElement, attributes: string): CodeElement {
  defineCodeBlock();
  root.innerHTML = `<kind-code-block aria-label="Code" class="${frame}" language="ts" ${attributes}></kind-code-block>`;
  return root.querySelector("kind-code-block") as CodeElement;
}

export const cases = {
  stream: (root: HTMLElement) => {
    defineMarkdown();
    const { engine, records } = recordedEngine();
    const el = document.createElement("kind-markdown") as MarkdownElement;
    el.className = frame;
    el.engine = engine;
    el.setAttribute("streaming", "");
    root.append(el);
    let source = "";
    Object.assign(window, {
      kindMarkdown: {
        source: longAnswer,
        records,
        append: (chunk: string) => {
          source += chunk;
          el.setAttribute("source", source);
        },
        finish: () => el.removeAttribute("streaming"),
      },
    });
  },
  answer: (root: HTMLElement) => void markdown(root, answer),
  unsafe: (root: HTMLElement) => void markdown(root, unsafe),
  table: (root: HTMLElement) => void markdown(root, wideTable, "m-4 w-80"),
  highlight: (root: HTMLElement) => {
    const { highlight, requests } = deferredHighlight();
    const el = code(root, 'code="const a = 1;"');
    el.highlight = highlight;
    Object.assign(window, {
      kindCode: { requests, setCode: (next: string) => el.setAttribute("code", next) },
    });
  },
  "code-stream": (root: HTMLElement) => {
    const el = code(root, 'code="" streaming line-numbers');
    Object.assign(window, {
      kindCode: {
        append: (chunk: string) => el.setAttribute("code", (el.getAttribute("code") ?? "") + chunk),
      },
    });
  },
};
