import type { ValueStorage } from "@ui-sdk/core";

/** A mention or command inside the draft, inserted from the Trigger Menu or with `insertToken`. */
export type ComposerToken = { id: string; kind: "mention" | "command"; value: string; label: string };

/** A file attached to the draft. `error` marks one the host's `accept` or `maxSize` rules out. */
export type ComposerAttachment = {
  id: string;
  file: File;
  name: string;
  /** In bytes. */
  size: number;
  mediaType: string;
  error?: "type" | "size";
};

/**
 * What the composer holds. `text` is the Token Input's codec text, where each token reads
 * `[@label](kind:value)`, so a draft round-trips; `tokens` lists the same tokens in order.
 */
export type ComposerDraft = { text: string; tokens: ComposerToken[]; attachments: ComposerAttachment[] };

/** A suggestion the Trigger Menu offers after `@` or `/`. */
export type ComposerTriggerItem = { value: string; label: string; description?: string };

export const emptyDraft = (): ComposerDraft => ({ text: "", tokens: [], attachments: [] });

/** Whether the draft has something to send: text that isn't only whitespace, a token, or a valid attachment. */
export const isSubmittable = (draft: ComposerDraft): boolean =>
  draft.text.trim() !== "" ||
  draft.tokens.length > 0 ||
  draft.attachments.some((attachment) => attachment.error === undefined);

// Tokens are part of `text`, so comparing text compares them too.
const sameDraft = (a: ComposerDraft, b: ComposerDraft) =>
  a.text === b.text &&
  a.attachments.length === b.attachments.length &&
  a.attachments.every((attachment, index) => attachment.id === b.attachments[index]?.id);

/** The draft once a submission settles: a resolved one clears only if nothing changed since; a rejected one keeps it. */
export function draftAfterSettle(
  current: ComposerDraft,
  submitted: ComposerDraft,
  outcome: "resolved" | "rejected",
): ComposerDraft {
  return outcome === "resolved" && sameDraft(current, submitted) ? emptyDraft() : current;
}

type DraftStorage = Pick<ValueStorage, "get" | "set" | "remove">;

type SavedDraft = Pick<ComposerDraft, "text" | "tokens">;

// One storage keeps every conversation's draft, as JSON keyed by `draftKey`. Storage that throws counts as empty.
function readAll(storage: DraftStorage): Record<string, SavedDraft> {
  try {
    const saved: unknown = JSON.parse(storage.get() ?? "{}");
    // A null prototype, so a key like "__proto__" or "toString" is just a key.
    const all: Record<string, SavedDraft> = Object.create(null);
    return saved && typeof saved === "object" && !Array.isArray(saved) ? Object.assign(all, saved) : all;
  } catch {
    return Object.create(null);
  }
}

/** The text saved under `key`, or `undefined` when there's none. */
export function readSavedDraft(storage: DraftStorage, key: string): string | undefined {
  const text = readAll(storage)[key]?.text;
  return typeof text === "string" && text !== "" ? text : undefined;
}

/** Saves the draft's text and tokens under `key`, or removes the entry when the draft has neither. */
export function saveDraft(
  storage: DraftStorage,
  key: string,
  draft: Pick<ComposerDraft, "text" | "tokens">,
): void {
  const all = readAll(storage);
  if (draft.text === "" && draft.tokens.length === 0) {
    if (!Object.hasOwn(all, key)) return;
    delete all[key];
  } else {
    if (all[key]?.text === draft.text) return;
    all[key] = { text: draft.text, tokens: draft.tokens };
  }
  try {
    if (Object.keys(all).length === 0) storage.remove();
    else storage.set(JSON.stringify(all));
  } catch {
    // Quota or private mode: typing goes on without saving.
  }
}
