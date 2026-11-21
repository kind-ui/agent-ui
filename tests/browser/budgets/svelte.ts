import type { Budgets } from "./react.js";

// Svelte's count budgets (plan D12), measured on Linux CI. Svelte has no component re-render, so its budgets
// are `writes`, `layoutReads` and `parses` only. Each track task adds the cases it measures below its own
// marker; `budgets.spec.ts` skips a case with no entry here.
// biome-ignore format: the blank line under each marker keeps two tasks' lines apart, so git merges them cleanly
export const budgets: Partial<Budgets> = {
  // framework-svelte-1: groundwork, internal wrappers and Step

  // framework-svelte-2: chat core

  conversationStream: { writes: 1, renders: 0, notified: 1 },
  conversationFollow: { layoutReads: 12 },
  remount: { nodes: 0, listeners: 0 },
  // A chunk rewrites the streaming block's last text node and its `data-block-key`.
  markdownStream: { parses: 1, writes: 2, renders: 0, notified: 1 },

  // framework-svelte-3: composer controls

  // Writes stay flat; UI SDK Svelte re-reads each chip's attributes on a store change (`notified`), which D12 doesn't
  // budget for Svelte, so it holds the count at 200 chips.
  contextChip: { writes: 13, renders: 0, notified: 412, layoutReads: 0 },

  // framework-svelte-4: indicators, notices and files

  // framework-svelte-5: step family

  // framework-svelte-6: developer output

  // framework-svelte-7: Wave 6 shell

  // framework-svelte-8: conformance
};
