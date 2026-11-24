# AI SDK

`@kind-ui/agent-ui/adapters/ai-sdk` turns the AI SDK's `UIMessage`s into the `Message`, `Part`, `Step` and `Approval` types the components render. It imports only types from `ai`, so it works with `@ai-sdk/react`, `@ai-sdk/vue` and `@ai-sdk/svelte` alike.

```bash
npm install ai @ai-sdk/react
```

## The chat page

A chat with tool calls and approvals. Add `@kind-ui/conversation @kind-ui/message @kind-ui/markdown @kind-ui/composer @kind-ui/tool` first ([install.md](install.md)).

```tsx
"use client";
import { useChat } from "@ai-sdk/react";
import type { Part } from "@kind-ui/agent-ui";
import { fromUIMessages, toApprovalResponse } from "@kind-ui/agent-ui/adapters/ai-sdk";
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { Composer, ComposerInput, ComposerStop, ComposerSubmit } from "@/components/ui/composer";
import {
  Conversation,
  ConversationContent,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/conversation";
import { Markdown } from "@/components/ui/markdown";
import { Message, MessageContent, MessageOutcome } from "@/components/ui/message";
import { Tool } from "@/components/ui/tool";

export default function Chat() {
  const { messages, status, error, sendMessage, stop, regenerate, addToolApprovalResponse } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
  const rendered = fromUIMessages(messages, { status, error });

  const renderPart = (part: Part) => {
    if (part.type === "text") {
      return <Markdown key={part.id} source={part.text} streaming={part.state === "streaming"} />;
    }
    if (part.type === "step" && part.step.kind === "tool") {
      const { call, error } = part.step;
      const approval = call.approval;
      return (
        <Tool
          key={part.id}
          call={call}
          error={error}
          approvalReason
          onApprove={() => approval && addToolApprovalResponse(toApprovalResponse(approval, { approved: true }))}
          onDeny={({ reason }) =>
            approval && addToolApprovalResponse(toApprovalResponse(approval, { approved: false, reason }))
          }
        />
      );
    }
    return null;
  };

  return (
    <main className="mx-auto flex h-dvh max-w-2xl flex-col gap-4 p-4">
      <Conversation aria-label="Chat" messageCount={rendered.length} className="min-h-0 flex-1">
        <ConversationViewport>
          <ConversationContent>
            {rendered.map((message, index) => (
              <ConversationRow key={message.id} value={message.id} index={index}>
                <Message
                  aria-label={message.role === "user" ? "Your message" : "Assistant message"}
                  messageRole={message.role}
                  status={message.status}
                  error={message.error?.message}
                  onRetry={() => regenerate()}
                >
                  <MessageContent>{message.parts.map(renderPart)}</MessageContent>
                  <MessageOutcome />
                </Message>
              </ConversationRow>
            ))}
          </ConversationContent>
        </ConversationViewport>
        <ConversationJump />
      </Conversation>
      <Composer aria-label="Message" onSubmit={(draft) => sendMessage({ text: draft.text })} onStop={stop}>
        <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
        <ComposerSubmit />
        <ComposerStop />
      </Composer>
    </main>
  );
}
```

- `fromUIMessages(messages, { status, error })` gives the last message the chat's status (`submitted`, `streaming`, `complete` or `error`) and its error, and marks earlier messages `complete`.
- `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses` sends the chat back once every waiting tool call has a decision, so an approved tool runs and the model goes on.
- `onSubmit` returns `sendMessage`'s promise, so the composer stays pending, and Stop shows, until the answer ends.
- Map in render; the components keep their own state by `part.id`.

## The server route

A tool with `needsApproval: true` stops and waits for a person before `execute` runs:

```ts
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";

const tools = {
  get_weather: tool({
    description: "Get the weather in a city",
    inputSchema: z.object({ city: z.string() }),
    execute: async ({ city }) => ({ city, temperature: 18 }),
  }),
  delete_branch: tool({
    description: "Delete a git branch",
    inputSchema: z.object({ branch: z.string() }),
    needsApproval: true,
    execute: async ({ branch }) => ({ deleted: branch }),
  }),
};

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();
  const result = streamText({
    model: "openai/gpt-5",
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    stopWhen: stepCountIs(5),
  });
  return result.toUIMessageStreamResponse();
}
```

## Parts

| `UIMessage` part | `Part` | Render with |
| --- | --- | --- |
| `text` | `{ type: "text", text, state: "streaming" \| "done" }` | `Markdown` with `streaming={part.state === "streaming"}` |
| `reasoning` | `{ type: "reasoning", text, state }` | `Reasoning` with `status={part.state === "streaming" ? "running" : "complete"}` and `text` |
| `tool-<name>`, `dynamic-tool` | `{ type: "step", step: { kind: "tool", status, call, error? } }` | `Tool` with `call` and `error` |
| `file` | `{ type: "file", name, mediaType, url }` | your own link or image, or `Attachments` |
| `source-url`, `source-document` | `{ type: "source", source }` | collect them into `Sources` |
| `data-<name>` | `{ type: "data", name, data }` | your own component |
| `step-start` | dropped | |
| anything else | `{ type: "data", name: <part type>, data: <part> }` | |

Each part's `id` is `<messageId>:<index>`, except a tool step, which keeps its `toolCallId`. Key rendered parts by `part.id`.

## Tool states

| AI SDK state | Step `status` | `call` |
| --- | --- | --- |
| `input-streaming` | `running` | `input.state: "streaming"` |
| `input-available` | `running` | `input.state: "ready"` |
| `approval-requested` | `awaiting-input` | `approval.state: "requested"` |
| `approval-responded` | `running` | `approval.state: "responded"`, with its `decision` |
| `output-available` | `complete` | `output.state: "available"`, or `"preliminary"` while `preliminary` |
| `output-error` | `error` | `outcome: "error"`, and the step's `error.message` |
| `output-denied` | `cancelled` | `outcome: "denied"` |

An unknown state becomes a `data` part, never a guessed status. Mapped approvals have `generation: 0`; an automatic approval maps to `approval.state: "auto"`.

## Reasoning, plans and other parts

```tsx
if (part.type === "reasoning") {
  return <Reasoning key={part.id} status={part.state === "streaming" ? "running" : "complete"} text={part.text} />;
}
```

Reasoning streams its thoughts open while `running`, then collapses to "Thought" (or "Thought for N s" with `durationSeconds`). For a plan the model writes through a tool, read the tool's `call.input.value` into `Plan items` (`{ id, title, status }` each, keeping only items that arrived whole), and render the latest call's items in the first call's place so the plan stays put. Group many steps under one summary with `ChainOfThought`.

## Other exports

| Export | Does |
| --- | --- |
| `fromUIMessagePart(part, { messageId, index })` | Maps one part; `null` only for `step-start` |
| `fromChatStatus(status)` | `submitted`, `streaming`, `ready`, `error` to `submitted`, `streaming`, `complete`, `error` |
| `toApprovalResponse(approval, { approved, reason? })` | `{ id, approved, reason? }` for `addToolApprovalResponse` |
