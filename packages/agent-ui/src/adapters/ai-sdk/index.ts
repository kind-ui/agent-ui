// Spec §4.3.
// biome-ignore lint/suspicious/noTsIgnore: `ai` resolves when installed, so `@ts-expect-error` would fail.
/** @ts-ignore `ai` is an optional peer; without it these types are `any`. Kept in the emitted `.d.ts`. */
import type { ChatStatus, UIMessage } from "ai";
import type { Message, Part } from "../../types/index.js";
import { fromUIMessagePart } from "./parts.js";
import { fromChatStatus } from "./status.js";

export type { ApprovalDecision, ApprovalResponse } from "./approval.js";
export { toApprovalResponse } from "./approval.js";
export type { PartContext } from "./parts.js";
export { fromUIMessagePart } from "./parts.js";
export { fromChatStatus } from "./status.js";

/** What the chat says about its in-flight turn: `useChat`'s `status` and `error`. */
export interface UIChatState {
  /** The chat's status, which becomes the last message's. */
  status?: ChatStatus;
  /** The chat's error. Its `message` becomes the last message's `error`. */
  error?: { message: string } | undefined;
}

/**
 * Maps AI SDK UI messages to neutral messages. The chat's `status` describes the in-flight turn, so it applies to
 * the last message, as does its `error`; every earlier message is `"complete"`. Takes the `status` alone too.
 */
export function fromUIMessages(messages: readonly UIMessage[], chat?: ChatStatus | UIChatState): Message[] {
  const { status, error } =
    typeof chat === "object" && chat !== null ? chat : { status: chat, error: undefined };
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
    if (messageIndex === last && error) neutral.error = { message: error.message };
    const metadata: unknown = message.metadata;
    if (typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)) {
      neutral.metadata = metadata as Record<string, unknown>;
    }
    return neutral;
  });
}
