/**
 * Every default string of the shared vocabulary (Wave 7 spec §2), in one table, so components and docs can't drift.
 * `scripts/tests/words.test.mjs` fails when a source file writes one of these strings itself.
 */
export const WORDS = {
  approvalRequest: "Approval request",
  approve: "Approve",
  deny: "Deny",
  alwaysAllow: "Always allow",
  waiting: "Waiting for approval",
  sending: "Sending decision",
  notSent: "Decision not sent",
  notSentRetry: "Decision not sent. Try again.",
  approved: "Approved",
  alwaysAllowed: "Always allowed",
  approvedAutomatically: "Approved automatically",
  denied: "Denied",
  deniedAutomatically: "Denied automatically",
  expired: "Expired before a decision",
  cancelled: "Cancelled before a decision",
  deadlinePassed: "Expired",
  decideIn: "Decide in",
} as const;

/**
 * Splits text on backticks: even indexes are plain text, odd ones code, as in "Run `npm test`?". A lone backtick
 * stays text.
 */
export const codeSpans = (text: string): string[] => {
  const pieces = text.split("`");
  if (pieces.length % 2 === 0) pieces[pieces.length - 2] += `\`${pieces.pop()}`;
  return pieces;
};

/** The text without its code marks, for names and announcements. */
export const plainText = (text: string): string => codeSpans(text).join("");
