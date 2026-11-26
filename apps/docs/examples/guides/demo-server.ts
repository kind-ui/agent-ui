// Answers the guides' `/api/chat` in the browser, so their previews run without a server or a model:
// the route code from the guides, with a scripted model in place of a real one.
import {
  convertToModelMessages,
  jsonSchema,
  simulateReadableStream,
  stepCountIs,
  streamText,
  type ToolSet,
  tool,
  type UIMessage,
} from "ai";
import { MockLanguageModelV4 } from "ai/test";

type DoStream = MockLanguageModelV4["doStream"];
type StreamPart = Awaited<ReturnType<DoStream>>["stream"] extends ReadableStream<infer T> ? T : never;
type Prompt = Parameters<DoStream>[0]["prompt"];

const words = (text: string) => text.match(/\S+\s*/g) ?? [];

const text = (id: string, content: string): StreamPart[] => [
  { type: "text-start", id },
  ...words(content).map((delta): StreamPart => ({ type: "text-delta", id, delta })),
  { type: "text-end", id },
];

const reasoning = (id: string, content: string): StreamPart[] => [
  { type: "reasoning-start", id },
  ...words(content).map((delta): StreamPart => ({ type: "reasoning-delta", id, delta })),
  { type: "reasoning-end", id },
];

const call = (toolCallId: string, toolName: string, input: object): StreamPart => ({
  type: "tool-call",
  toolCallId,
  toolName,
  input: JSON.stringify(input),
});

function model(reply: (prompt: Prompt) => StreamPart[]) {
  return new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      const parts = reply(prompt);
      const finish: StreamPart = {
        type: "finish",
        finishReason: {
          unified: parts.some((part) => part.type === "tool-call") ? "tool-calls" : "stop",
          raw: undefined,
        },
        usage: {
          inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 0, text: 0, reasoning: 0 },
        },
      };
      return { stream: simulateReadableStream({ chunks: [...parts, finish], chunkDelayInMs: 40 }) };
    },
  });
}

const chat = {
  model: model(() =>
    text(
      "answer",
      "This answer comes from a scripted model in your browser. Your route streams a real model's answer, which renders as **Markdown** while it arrives:\n\n```ts\nconst result = streamText({ model, messages });\n```",
    ),
  ),
  tools: {},
};

const agent = {
  model: model((prompt) => {
    const last = prompt.at(-1);
    const result =
      last?.role === "tool" ? last.content.findLast((part) => part.type === "tool-result") : undefined;
    if (!result) {
      return [
        ...reasoning(
          "thinking",
          "The person wants merged branches cleaned up. List the branches first, then delete only the merged ones.",
        ),
        call("call_list", "list_branches", {}),
      ];
    }
    if (result.toolName === "list_branches")
      return [call("call_delete", "delete_branch", { branch: "fix-retry" })];
    return result.output.type === "execution-denied"
      ? text("answer", "Okay, I left `fix-retry` alone.")
      : text("answer", "Deleted `fix-retry`. `main` and `release-1.4` are untouched.");
  }),
  tools: {
    list_branches: tool({
      description: "List the git branches",
      inputSchema: jsonSchema<Record<string, never>>({ type: "object", properties: {} }),
      execute: async () => [
        { name: "main", merged: false },
        { name: "fix-retry", merged: true },
        { name: "release-1.4", merged: false },
      ],
    }),
    delete_branch: tool({
      description: "Delete a git branch",
      inputSchema: jsonSchema<{ branch: string }>({
        type: "object",
        properties: { branch: { type: "string" } },
        required: ["branch"],
      }),
      needsApproval: true,
      execute: async ({ branch }) => ({ deleted: branch }),
    }),
  } satisfies ToolSet,
};

const routes = { chat, agent };

async function respond(request: Request, { model, tools }: (typeof routes)[keyof typeof routes]) {
  const { messages }: { messages: UIMessage[] } = await request.json();
  const result = streamText({
    model,
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    stopWhen: stepCountIs(5),
    abortSignal: request.signal,
  });
  return result.toUIMessageStreamResponse();
}

/** Answers `POST /api/chat` with a guide's scripted route until the returned function is called. */
export function serveChat(route: keyof typeof routes) {
  const original = window.fetch;
  window.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), location.href);
    if (url.pathname !== "/api/chat") return original(input, init);
    return respond(new Request(url, init), routes[route]);
  };
  return () => {
    window.fetch = original;
  };
}
