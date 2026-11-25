import type { MessageAuthor, RetryState, Source } from "./records.js";
import type { Step } from "./step.js";

export type Role = "user" | "assistant" | "system";
export type MessageStatus = "submitted" | "streaming" | "complete" | "error" | "aborted";

export interface Message {
  id: string;
  role: Role;
  status: MessageStatus;
  parts: Part[];
  /** ISO 8601. */
  createdAt?: string;
  /** Who wrote it, when its role doesn't say. */
  author?: MessageAuthor;
  /** Why a message with status `"error"` failed. */
  error?: { message: string };
  /** How a user message sent while a turn ran was delivered: steered into that turn, or queued for the next. */
  delivery?: "steered" | "queued";
  /** The turn is retrying. Its status stays `"submitted"` or `"streaming"`, and the text so far stays. */
  retry?: RetryState;
  metadata?: Record<string, unknown>;
}

export type Part =
  | { type: "text"; id: string; text: string; state: "streaming" | "done" }
  | { type: "reasoning"; id: string; text: string; state: "streaming" | "done" }
  | { type: "file"; id: string; name: string; mediaType: string; url: string }
  | { type: "source"; id: string; source: Source }
  | { type: "step"; id: string; step: Step }
  | { type: "data"; id: string; name: string; data: unknown };
