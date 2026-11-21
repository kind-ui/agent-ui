import {
  type Highlight,
  type MarkdownBlock,
  type MdNode,
  markdownViewPrimitive,
} from "@kind-ui/agent-ui/core";
import { type ComponentProps, Dynamic, type JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { createMemo, For, untrack } from "solid-js";
import { CodeBlock } from "./code-block.js";
import { MarkdownTable } from "./markdown-table.js";

const parts = createParts(markdownViewPrimitive, { root: "div" });

type Context = { readonly highlight: Highlight | undefined; readonly streaming: boolean };
type Parent = { children: MdNode[] };
type Align = Extract<MdNode, { type: "table" }>["align"];
type Of<T extends MdNode["type"]> = MdNode & { type: T };

const plain: Context = { highlight: undefined, streaming: false };

// Nodes have no identity but their place in a parsed block, so they're keyed by place: a streamed token updates
// the text it lands in, and a node is built again only when its kind changes.
function Children(props: { node: Parent; context: Context }) {
  return (
    <For each={props.node.children} keyed={false}>
      {(child) => <Node node={child()} context={props.context} />}
    </For>
  );
}

function Row(props: { node: Parent; align: Align; header: boolean }) {
  return (
    <tr>
      <For each={props.node.children} keyed={false}>
        {(cell, index) => (
          <Dynamic component={props.header ? "th" : "td"} data-align={props.align[index] ?? undefined}>
            {cell().type === "tableCell" ? <Children node={cell() as Parent} context={plain} /> : null}
          </Dynamic>
        )}
      </For>
    </tr>
  );
}

function kindOf(node: MdNode): string {
  switch (node.type) {
    case "link":
    case "image":
      return `${node.type}:${node.url === null}`;
    case "list":
      return `list:${node.ordered}`;
    case "listItem":
      return `listItem:${node.checked === undefined}`;
    default:
      return node.type;
  }
}

function Node(props: { node: MdNode; context: Context }) {
  const kind = createMemo(() => kindOf(props.node));
  // Tracks the kind alone: a node that changes kind is built again, one that keeps it updates in place.
  const element = createMemo(() => {
    const current = kind();
    return untrack(() => view(current, props));
  });
  return <>{element()}</>;
}

function view(kind: string, props: { node: MdNode; context: Context }): JSX.Element {
  const node = <T extends MdNode["type"]>() => props.node as Of<T>;
  const children = () => <Children node={props.node as Parent} context={props.context} />;
  switch (kind) {
    case "text":
      return <>{node<"text">().value}</>;
    case "paragraph":
      return <p>{children()}</p>;
    case "heading":
      return <Dynamic component={`h${node<"heading">().depth}`}>{children()}</Dynamic>;
    case "emphasis":
      return <em>{children()}</em>;
    case "strong":
      return <strong>{children()}</strong>;
    case "delete":
      return <del>{children()}</del>;
    case "blockquote":
      return <blockquote>{children()}</blockquote>;
    case "inlineCode":
      return <code>{node<"inlineCode">().value}</code>;
    case "code":
      return (
        <CodeBlock
          aria-label="Code"
          code={node<"code">().value}
          language={node<"code">().lang}
          highlight={props.context.highlight}
          streaming={props.context.streaming}
        />
      );
    case "link:true":
      return <span>{children()}</span>;
    case "link:false":
      return <a href={node<"link">().url ?? undefined}>{children()}</a>;
    case "image:true":
      return <span>{node<"image">().alt}</span>;
    case "image:false":
      return <img src={node<"image">().url ?? undefined} alt={node<"image">().alt} />;
    case "list:true":
      return <ol start={node<"list">().start}>{children()}</ol>;
    case "list:false":
      return <ul>{children()}</ul>;
    case "listItem:true":
      return <li>{children()}</li>;
    case "listItem:false":
      return (
        <li data-task="">
          <input type="checkbox" checked={node<"listItem">().checked} disabled readonly />
          {children()}
        </li>
      );
    case "table":
      return (
        <MarkdownTable
          aria-label="Table"
          style={{ "--kind-markdown-table-columns": node<"table">().align.length }}
        >
          <thead>
            {node<"table">().children[0] && (
              <Row node={node<"table">().children[0] as Parent} align={node<"table">().align} header />
            )}
          </thead>
          <tbody>
            <For each={node<"table">().children.slice(1)} keyed={false}>
              {(row) => <Row node={row() as Parent} align={node<"table">().align} header={false} />}
            </For>
          </tbody>
        </MarkdownTable>
      );
    case "thematicBreak":
      return <hr />;
    case "break":
      return <br />;
    default:
      return null;
  }
}

function Block(props: { block: MarkdownBlock; context: Context }) {
  return (
    <div data-block-key={props.block.key}>
      <Children node={props.block.node as Parent} context={props.context} />
    </div>
  );
}

export type MarkdownProps = Omit<ComponentProps<typeof parts.Root>, "children">;

/** Renders `source` as it streams in, with code blocks and tables. */
export function Markdown(props: MarkdownProps) {
  return (
    <parts.Root {...props}>
      {(state) => (
        // Keyed by place, not `block.key`, which changes with the streaming tail's text, so the tail updates in place.
        <For each={state.blocks} keyed={false}>
          {(block) => (
            <Block
              block={block()}
              context={{
                get highlight() {
                  return state.highlight;
                },
                get streaming() {
                  return state.streaming && !block().final;
                },
              }}
            />
          )}
        </For>
      )}
    </parts.Root>
  );
}
