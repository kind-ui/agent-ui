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

  // framework-vue-4: indicators, notices and files

  // framework-vue-5: step family

  // framework-vue-6: developer output

  // A chunk updates the last line's two components; a chunk that wraps it shifts the window at 1,000 lines, which
  // renders the output part twice, never the other lines.
  terminalChunk: { writes: 4, renders: 10, notified: 0, layoutReads: 11 },
  // A new line renders the output part and the line that was last, and mounts the new one, at 10 lines as at 1,000.
  terminalLine: { writes: 4, renders: 11, notified: 0, layoutReads: 18 },
  // Playback writes the word's mark straight to the element, so no segment or word renders.
  transcriptWord: { writes: 2, renders: 4, notified: 2, layoutReads: 4 },
  // Following the next segment renders the list and mounts the segments it scrolls into view.
  transcriptSegment: { writes: 7, renders: 24, notified: 4, layoutReads: 8 },
  // A search renders the segments in view whose marks changed, at 100 segments as at 5,000.
  transcriptSearch: { writes: 44, renders: 48, notified: 0, layoutReads: 2 },

  // framework-vue-7: Wave 6 shell

  // framework-vue-8: conformance
};
