import {
  type Highlight,
  type MarkdownBlock,
  type MdNode,
  markdownViewPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h, inject, type PropType, provide, type VNodeChild } from "vue";
import { CodeBlock } from "./code-block.js";
import { MarkdownTable } from "./markdown-table.js";

const parts = createParts(markdownViewPrimitive, { root: "div" });

type Context = { highlight: Highlight | undefined; streaming: boolean };
type Row = { children: MdNode[] };
type Align = Extract<MdNode, { type: "table" }>["align"];

// Nodes have no identity but their place in a parsed block, so they're keyed by index.
const children = (node: { children: MdNode[] }, context: Context): VNodeChild[] =>
  node.children.map((child, index) => render(child, index, context));

const row = (node: Row, align: Align, cell: "th" | "td", key: number) =>
  h(
    "tr",
    { key },
    node.children.map((child, index) =>
      h(
        cell,
        { key: index, "data-align": align[index] ?? undefined },
        child.type === "tableCell" ? children(child, { highlight: undefined, streaming: false }) : undefined,
      ),
    ),
  );

function render(node: MdNode, key: number, context: Context): VNodeChild {
  switch (node.type) {
    case "text":
      return node.value;
    case "paragraph":
      return h("p", { key }, children(node, context));
    case "heading":
      return h(`h${node.depth}`, { key }, children(node, context));
    case "emphasis":
      return h("em", { key }, children(node, context));
    case "strong":
      return h("strong", { key }, children(node, context));
    case "delete":
      return h("del", { key }, children(node, context));
    case "blockquote":
      return h("blockquote", { key }, children(node, context));
    case "inlineCode":
      return h("code", { key }, node.value);
    case "code":
      return h(CodeBlock, {
        key,
        "aria-label": "Code",
        code: node.value,
        language: node.lang,
        highlight: context.highlight,
        streaming: context.streaming,
      });
    case "link":
      return node.url === null
        ? h("span", { key }, children(node, context))
        : h("a", { key, href: node.url }, children(node, context));
    case "image":
      return node.url === null
        ? h("span", { key }, node.alt)
        : h("img", { key, src: node.url, alt: node.alt });
    case "list":
      return node.ordered
        ? h("ol", { key, start: node.start }, children(node, context))
        : h("ul", { key }, children(node, context));
    case "listItem":
      return h("li", { key, "data-task": node.checked === undefined ? undefined : "" }, [
        node.checked === undefined
          ? null
          : h("input", { type: "checkbox", checked: node.checked, disabled: true, readonly: true }),
        ...children(node, context),
      ]);
    case "table": {
      const [head, ...body] = node.children as Row[];
      return h(
        MarkdownTable,
        { key, "aria-label": "Table", style: { "--kind-markdown-table-columns": node.align.length } },
        () => [
          h("thead", head ? [row(head, node.align, "th", 0)] : []),
          h(
            "tbody",
            body.map((bodyRow, index) => row(bodyRow, node.align, "td", index)),
          ),
        ],
      );
    }
    case "thematicBreak":
      return h("hr", { key });
    case "break":
      return h("br", { key });
    default:
      return null;
  }
}

type HighlightRef = { current: Highlight | undefined };
const HIGHLIGHT = Symbol("kind-markdown-highlight");

// A final block is the same object on every append, so it never renders again. `highlight` comes through a holder,
// not a prop: code blocks read it when they ask for tokens, so a new function each render doesn't render them again.
const Block = defineComponent({
  name: "MarkdownBlock",
  props: {
    block: { type: Object as PropType<MarkdownBlock>, required: true },
    streaming: { type: Boolean, required: true },
  },
  setup(props) {
    const highlight = inject(HIGHLIGHT) as HighlightRef;
    return () =>
      h(
        "div",
        { "data-block-key": props.block.key },
        children(props.block.node as { children: MdNode[] }, {
          highlight: highlight.current,
          streaming: props.streaming,
        }),
      );
  },
});

type MarkdownSlotState = { blocks: MarkdownBlock[]; highlight: Highlight | undefined; streaming: boolean };

/** Renders `source` as it streams in, with code blocks and tables. */
export const Markdown = defineComponent({
  name: "Markdown",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    const highlight: HighlightRef = { current: undefined };
    provide(HIGHLIGHT, highlight);
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default: ({ state }: { state: MarkdownSlotState }) => {
          highlight.current = state.highlight;
          // Keyed by place, not `block.key`, which changes with the streaming tail's text, so the tail updates in place.
          return state.blocks.map((block, index) =>
            h(Block, { key: index, block, streaming: state.streaming && !block.final }),
          );
        },
      });
  },
});
