// biome-ignore lint/suspicious/noTsIgnore: `ai` resolves when installed, so `@ts-expect-error` would fail.
/** @ts-ignore `ai` is an optional peer; without it these types are `any`. Kept in the emitted `.d.ts`. */
import type { ChatStatus } from "ai";
import type { MessageStatus } from "../../types/index.js";

const statuses: Record<ChatStatus, MessageStatus> = {
  submitted: "submitted",
  streaming: "streaming",
  ready: "complete",
  error: "error",
};

export function fromChatStatus(status: ChatStatus): MessageStatus {
  return statuses[status];
}
