# Compose

The samples are React. Vue, Svelte and Solid take the same parts and props, spelled as each framework expects (see each component page's framework table, and the Vue, Svelte and Solid tabs under each docs example). Web Components fill in their default parts when you write the element with no children.

Most components render their default parts when you pass no children (`<Tool call={call} />`). Compose the parts yourself only to reorder or add to them; each component page's **Composition** tree names them.

## A chat with a composer

The base of every chat: a Conversation that follows the newest row, a Message per turn, Markdown for the text, and a Composer.

```bash
npx shadcn@latest add @kind-ui/conversation @kind-ui/message @kind-ui/markdown @kind-ui/composer
```

```tsx
"use client";
import type { Message as ChatMessage } from "@kind-ui/agent-ui";
import { Composer, ComposerInput, ComposerStop, ComposerSubmit } from "@/components/ui/composer";
import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationEmptyTitle,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/conversation";
import { Markdown } from "@/components/ui/markdown";
import { Message, MessageContent, MessageOutcome } from "@/components/ui/message";

type ChatProps = {
  messages: ChatMessage[];
  onSend: (text: string) => Promise<void>;
  onStop: () => void;
  onRetry: () => void;
};

export function Chat({ messages, onSend, onStop, onRetry }: ChatProps) {
  return (
    <main className="mx-auto flex h-dvh max-w-2xl flex-col gap-4 p-4">
      <Conversation aria-label="Chat" messageCount={messages.length} className="min-h-0 flex-1">
        <ConversationViewport>
          <ConversationContent>
            {messages.map((message, index) => (
              <ConversationRow key={message.id} value={message.id} index={index}>
                <Message
                  aria-label={message.role === "user" ? "Your message" : "Assistant message"}
                  messageRole={message.role}
                  status={message.status}
                  error={message.error?.message}
                  onRetry={onRetry}
                >
                  <MessageContent>
                    {message.parts.map((part) =>
                      part.type === "text" ? (
                        <Markdown key={part.id} source={part.text} streaming={part.state === "streaming"} />
                      ) : null,
                    )}
                  </MessageContent>
                  <MessageOutcome />
                </Message>
              </ConversationRow>
            ))}
            <ConversationEmpty>
              <ConversationEmptyTitle>Ask anything</ConversationEmptyTitle>
            </ConversationEmpty>
          </ConversationContent>
        </ConversationViewport>
        <ConversationJump />
      </Conversation>
      <Composer aria-label="Message" onSubmit={(draft) => onSend(draft.text)} onStop={onStop}>
        <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
        <ComposerSubmit />
        <ComposerStop />
      </Composer>
    </main>
  );
}
```

- `messageCount` and each row's `value` and `index` let the Conversation follow new rows while the reader is at the end, and offer **Jump to latest** once they scroll up.
- `streaming` on Markdown repairs half-written fences, tables and links while the part streams.
- `onSubmit` returns a promise: the composer stays pending until it settles, and Stop takes Send's place while you pass `onStop`. Enter sends; Shift+Enter starts a new line. A resolved submit clears the draft; a rejected one keeps it.
- `MessageOutcome` shows a stopped or failed reply's words: **Retry** for a failed one while you pass `onRetry`, **Continue** for a stopped one while you pass `onContinue`.
- A user message sent while a turn runs: pass `delivery` (`"steering"`, `"queued"` or `"not-sent"`) until the agent has it, with `<MessageDelivery />` after the content. `onWithdraw` offers **Withdraw**, which hands the text back to the Composer once it resolves; `onResend` offers **Retry**. Leave `delivery` out once delivered.
- A request being tried again: pass `retry` (`{ attempt, maxAttempts, retryAfter, reason }`) with `<MessageRetrying />` before `<MessageOutcome />`; set `status: "error"` with `retry` still set when the attempts run out, and the outcome reads "Failed after N attempts".
- Long runs: pass `lastActivityAt` to a running Step-based row, Status or Thinking Indicator; after `stalledAfter` (120 sec) without an update it reads "No update for 2 min".
- Give replies names a person would tell apart when there are many, like `aria-label={`Reply ${index + 1}`}`; agents name components by these.
- `MessageToolbar` and `MessageHeader` are empty until you fill them: `MessageCopy`, `MessageRegenerate` and `MessageEdit` inside the toolbar (Message page), and `MessageAvatar` beside `MessageHeader` holding `MessageAuthor` and `MessageTime`, with `author` and `createdAt` on the Message.
- Loading and error: place `<ConversationSkeleton />`, `<ConversationLoading />` and `<ConversationError />` in `ConversationContent` and pass `status` (`"ready"`, `"loading"`, `"error"`) and `onRetry` to Conversation. Render rows only while `status === "ready"`.

## Tool calls and approvals

Render each tool step as a Tool. When the call waits for a person, the Tool shows **Approve** and **Deny** inside it, and once decided, the outcome in their place.

```bash
npx shadcn@latest add @kind-ui/tool
```

```tsx
import type { Approval, Part } from "@kind-ui/agent-ui";
import { Markdown } from "@/components/ui/markdown";
import { Tool } from "@/components/ui/tool";

type Decide = (approval: Approval, decision: { approved: boolean; reason?: string }) => void;

export function renderPart(part: Part, decide: Decide) {
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
        onApprove={() => approval && decide(approval, { approved: true })}
        onDeny={({ reason }) => approval && decide(approval, { approved: false, reason })}
      />
    );
  }
  return null;
}
```

- The Tool reads its status from `call`: `running`, `awaiting-input` while it waits, `complete`, `error`, or `cancelled` once denied. It opens while it runs and closes into its header when it completes.
- `onApprove` and `onDeny` are what show the buttons. `approvalReason` makes a person's first Deny open a reason box, which `onDeny` gets.
- With the AI SDK, `decide` is `addToolApprovalResponse(toApprovalResponse(approval, decision))`; see [ai-sdk.md](ai-sdk.md).
- Reasoning parts go in a `Reasoning` (`status` from the part's state, `text`), a plan tool in a `Plan` (`items`); see [ai-sdk.md](ai-sdk.md#reasoning-plans-and-other-parts).
- An approval that isn't a tool call is a standalone Confirmation; see [approvals.md](approvals.md).

## Composer controls

Controls placed inside the Composer take its layout: a Context Bar on top, the editor, then a row of controls, Dictation and Send. Put the controls in one wrapper on the `attach` grid area:

```tsx
import { AddMenu } from "@/components/ui/add-menu";
import { ApprovalMode } from "@/components/ui/approval-mode";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/composer";
import { ContextBar } from "@/components/ui/context-bar";
import { Dictation } from "@/components/ui/dictation";
import { ModelControl } from "@/components/ui/model-control";

<Composer aria-label="Message" onSubmit={send}>
  <ContextBar chips={chips} onRemove={(id) => setChips(chips.filter((chip) => chip.id !== id))} />
  <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
  <div className="flex min-w-0 flex-wrap items-center gap-1.5" style={{ gridArea: "attach" }}>
    <AddMenu items={addItems} onAction={add} />
    <ModelControl models={models} model={model} onModelChange={setModel} levels={levels} effort={effort} onEffortChange={setEffort} />
    <ApprovalMode modes={modes} value={mode} onValueChange={setMode} />
  </div>
  <Dictation source={speechSource} />
  <ComposerSubmit />
</Composer>
```

Below 28rem the Model Control and Approval Mode buttons show only their icon. Dictation hands its text to the composer itself. `createSpeechDictation()` from `@kind-ui/agent-ui/core` is a source over the browser's speech recognition. The full example is the Composer page's "Controls and narrow screens".

## Context and usage limits

- `ContextMeter` beside the composer: `used` and `total` for the window, `breakdown` (slices that don't overlap) for what fills it, `compactAt` and `onCompact` for **Compact**, and `limits` (`UsageLimit[]`, each with `resetsAt` and `windowStartedAt` for its pace). From 80% the ring shows the fullest limit. `layout="inline"` puts the same details on a settings page.
- After compacting, mark the point in the transcript with a Status: `<Status status="complete" label="Compacted the conversation · 64k → 12k tokens" />`.
- Near a limit, a `warning` Notice that leads with what's left (`label="12 requests left"`), `resetsAt` and `onDismiss`; key it by level so a dismissed warning comes back at the next one. At the limit, an `error` Notice naming the limit, with "New runs pause until then." and the ways out in `actions` (Continue at reset, Switch to another model, Use credits, the main one last); an error has no Dismiss unless `dismissible`.
- Put each model's relative `cost` (`"1×"`, `"3×"`, `"Free"`) on its `ModelOption`; Model Selector and Model Control show it in the row with a `costNote` under the list.

## The sidebar shell

A chat app: chats in a resizable Sidebar that turns into a drawer on phones, with search and a thread list, and the chat beside them.

```bash
npx shadcn@latest add @kind-ui/sidebar @kind-ui/thread-list @kind-ui/thread-search
```

```tsx
"use client";
import type { Thread } from "@kind-ui/agent-ui";
import { Sidebar, SidebarHandle, SidebarInset, SidebarPanel, SidebarTrigger } from "@/components/ui/sidebar";
import { ThreadList } from "@/components/ui/thread-list";
import { ThreadSearch } from "@/components/ui/thread-search";

export function Shell({ threads, current, now, onOpen, onNew, children }: {
  threads: Thread[];
  current: string;
  now: string;
  onOpen: (id: string) => void;
  onNew: (title: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Sidebar label="Chats" defaultSize="240px" minSize="180px" className="h-dvh w-full overflow-hidden">
      <SidebarPanel>
        <div className="flex h-12 shrink-0 items-center px-2">
          <ThreadSearch threads={threads} now={now} onSelect={onOpen} onNew={onNew} />
        </div>
        <div className="min-h-0 flex-1 px-2 pb-2">
          <ThreadList
            threads={threads}
            value={current}
            now={now}
            onSelect={(id, details) => {
              details.cancel();
              onOpen(id);
            }}
            onNew={() => onNew("")}
          />
        </div>
      </SidebarPanel>
      <SidebarHandle />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 px-3">
          <SidebarTrigger />
        </header>
        {children}
      </SidebarInset>
    </Sidebar>
  );
}
```

- `Thread` is `{ id, title, updatedAt?, href?, pinned?, group?, status?, unread? }`. Thread List groups by date (pinned first) and needs `now` (an ISO date) so server markup groups as the browser does. `details.cancel()` in `onSelect` stops the row's link so you can route yourself.
- Rename, Pin, Share and Delete appear in each row's menu as you pass `onRename`, `onPinChange`, `onShare` and `onDelete`.
- Inside the inset, add `DaySeparator` between days, `ConnectionStatus` over the Conversation and `ConversationSearch` above it. The Sidebar page's "chat shell" example has them all.

## What to show while waiting

- A reply hasn't started: `ThinkingIndicator` or `TypingIndicator`. A step is running: its own status mark. Don't add a spinner or shimmer beside either.
- Something else loads: `Loader`. A whole conversation loads: `status="loading"` on Conversation.
- One loop per wait, and it stops when the wait ends.
