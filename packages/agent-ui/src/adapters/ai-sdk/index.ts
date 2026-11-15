// Spec §4.3.
import type { ChatStatus, UIMessage } from "ai";
import type { Message, Part } from "../../types/index.js";
import { fromUIMessagePart } from "./parts.js";
import { fromChatStatus } from "./status.js";

export type { ApprovalDecision, ApprovalResponse } from "./approval.js";
export { toApprovalResponse } from "./approval.js";
export type { PartContext } from "./parts.js";
export { fromUIMessagePart } from "./parts.js";
export { fromChatStatus } from "./status.js";

/**
 * Maps AI SDK UI messages to neutral messages. The chat `status` describes the in-flight turn, so it applies to
 * the last message; every earlier message is `"complete"`.
 */
export function fromUIMessages(messages: readonly UIMessage[], status?: ChatStatus): Message[] {
  const last = messages.length - 1;
  return messages.map((message, messageIndex) => {
    const parts: Part[] = message.parts.flatMap(
      (part, index) => fromUIMessagePart(part, { messageId: message.id, index }) ?? [],
    );
    const neutral: Message = {
      id: message.id,
      role: message.role,
      status: messageIndex === last && status !== undefined ? fromChatStatus(status) : "complete",
      parts,
    };
    const metadata: unknown = message.metadata;
    if (typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)) {
      neutral.metadata = metadata as Record<string, unknown>;
    }
    return neutral;
  });
}
