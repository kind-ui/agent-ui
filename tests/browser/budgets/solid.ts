import type { Budgets } from "./react.js";

// Solid's count budgets (plan D12), measured on Linux CI. Solid has no component re-render, so its `renders`
// are 0; `notified` is counted on every layer. `budgets.spec.ts` skips a case with no entry here.
export const budgets: Partial<Budgets> = {
  conversationStream: { writes: 1, renders: 0, notified: 0 },
  conversationFollow: { layoutReads: 12 },
  markdownStream: { parses: 1, writes: 4, renders: 0, notified: 3 },
  remount: { nodes: 0, listeners: 0 },

  // 5 writes, or 13 when the new chip's first measure lands inside the counted window, as it does under load.
  contextChip: { writes: 13, renders: 0, notified: 0, layoutReads: 0 },

  toolStream: { writes: 6, renders: 0, notified: 3 },

  terminalChunk: { writes: 4, renders: 0, notified: 0, layoutReads: 15 },
  terminalLine: { writes: 4, renders: 0, notified: 0, layoutReads: 18 },
  transcriptWord: { writes: 4, renders: 0, notified: 2, layoutReads: 4 },
  transcriptSegment: { writes: 9, renders: 0, notified: 4, layoutReads: 8 },
  transcriptSearch: { writes: 66, renders: 0, notified: 0, layoutReads: 2 },

  // Thread List: pinning moves every row in view (29 writes at 10 threads, 48 at 1,000, where the column is full);
  // appending writes only the new rows in view (24 at 10, 1 at 1,000). No row renders again, nor is any part notified.
  threadSelect: { writes: 4, renders: 0, notified: 0, layoutReads: 0 },
  threadPin: { writes: 48, renders: 0, notified: 0, layoutReads: 2 },
  threadAppend: { writes: 24, renders: 0, notified: 0, layoutReads: 2 },

  // At 100 messages the writes are the marks a character moves; at 5,000 every step holds a match, so only the count
  // changes: the rows in view keep their nodes, since the highlights are painted, not rendered.
  conversationSearchType: { writes: 115, renders: 0, notified: 0, layoutReads: 4 },
};
