import type { Budgets } from "./react.js";

// Svelte's count budgets (plan D12), measured on Linux CI. Svelte has no component re-render, so its budgets
// are `writes`, `layoutReads` and `parses` only. `budgets.spec.ts` skips a case with no entry here.
export const budgets: Partial<Budgets> = {
  conversationStream: { writes: 1, renders: 0, notified: 1 },
  conversationFollow: { layoutReads: 12 },
  remount: { nodes: 0, listeners: 0 },
  // A chunk rewrites the streaming block's last text node and its `data-block-key`.
  markdownStream: { parses: 1, writes: 2, renders: 0, notified: 1 },

  // Writes stay flat; UI SDK Svelte re-reads each chip's attributes on a store change (`notified`), which D12 doesn't
  // budget for Svelte, so it holds the count at 200 chips.
  contextChip: { writes: 13, renders: 0, notified: 412, layoutReads: 0 },

  // The first chunk also rewrites 10 unchanged `style` attributes on the Code Block's `pre` and scroll area parts:
  // `@ui-sdk/svelte` hands Svelte each part's current inline style, which Svelte compares with the last style it
  // wrote, not the element's. Later chunks write 1.
  toolStream: { writes: 16, renders: 0, notified: 16 },

  // The new line comes in and the first line in view leaves, each with its comment anchors.
  terminalLine: { writes: 22, renders: 0, notified: 4, layoutReads: 18 },
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
  conversationSearchType: { writes: 451, renders: 0, notified: 57, layoutReads: 4 },

  // The wrap (4 writes, 9 reads) and the scroll it causes, which removes the first line in view with its 8 anchors
  // (9 writes, 6 reads), land in one measurement under load (AGENTS.md "Svelte conformance").
  terminalChunk: { writes: 13, renders: 0, notified: 2, layoutReads: 15 },
};
