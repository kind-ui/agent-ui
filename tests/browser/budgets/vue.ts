import type { Budgets } from "./react.js";

// Vue's count budgets (plan D12), measured on Linux CI. Its `renders` are component updates through Vue's
// DevTools hook. Each track task adds the cases it measures below its own marker; `budgets.spec.ts` skips a
// case with no entry here.
// biome-ignore format: the blank line under each marker keeps two tasks' lines apart, so git merges them cleanly
export const budgets: Partial<Budgets> = {
  // framework-vue-1: groundwork, internal wrappers and Step

  // framework-vue-2: chat core

  // A streamed token updates only the last row's components, as many at 10 rows as at 500.
  conversationStream: { writes: 1, renders: 11, notified: 0 },
  conversationFollow: { layoutReads: 12 },
  markdownStream: { parses: 1, writes: 2, renders: 5, notified: 0 },
  remount: { nodes: 0, listeners: 0 },

  // framework-vue-3: composer controls

  contextChip: { writes: 5, renders: 9, notified: 0, layoutReads: 0 },

  // framework-vue-4: indicators, notices and files

  // framework-vue-5: step family

  // framework-vue-6: developer output

  // framework-vue-7: Wave 6 shell

  // Rows are their own components with stable slots, so selecting, pinning and loading more render only the rows they
  // change and those that come into view, at 10 threads as at 1,000.
  threadSelect: { writes: 4, renders: 12, notified: 0, layoutReads: 0 },
  threadPin: { writes: 46, renders: 52, notified: 0, layoutReads: 2 },
  threadAppend: { writes: 24, renders: 50, notified: 0, layoutReads: 2 },
  // A search renders the rows whose marks changed; at 5,000 messages the mark track is already full.
  conversationSearchType: { writes: 51, renders: 24, notified: 0, layoutReads: 4 },

  // framework-vue-8: conformance
};
