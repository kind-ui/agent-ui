import type { Budgets } from "./react.js";

// Vue's count budgets (plan D12), measured on Linux CI. Its `renders` are component updates through Vue's
// DevTools hook. `budgets.spec.ts` skips a
// case with no entry here.
export const budgets: Partial<Budgets> = {
  // A streamed token updates only the last row's components, as many at 10 rows as at 500.
  conversationStream: { writes: 1, renders: 11, notified: 0 },
  // UI SDK's stick to bottom runs its pass on both the content's MutationObserver and its ResizeObserver
  // (`0.1.0-beta.17`), as on React.
  conversationFollow: { layoutReads: 18 },
  markdownStream: { parses: 1, writes: 2, renders: 5, notified: 0 },
  remount: { nodes: 0, listeners: 0 },

  contextChip: { writes: 5, renders: 9, notified: 0, layoutReads: 0 },

  // Streamed input renders one tool's parts, each default part a wrapper and its part, at 10 tools as at 500.
  toolStream: { writes: 6, renders: 30, notified: 3 },

  // A chunk updates the last line's two components; a chunk that wraps it shifts the window at 1,000 lines, which
  // renders the output part twice, never the other lines, and runs the stick to bottom's pass on a mutation and a
  // resize, and the scroll after.
  terminalChunk: { writes: 4, renders: 10, notified: 0, layoutReads: 28 },
  // A new line renders the output part and the line that was last, and mounts the new one, at 10 lines as at 1,000;
  // the virtualizer adds a row and drops one, and the stick to bottom runs its pass on each mutation and each resize.
  terminalLine: { writes: 4, renders: 11, notified: 0, layoutReads: 29 },
  // Playback writes the word's mark straight to the element, so no segment or word renders.
  transcriptWord: { writes: 2, renders: 4, notified: 2, layoutReads: 4 },
  // Following the next segment renders the list and mounts the segments it scrolls into view.
  transcriptSegment: { writes: 7, renders: 24, notified: 4, layoutReads: 8 },
  // A search renders the segments in view whose marks changed, at 100 segments as at 5,000.
  transcriptSearch: { writes: 44, renders: 48, notified: 0, layoutReads: 2 },

  // Rows are their own components with stable slots, so selecting, pinning and loading more render only the rows they
  // change and those that come into view, at 10 threads as at 1,000.
  threadSelect: { writes: 4, renders: 12, notified: 0, layoutReads: 0 },
  threadPin: { writes: 46, renders: 52, notified: 0, layoutReads: 2 },
  threadAppend: { writes: 24, renders: 50, notified: 0, layoutReads: 2 },
  // A search renders the rows whose marks changed; at 5,000 messages the mark track is already full. Scrolling to the
  // current match releases the stick to bottom, which finds the row in view to keep still (10 reads).
  conversationSearchType: { writes: 51, renders: 24, notified: 0, layoutReads: 14 },

  // Wave 7 markers (AGENTS.md "Wave 7 shared-file markers"): each task adds its budgets right below its own line.

  // wave-7-task-2: Composer steering and Queue's Send now

  // wave-7-task-3: Message delivery mark and retrying

  // wave-7-task-4: Terminal approval and Confirmation's Always allow

  // wave-7-task-5: Tool retry and retrying

  // wave-7-task-6: Diff

  // wave-7-task-7: Step Group

  // wave-7-task-8: Handoff

  // wave-7-task-10: Trace

  traceSelect: { writes: 17, renders: 36, notified: 0, layoutReads: 2 },
  traceExpand: { writes: 40, renders: 115, notified: 4, layoutReads: 2 },

  // wave-7-task-11: Run Timeline

  // wave-7-task-12: Job Progress

  // wave-7-task-13: Schedule Card

  // wave-7-task-14: Agent Card

  // wave-7-task-15: Usage Meter and Context Meter's breakdown

  // wave-7-task-16: Quota Notice

  // wave-7-task-17: Activity Graph

  activityMove: { writes: 2, renders: 2, notified: 0, layoutReads: 1 },

  // wave-7-task-18: Thread List inbox

  // One thread's progress renders its row's link and the description and progress parts in it, at 10 threads as at
  // 1,000.
  threadProgress: { writes: 5, renders: 15, notified: 0, layoutReads: 2 },

  // wave-7-task-19: Flow Graph
};
