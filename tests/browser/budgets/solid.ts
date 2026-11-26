import type { Budgets } from "./react.js";

// Solid's count budgets (plan D12), measured on Linux CI. Solid has no component re-render, so its `renders`
// are 0; `notified` is counted on every layer. `budgets.spec.ts` skips a case with no entry here.
export const budgets: Partial<Budgets> = {
  conversationStream: { writes: 1, renders: 0, notified: 0 },
  // UI SDK's stick to bottom runs its pass on both the content's MutationObserver and its ResizeObserver
  // (`0.1.0-beta.17`), as on React.
  conversationFollow: { layoutReads: 18 },
  markdownStream: { parses: 1, writes: 4, renders: 0, notified: 3 },
  remount: { nodes: 0, listeners: 0 },

  // 5 writes, or 13 when the new chip's first measure lands inside the counted window, as it does under load.
  contextChip: { writes: 13, renders: 0, notified: 0, layoutReads: 0 },

  toolStream: { writes: 6, renders: 0, notified: 3 },

  // A chunk that wraps the last line runs the stick to bottom's pass on a mutation and a resize, and the scroll after
  // (8 and 20 reads, 28 when both land in one window, as React's budget allows).
  terminalChunk: { writes: 4, renders: 0, notified: 0, layoutReads: 28 },
  // The virtualizer adds a row and drops one, and the stick to bottom runs its pass on each mutation and each resize.
  terminalLine: { writes: 4, renders: 0, notified: 0, layoutReads: 29 },
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
  // Scrolling to the current match releases the stick to bottom, which finds the row in view to keep still (10 reads).
  conversationSearchType: { writes: 115, renders: 0, notified: 0, layoutReads: 14 },

  // Wave 7 markers (AGENTS.md "Wave 7 shared-file markers"): each task adds its budgets right below its own line.

  // wave-7-task-2: Composer steering and Queue's Send now

  // wave-7-task-3: Message delivery mark and retrying

  // wave-7-task-4: Terminal approval and Confirmation's Always allow

  // wave-7-task-5: Tool retry and retrying

  // wave-7-task-6: Diff

  // wave-7-task-7: Step Group

  // wave-7-task-8: Handoff

  // wave-7-task-10: Trace

  traceSelect: { writes: 17, renders: 0, notified: 0, layoutReads: 2 },
  traceExpand: { writes: 52, renders: 0, notified: 4, layoutReads: 2 },

  // wave-7-task-11: Run Timeline

  // wave-7-task-12: Job Progress

  // wave-7-task-13: Schedule Card

  // wave-7-task-14: Agent Card

  // wave-7-task-15: Usage Meter and Context Meter's breakdown

  // wave-7-task-16: Quota Notice

  // wave-7-task-17: Activity Graph

  // wave-7-task-18: Thread List inbox

  // wave-7-task-19: Flow Graph
};
