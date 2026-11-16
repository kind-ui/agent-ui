// Compile-time assignability of the pinned `ai` UI types to the adapter.
import type { Message, MessageStatus, Part } from "@kind-ui/agent-ui";
import {
  fromChatStatus,
  fromUIMessagePart,
  fromUIMessages,
  toApprovalResponse,
} from "@kind-ui/agent-ui/adapters/ai-sdk";
import type { ChatAddToolApproveResponseFunction, ChatStatus, UIMessage } from "ai";

type Tools = { search: { input: { query: string }; output: { temp: number } } };
type Data = { weather: { temp: number } };
type AppMessage = UIMessage<{ model: string }, Data, Tools>;

declare const messages: AppMessage[];
declare const untyped: UIMessage[];
declare const status: ChatStatus;
declare const untypedPart: UIMessage["parts"][number];
declare const appPart: AppMessage["parts"][number];
declare const addToolApprovalResponse: ChatAddToolApproveResponseFunction;

const mapped: Message[] = fromUIMessages(messages, status);
const plain: Message[] = fromUIMessages(untyped);
const part: Part | null = fromUIMessagePart(untypedPart, { messageId: "m", index: 0 });
const typedPart: Part | null = fromUIMessagePart(appPart, { messageId: "m", index: 0 });
const messageStatus: MessageStatus = fromChatStatus(status);

const approval = { approvalId: "appr-1", generation: 0, state: "requested" } as const;
void addToolApprovalResponse(toApprovalResponse(approval, { approved: true }));

export { mapped, messageStatus, part, plain, typedPart };
