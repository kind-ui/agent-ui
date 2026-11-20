import { matchRanges } from "@ui-sdk/core/text-match";
import { createMarkdownEngine, type MarkdownEngine, type MdNode } from "../markdown/index.js";

/** A match: the message at `index` in the searched list, from `start` to `end` of its `searchText`, like `slice`. */
export type ConversationSearchMatch = { index: number; start: number; end: number };

// Blocks, list items, table cells and line breaks read as separate lines, so a search never matches across them.
const BREAK = "\n";

const BLOCKS = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "code",
  "list",
  "listItem",
  "table",
  "tableRow",
  "tableCell",
  "thematicBreak",
]);

function textOf(node: MdNode): string {
  switch (node.type) {
    case "text":
    case "inlineCode":
    case "code":
      return node.value;
    // An image with a safe URL renders an `img`, whose alt is no text node; one without renders its alt as text.
    case "image":
      return node.url === null ? node.alt : "";
    case "break":
      return BREAK;
    case "thematicBreak":
      return "";
    default:
      return node.children
        .map(textOf)
        .join(node.children.some((child) => BLOCKS.has(child.type)) ? BREAK : "");
  }
}

/**
 * The text Markdown renders, as the Markdown view lays it out: text and inline code as they read, a line break
 * between blocks, list items and table cells, an image's alt left out (it renders no text), and a code block's code
 * without its header. Pass the `engine` that read the message's earlier text, so a streamed message parses only the
 * blocks that changed.
 */
export function searchText(markdown: string, engine: MarkdownEngine = createMarkdownEngine()): string {
  return engine
    .set(markdown, false)
    .map((block) => textOf(block.node))
    .join(BREAK);
}

/** Every place `query` appears in `text`, in order, with case and accents folded as UI SDK's `matchRanges` folds them. */
export function rangesOf(text: string, query: string): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  if (!query.trim()) return ranges;
  for (let from = 0; from < text.length; ) {
    const [range] = matchRanges(from === 0 ? text : text.slice(from), query, "contains");
    if (!range) break;
    ranges.push({ start: from + range.start, end: from + range.end });
    from += range.end;
  }
  return ranges;
}

/** Every match of `query` in each text, in order. A blank query matches nothing. */
export function findMatches(texts: readonly string[], query: string): ConversationSearchMatch[] {
  return texts.flatMap((text, index) => rangesOf(text, query).map((range) => ({ index, ...range })));
}
