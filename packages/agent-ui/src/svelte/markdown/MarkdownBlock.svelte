<!--
  One parsed block. Nodes have no identity but their place in it, so they're drawn by index. A final block is the
  same object on every append, so Svelte never draws it again.
-->
<script lang="ts">
  import type { Highlight, MarkdownBlock, MdNode } from "@kind-ui/agent-ui/core";
  import { CodeBlock } from "../code-block/index.js";
  import { MarkdownTable } from "../markdown-table/index.js";

  type Row = { children: MdNode[] };
  type Align = Extract<MdNode, { type: "table" }>["align"];

  let {
    block,
    highlight,
    streaming,
  }: { block: MarkdownBlock; highlight: Highlight | undefined; streaming: boolean } = $props();

  const rows = (node: { children: MdNode[] }) => node.children as Row[];
</script>

{#snippet nodes(list: MdNode[], highlight: Highlight | undefined, streaming: boolean)}
  {#each list as node}{@render one(node, highlight, streaming)}{/each}
{/snippet}

{#snippet row(cells: MdNode[], align: Align, head: boolean)}
  <tr
    >{#each cells as cell, index}{#if head}<th data-align={align[index] ?? undefined}
          >{#if cell.type === "tableCell"}{@render nodes(cell.children, undefined, false)}{/if}</th
        >{:else}<td data-align={align[index] ?? undefined}
          >{#if cell.type === "tableCell"}{@render nodes(cell.children, undefined, false)}{/if}</td
        >{/if}{/each}</tr
  >
{/snippet}

{#snippet one(node: MdNode, highlight: Highlight | undefined, streaming: boolean)}
  {#if node.type === "text"}{node.value}{:else if node.type === "paragraph"}<p
      >{@render nodes(node.children, highlight, streaming)}</p
    >{:else if node.type === "heading"}<svelte:element this={`h${node.depth}`}
      >{@render nodes(node.children, highlight, streaming)}</svelte:element
    >{:else if node.type === "emphasis"}<em>{@render nodes(node.children, highlight, streaming)}</em
    >{:else if node.type === "strong"}<strong>{@render nodes(node.children, highlight, streaming)}</strong
    >{:else if node.type === "delete"}<del>{@render nodes(node.children, highlight, streaming)}</del
    >{:else if node.type === "blockquote"}<blockquote
      >{@render nodes(node.children, highlight, streaming)}</blockquote
    >{:else if node.type === "inlineCode"}<code>{node.value}</code>{:else if node.type === "code"}<CodeBlock
      aria-label="Code"
      code={node.value}
      language={node.lang}
      {highlight}
      {streaming}
    />{:else if node.type === "link"}{#if node.url === null}<span
        >{@render nodes(node.children, highlight, streaming)}</span
      >{:else}<a href={node.url}>{@render nodes(node.children, highlight, streaming)}</a
      >{/if}{:else if node.type === "image"}{#if node.url === null}<span>{node.alt}</span>{:else}<img
        src={node.url}
        alt={node.alt}
      />{/if}{:else if node.type === "list"}{#if node.ordered}<ol start={node.start}
        >{@render nodes(node.children, highlight, streaming)}</ol
      >{:else}<ul>{@render nodes(node.children, highlight, streaming)}</ul>{/if}{:else if node.type === "listItem"}<li
      data-task={node.checked === undefined ? undefined : ""}
      >{#if node.checked !== undefined}<input
          type="checkbox"
          checked={node.checked}
          disabled
          readonly
        />{/if}{@render nodes(node.children, highlight, streaming)}</li
    >{:else if node.type === "table"}{@const [head, ...body] = rows(node)}<MarkdownTable
      aria-label="Table"
      style="--kind-markdown-table-columns: {node.align.length}"
      ><thead>{#if head}{@render row(head.children, node.align, true)}{/if}</thead><tbody
        >{#each body as bodyRow}{@render row(bodyRow.children, node.align, false)}{/each}</tbody
      ></MarkdownTable
    >{:else if node.type === "thematicBreak"}<hr />{:else if node.type === "break"}<br />{/if}
{/snippet}

<div data-block-key={block.key}>{@render nodes((block.node as Row).children, highlight, streaming)}</div>
