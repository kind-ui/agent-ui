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
  sendUnavailable: "Available after you answer the pending request",
  queuedMessage: "Queued message",
  notSentYet: "not sent",
  steering: "Steering…",
  steeringDescription: "Steering, not yet read",
  queuedNotSent: "Queued, not sent",
  messageNotSent: "Not sent",
  withdraw: "Withdraw",
  retrying: "Retrying",
  retryNow: "Retry now",
  attempt: "attempt",
  failedAfter: "Failed after",
  noUpdateFor: "No update for",
  stillWorking: "Still working",
  workingAgain: "Working again",
  stoppedAfter: "Stopped after",
  waitingCount: "waiting",
  finished: "finished",
  otherStep: "other step",
  otherSteps: "other steps",
  keep: "Keep",
  undo: "Undo",
  keepAll: "Keep all",
  undoAll: "Undo all",
  kept: "Kept",
  undone: "Undone",
  keeping: "Keeping…",
  undoing: "Undoing…",
  allReviewed: "All changes reviewed",
  cantBeUndone: "This can't be undone.",
  percentFull: "% full",
  fillingUp: "Filling up",
  almostFull: "Almost full",
  compact: "Compact",
  compacting: "Compacting",
  compactsAt: "compacts at",
  freeSpace: "Free space",
  runningLow: "Running low",
  aheadOfPace: "Ahead of pace",
  onPace: "On pace",
  resets: "Resets",
  used: "used",
  sendAgain: "You can send messages again",
  limitReset: "Your limit has reset.",
  timesTheCost: "times the cost",
  sameCost: "the same cost",
  costNote: "Cost per request, relative to the default model.",
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
