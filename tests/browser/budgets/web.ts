import { type Budgets, budgets as react } from "./react.js";

// Web's count budgets are React's table, where each row's `notified` is Web's and its `renders` React's, apart from
// the rows below, where Web's `writes` and `layoutReads` differ from React's.
export const budgets: Budgets = {
  ...react,
  // UI SDK's stick to bottom reads layout 22 times on web for a new message, against 18 on React.
  conversationFollow: { layoutReads: 22 },
  terminalLine: { ...react.terminalLine, layoutReads: 29 },
  transcriptSegment: { ...react.transcriptSegment, layoutReads: 8 },
  transcriptSearch: { ...react.transcriptSearch, writes: 22 },
};
