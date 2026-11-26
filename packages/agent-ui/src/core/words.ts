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
  decide: "Decide",
  allowThisTool: "Allow this tool?",
  steer: "Steer",
  steerNow: "Steer now",
  steerHint: "Deliver at the agent's next step",
  queueForLater: "Queue for later",
  queueHint: "Send after this turn",
  stopAndSend: "Stop and send",
  stopAndSendHint: "End this turn, start a new one",
  steerTooltip: "Send into the current turn",
  moreWaysToSend: "More ways to send",
  stopGenerating: "Stop generating",
  cancelSending: "Cancel sending",
  steerSent: "Steer sent",
  queued: "Queued",
  stoppedAndSent: "Stopped and sent",
  sendNow: "Send now",
  queuedMessage: "Queued message",
  notSentYet: "not sent",
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
