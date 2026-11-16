import {
  type Highlight,
  type MarkdownBlock,
  type MarkdownOptions,
  type MarkdownState,
  type MdNode,
  markdownViewPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";
import type { AttributeProperties, UiElement } from "@ui-sdk/web/events";
import { defineCodeBlock } from "./code-block.js";
import { defineMarkdownTable } from "./markdown-table.js";

type Context = { highlight: Highlight | undefined; streaming: boolean; cell: "th" | "td" };

const tags: Partial<Record<MdNode["type"], string>> = {
  paragraph: "p",
  emphasis: "em",
  strong: "strong",
  delete: "del",
  blockquote: "blockquote",
  listItem: "li",
  inlineCode: "code",
  code: "kind-code-block",
  table: "kind-markdown-table",
  tableRow: "tr",
  thematicBreak: "hr",
  break: "br",
};

function tagOf(node: MdNode, context: Context): string | undefined {
  switch (node.type) {
    case "heading":
      return `h${node.depth}`;
    case "list":
      return node.ordered ? "ol" : "ul";
    case "link":
      return node.url === null ? "span" : "a";
    case "image":
      return node.url === null ? "span" : "img";
    case "tableCell":
      return context.cell;
    default:
      return tags[node.type];
  }
}

const attribute = (el: Element, name: string, value: string | undefined) => {
  if (value === undefined) el.removeAttribute(name);
  else if (el.getAttribute(name) !== value) el.setAttribute(name, value);
};

function patchChildren(parent: Element, nodes: MdNode[], context: Context, offset = 0): void {
  nodes.forEach((node, index) => {
    const current = parent.childNodes[offset + index];
    if (current && patch(current, node, context)) return;
    const next = create(node, context);
    if (current) current.replaceWith(next);
    else parent.append(next);
  });
  while (parent.childNodes.length > offset + nodes.length) parent.lastChild?.remove();
}

function patch(dom: ChildNode, node: MdNode, context: Context): boolean {
  if (node.type === "text") {
    if (!(dom instanceof Text)) return false;
    if (dom.data !== node.value) dom.data = node.value;
    return true;
  }
  if (!(dom instanceof Element) || dom.localName !== tagOf(node, context)) return false;
  update(dom, node, context);
  return true;
}

function create(node: MdNode, context: Context): ChildNode {
  if (node.type === "text") return document.createTextNode(node.value);
  const el = document.createElement(tagOf(node, context) as string);
  update(el, node, context);
  return el;
}

function update(el: Element, node: MdNode, context: Context): void {
  switch (node.type) {
    case "inlineCode":
      if (el.textContent !== node.value) el.textContent = node.value;
      return;
    case "code": {
      attribute(el, "aria-label", "Code");
      attribute(el, "code", node.value);
      attribute(el, "language", node.lang);
      attribute(el, "streaming", context.streaming ? "" : undefined);
      const block = el as HTMLElement & { highlight?: Highlight };
      if (block.highlight !== context.highlight) block.highlight = context.highlight;
      return;
    }
    case "link":
      if (node.url !== null) attribute(el, "href", node.url);
      patchChildren(el, node.children, context);
      return;
    case "image":
      if (node.url === null) el.textContent = node.alt;
      else {
        attribute(el, "src", node.url);
        attribute(el, "alt", node.alt);
      }
      return;
    case "list":
      attribute(el, "start", node.ordered && node.start !== undefined ? String(node.start) : undefined);
      patchChildren(el, node.children, context);
      return;
    case "listItem": {
      const task = node.checked !== undefined;
      let box = el.firstChild instanceof HTMLInputElement ? el.firstChild : undefined;
      if (task && !box) {
        box = Object.assign(document.createElement("input"), { type: "checkbox", disabled: true });
        el.prepend(box);
      } else if (!task && box) {
        box.remove();
        box = undefined;
      }
      if (box) box.checked = node.checked === true;
      attribute(el, "data-task", task ? "" : undefined);
      patchChildren(el, node.children, context, box ? 1 : 0);
      return;
    }
    case "table": {
      attribute(el, "aria-label", "Table");
      (el as HTMLElement).style.setProperty("--kind-markdown-table-columns", String(node.align.length));
      let table = el.querySelector("table");
      if (!table) {
        table = el.appendChild(document.createElement("table"));
        table.append(document.createElement("thead"), document.createElement("tbody"));
      }
      const [head, ...body] = node.children;
      patchChildren(table.tHead as HTMLElement, head ? [head] : [], { ...context, cell: "th" });
      patchChildren(table.tBodies[0] as HTMLElement, body, { ...context, cell: "td" });
      for (const row of table.rows) {
        for (const [index, cell] of [...row.cells].entries())
          attribute(cell, "data-align", node.align[index] ?? undefined);
      }
      return;
    }
    case "text":
    case "thematicBreak":
    case "break":
      return;
    default:
      patchChildren(el, node.children, context);
  }
}

/** `<kind-markdown source="…" streaming>` renders its blocks into itself. Set `highlight` as a property. */
export function defineMarkdown(): void {
  if (customElements.get("kind-markdown")) return;
  defineCodeBlock();
  defineMarkdownTable();
  createParts(markdownViewPrimitive, {
    root: {
      tag: "kind-markdown",
      render: (el, instance) => {
        // Content written before upgrade, like a fallback, makes way for the blocks.
        for (const child of [...el.childNodes]) {
          if (!(child instanceof HTMLElement && child.dataset.blockKey)) child.remove();
        }
        let drawn: MarkdownBlock[] = [];
        const draw = () => {
          const { blocks, highlight, streaming } = instance.get() as MarkdownState;
          if (blocks === drawn) return;
          // A final block is the same object on every append, so only the blocks after it are patched.
          blocks.forEach((block, index) => {
            if (block === drawn[index]) return;
            const wrapper = el.children[index] ?? el.appendChild(document.createElement("div"));
            attribute(wrapper, "data-block-key", block.key);
            const context = { highlight, streaming: streaming && !block.final, cell: "td" } as const;
            patchChildren(wrapper, (block.node as { children: MdNode[] }).children, context);
          });
          while (el.children.length > blocks.length) el.lastElementChild?.remove();
          drawn = blocks;
        };
        draw();
        return instance.subscribe(draw);
      },
    },
  });
}

export interface KindMarkdownElement
  extends UiElement<Record<never, never>>,
    AttributeProperties<typeof markdownViewPrimitive, "engine" | "highlight"> {
  highlight?: MarkdownOptions["highlight"];
  engine?: MarkdownOptions["engine"];
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-markdown": KindMarkdownElement;
  }
}
