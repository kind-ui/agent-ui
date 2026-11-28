import { diffCounts } from "../diff/view.js";

/** What a restore brings back: the code and the conversation, or one of them. */
export type CheckpointScope = "both" | "code" | "conversation";

/** What restoring the code undoes. */
export type CheckpointChanges = { files: number; additions: number; deletions: number };

export const SCOPES: readonly CheckpointScope[] = ["both", "code", "conversation"];

export const SCOPE_LABELS: Record<CheckpointScope, string> = {
  both: "Code and conversation",
  code: "Code only",
  conversation: "Conversation only",
};

const OUTCOMES: Record<CheckpointScope, string> = {
  both: "Restored code and conversation",
  code: "Restored code",
  conversation: "Restored conversation",
};

const count = (value: number, one: string) =>
  `${value.toLocaleString("en-US")} ${value === 1 ? one : `${one}s`}`;

const codePart = (changes: CheckpointChanges | undefined) => {
  if (!changes) return "Undoes changes to the code";
  if (changes.files === 0) return "Changes no files";
  const counts = diffCounts(changes.additions, changes.deletions);
  return `Undoes changes to ${count(changes.files, "file")}${counts ? ` (${counts})` : ""}`;
};

const messagesPart = (laterMessages: number | undefined) =>
  laterMessages === undefined
    ? "removes the later messages"
    : laterMessages === 0
      ? "removes no messages"
      : `removes ${count(laterMessages, "later message")}`;

/**
 * What restoring `scope` loses, as one sentence: "Undoes changes to 3 files (+12 −40) and removes 4 later messages."
 * Without `changes` or `laterMessages`, the whole restore reads "Changes after it will be discarded."
 */
export const checkpointLoss = (
  scope: CheckpointScope,
  changes: CheckpointChanges | undefined,
  laterMessages: number | undefined,
): string => {
  if (scope === "code") return `${codePart(changes)}. The conversation stays.`;
  const messages = messagesPart(laterMessages);
  if (scope === "conversation") return `${messages[0]?.toUpperCase()}${messages.slice(1)}. The code stays.`;
  if (!changes && laterMessages === undefined) return "Changes after it will be discarded.";
  return `${codePart(changes)} and ${messages}.`;
};

/** "Code from 2 messages can't be restored.", while the restore brings code back and some can't be. */
export const checkpointNote = (scope: CheckpointScope, unrestorable: number | undefined): string =>
  scope !== "conversation" && unrestorable
    ? `Code from ${count(unrestorable, "message")} can't be restored.`
    : "";

/** "Restored code and conversation", or "Restored" while the host offers no choice of scope. */
export const checkpointOutcome = (scope: CheckpointScope, scoped: boolean): string =>
  scoped ? OUTCOMES[scope] : "Restored";

/** "3 files, 4 messages": what the restore brought back, as far as the host said. */
export const checkpointOutcomeMeta = (
  scope: CheckpointScope,
  changes: CheckpointChanges | undefined,
  laterMessages: number | undefined,
): string =>
  [
    scope !== "conversation" && changes && count(changes.files, "file"),
    scope !== "code" && laterMessages !== undefined && count(laterMessages, "message"),
  ]
    .filter(Boolean)
    .join(", ");
