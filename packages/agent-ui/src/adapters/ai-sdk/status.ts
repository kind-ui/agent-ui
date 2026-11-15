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
