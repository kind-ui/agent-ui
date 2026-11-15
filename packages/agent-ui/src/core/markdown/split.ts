// Adapted from Apache-2.0 code; see THIRD_PARTY_NOTICES.md. No HTML or math merging:
// raw HTML renders as text and math is not supported.
import { Lexer } from "marked";

const footnotePattern = /\[\^[\w-]{1,200}\]/;
const linkDefinitionPattern = /^ {0,3}\[[^\]]+\]:/m;

export interface Split {
  input: string;
  blocks: string[];
  verifiedCount: number;
  verifiedLength: number;
}

// Returns null when the document has link definitions, which must share one parse with their references.
function lexBlocks(markdown: string): string[] | null {
  const lexer = new Lexer({ gfm: true });
  const tokens = lexer.blockTokens(markdown);
  if (Object.keys(lexer.tokens.links).length > 0) return null;
  const blocks: string[] = [];
  for (const token of tokens) {
    if (token.type === "space" && blocks.length > 0) blocks[blocks.length - 1] += token.raw;
    else blocks.push(token.raw);
  }
  return blocks;
}

// Appended text can still change the last two blocks: a lone "#" ends the paragraph above it, "2." extends a list.
export function countFinalBlocks(blocks: string[]): number {
  for (let i = blocks.length - 3; i >= 0; i -= 1) {
    if (blocks[i]?.endsWith("\n\n")) return i + 1;
  }
  return 0;
}

function reuse(previous: Split, input: string): Split | null {
  if (input.length <= previous.input.length || !input.startsWith(previous.input)) return null;
  const finalCount = countFinalBlocks(previous.blocks);
  if (finalCount === 0) return null;
  let { verifiedCount, verifiedLength } = previous;
  // A setext underline can pull blocks together, so the final region may have shrunk.
  if (verifiedCount > finalCount) {
    verifiedCount = 0;
    verifiedLength = 0;
  }
  // marked trims some raws (a bare "- " lexes to "-\n"), so check offsets before trusting them.
  while (verifiedCount < finalCount) {
    const block = previous.blocks[verifiedCount];
    if (block === undefined || !input.startsWith(block, verifiedLength)) return null;
    verifiedLength += block.length;
    verifiedCount += 1;
  }
  const tail = lexBlocks(input.slice(verifiedLength));
  if (!tail) return null;
  return { input, blocks: previous.blocks.slice(0, finalCount).concat(tail), verifiedCount, verifiedLength };
}

export function splitBlocks(source: string, previous?: Split): Split {
  const input = source.replace(/\r\n?/g, "\n");
  if (previous?.input === input) return previous;
  const single: Split = { input, blocks: input ? [input] : [], verifiedCount: 0, verifiedLength: 0 };
  if (footnotePattern.test(input) || linkDefinitionPattern.test(input)) return single;
  const reused = previous ? reuse(previous, input) : null;
  if (reused) return reused;
  const blocks = lexBlocks(input);
  return blocks ? { input, blocks, verifiedCount: 0, verifiedLength: 0 } : single;
}
