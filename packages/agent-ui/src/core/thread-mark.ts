import type { Thread } from "../types/index.js";
import { WORDS } from "./words.js";

/** A thread's one mark: the status mark's `data-status`, and its words. */
export type ThreadMark = {
  status: "pending" | "running" | "awaiting-input" | "error" | "complete";
  label: string;
};

const MARKS: Record<NonNullable<Thread["status"]>, ThreadMark> = {
  "awaiting-approval": { status: "awaiting-input", label: WORDS.waiting },
  "awaiting-input": { status: "awaiting-input", label: "Needs input" },
  error: { status: "error", label: "Failed" },
  running: { status: "running", label: "Running" },
  queued: { status: "pending", label: WORDS.queued },
  complete: { status: "complete", label: "Done" },
};

/**
 * The one mark a thread's row shows, if any (Wave 7 spec §13): waiting on an approval or an answer, failed, running,
 * queued or done. Done shows only while unread, and with `unreadOnly` failed does too, so a seen failure is quiet.
 */
export function threadMark(thread: Thread, { unreadOnly = false } = {}): ThreadMark | undefined {
  const { status } = thread;
  if (status === undefined) return undefined;
  if (status === "complete" && !thread.unread) return undefined;
  if (status === "error" && unreadOnly && !thread.unread) return undefined;
  return MARKS[status];
}
