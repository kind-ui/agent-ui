import type { Budgets } from "./react.js";

// Svelte's count budgets (plan D12), measured on Linux CI. Svelte has no component re-render, so its budgets
// are `writes`, `layoutReads` and `parses` only. `budgets.spec.ts` skips a case with no entry here.
export const budgets: Partial<Budgets> = {
  conversationStream: { writes: 1, renders: 0, notified: 1 },
  // UI SDK's stick to bottom runs its pass on both the content's MutationObserver and its ResizeObserver
  // (`0.1.0-beta.17`), as on React.
  conversationFollow: { layoutReads: 18 },
  remount: { nodes: 0, listeners: 0 },
  // A chunk rewrites the streaming block's last text node and its `data-block-key`.
  markdownStream: { parses: 1, writes: 2, renders: 0, notified: 1 },

  // Writes stay flat; UI SDK Svelte re-reads each chip's attributes on a store change (`notified`), which D12 doesn't
  // budget for Svelte, so it holds the count at 200 chips.
  contextChip: { writes: 13, renders: 0, notified: 412, layoutReads: 0 },

  // The first chunk also rewrites 11 unchanged `style` attributes on the Code Block's `pre` and scroll area parts:
  // `@ui-sdk/svelte` writes each part's merged inline style property by property and hands Svelte what the element
  // shows, which Svelte compares with the last style it wrote, not the element's. Later chunks write 1.
  toolStream: { writes: 17, renders: 0, notified: 16 },

  // The new line comes in and the first line in view leaves, each with its comment anchors; the virtualizer adds a row
  // and drops one, and the stick to bottom runs its pass on each mutation and each resize.
  terminalLine: { writes: 22, renders: 0, notified: 4, layoutReads: 29 },
  transcriptWord: { writes: 2, renders: 0, notified: 3, layoutReads: 4 },
  transcriptSegment: { writes: 24, renders: 0, notified: 20, layoutReads: 8 },
  transcriptSearch: { writes: 110, renders: 0, notified: 140, layoutReads: 2 },

  // Keyed rows: selecting touches only the two rows whose state changed, at 10 threads as at 1,000.
  threadSelect: { writes: 6, renders: 0, notified: 5, layoutReads: 0 },
  threadPin: { writes: 105, renders: 0, notified: 28, layoutReads: 2 },
  threadAppend: { writes: 105, renders: 0, notified: 46, layoutReads: 2 },
  // Each `@ui-sdk/svelte` part leaves block anchors (empty text and comment nodes) beside its element, which Svelte
  // removes one by one, so a mark leaving is about 9 mutation records where React's is 1: at 100 messages, about 34
  // marks leave per character. At 5,000 no mark moves, and Svelte writes 1.
  // Scrolling to the current match releases the stick to bottom, which finds the row in view to keep still (10 reads).
  conversationSearchType: { writes: 451, renders: 0, notified: 57, layoutReads: 14 },

  // The wrap and the scroll it causes, which removes the first line in view with its 8 anchors, land in one
  // measurement under load (AGENTS.md "Svelte conformance"); the stick to bottom runs its pass on the wrap's mutation
  // and resize too (28 reads when they share a window, as React's budget allows).
  terminalChunk: { writes: 13, renders: 0, notified: 2, layoutReads: 28 },

  // Wave 7 markers (AGENTS.md "Wave 7 shared-file markers"): each task adds its budgets right below its own line.

  // wave-7-task-2: Composer steering and Queue's Send now

  // wave-7-task-3: Message delivery mark and retrying

  // wave-7-task-4: Terminal approval and Confirmation's Always allow

  // wave-7-task-5: Tool retry and retrying

  // wave-7-task-6: Diff

  // wave-7-task-7: Step Group

  // wave-7-task-8: Handoff

  // wave-7-task-10: Trace

  traceSelect: { writes: 41, renders: 0, notified: 10, layoutReads: 2 },
  traceExpand: { writes: 95, renders: 0, notified: 125, layoutReads: 2 },

  // wave-7-task-11: Run Timeline

  // wave-7-task-12: Job Progress

  // wave-7-task-13: Schedule Card

  // wave-7-task-14: Agent Card

  // wave-7-task-15: Usage Meter and Context Meter's breakdown

  // wave-7-task-16: Quota Notice

  // wave-7-task-17: Activity Graph

  activityMove: { writes: 4, renders: 0, notified: 2, layoutReads: 1 },

  // wave-7-task-18: Thread List inbox

  // wave-7-task-19: Flow Graph
};
