import { type ChatTransport, simulateReadableStream, type UIMessage, type UIMessageChunk } from "ai";

/** Answers every message with a short scripted reply, with no network. */
export function createMockTransport({ delayMs = 30 }: { delayMs?: number } = {}): ChatTransport<UIMessage> {
  const chunks: UIMessageChunk[] = [
    { type: "start" },
    { type: "text-start", id: "t" },
    { type: "text-delta", id: "t", delta: "Hello from " },
    { type: "text-delta", id: "t", delta: "the mock." },
    { type: "text-end", id: "t" },
    { type: "finish" },
  ];
  return {
    sendMessages: async () => simulateReadableStream({ chunks, chunkDelayInMs: delayMs }),
    reconnectToStream: async () => null,
  };
}
