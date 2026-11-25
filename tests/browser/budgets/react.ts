// React's count budgets (plan D12). `writes`, `layoutReads` and `parses` are counted in every layer, `renders` are
// React's component renders and `notified` the parts UI SDK re-reads on web, so one table holds React's and Web's.
export const budgets = {
  conversationStream: { writes: 1, renders: 9, notified: 0 },
  // UI SDK's stick to bottom runs its pass (7 reads) on both the content's MutationObserver and its ResizeObserver,
  // which keeps rows in view still when rows above them change (`0.1.0-beta.17`).
  conversationFollow: { layoutReads: 18 },
  markdownStream: { parses: 1, writes: 4, renders: 6, notified: 3 },
  toolStream: { writes: 14, renders: 26, notified: 17 },
  // A chunk that wraps the last line runs the stick to bottom's pass on a mutation and a resize, and the scroll after.
  terminalChunk: { writes: 6, renders: 6, notified: 4, layoutReads: 28 },
  // A new line in a full viewport reads layout 36 times (37 under StrictMode, which binds the new line twice): the
  // virtualizer adds a row and drops one, and UI SDK's stick to bottom runs its pass on each mutation and each resize.
  terminalLine: { writes: 8, renders: 8, notified: 5, layoutReads: 37 },
  // The fixture's segments fit on one line and their header has a set height, so how many are in view doesn't depend
  // on the platform's fonts.
  transcriptWord: { writes: 3, renders: 3, notified: 3, layoutReads: 4 },
  transcriptSegment: { writes: 32, renders: 32, notified: 35, layoutReads: 9 },
  transcriptSearch: { writes: 72, renders: 201, notified: 140, layoutReads: 2 },
  // The fixture's chips are all 120px wide, whatever the fonts, so the same two show at 10 and 200.
  // Widths come from a ResizeObserver's entries, so fitting the chips reads no layout.
  contextChip: { writes: 27, renders: 8, notified: 9, layoutReads: 0 },
  remount: { nodes: 0, listeners: 0 },

  // Wave 6 markers (AGENTS.md "Wave 6 shared-file markers"): each task adds its budgets right below its own line.

  // wave-6-task-2: Thread List

  // Rows are 36px in a 600px column, so as many are in view at 10 threads as at 1,000, whatever the fonts. Pinning
  // moves every row in view down one; appending to 10 threads fills the column with new rows. A row's time is one more
  // part per row: a render, a re-read and two writes (its `aria-hidden` and text) for each row a change reaches.
  threadSelect: { writes: 5, renders: 11, notified: 16, layoutReads: 2 },
  threadPin: { writes: 119, renders: 39, notified: 199, layoutReads: 2 },
  threadAppend: { writes: 214, renders: 84, notified: 85, layoutReads: 2 },

  // wave-6-task-11: Conversation Search

  // The fixture's rows are 48px in a 480px viewport, so the same rows are in view at 100 and 5,000 messages, and the
  // 480px track holds at most 120 marks, placed by index rather than measured. What a character costs beyond the rows
  // in view is the marks it moves: at 100 messages, about 40 marks come and go (3 writes each on web, which also
  // re-reads every mark); at 5,000 every 4px step holds a match whatever the search, so no mark moves.
  // Scrolling to the current match releases the stick to bottom, which finds the row in view to keep still (10 reads).
  conversationSearchType: { writes: 151, renders: 86, notified: 128, layoutReads: 14 },
};

export type Budgets = typeof budgets;
