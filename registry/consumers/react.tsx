// The React registry consumer's entry: every component, as `shadcn add` copies it, one section each.
import { createRoot } from "react-dom/client";
import { Action } from "./components/ui/action.js";
import { AddMenu } from "./components/ui/add-menu.js";
import { ApprovalMode } from "./components/ui/approval-mode.js";
import { Attachments } from "./components/ui/attachments.js";
import { ChainOfThought } from "./components/ui/chain-of-thought.js";
import { Checkpoint } from "./components/ui/checkpoint.js";
import { CodeBlock } from "./components/ui/code-block.js";
import { Composer, ComposerInput, ComposerStop, ComposerSubmit } from "./components/ui/composer.js";
import { Confirmation } from "./components/ui/confirmation.js";
import { ContextBar } from "./components/ui/context-bar.js";
import { ContextMeter } from "./components/ui/context-meter.js";
import {
  Conversation,
  ConversationContent,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "./components/ui/conversation.js";
import { Dictation } from "./components/ui/dictation.js";
import { Document } from "./components/ui/document.js";
import { Feedback } from "./components/ui/feedback.js";
import { FileTree } from "./components/ui/file-tree.js";
import { GeneratedImage } from "./components/ui/generated-image.js";
import { GuardrailNotice } from "./components/ui/guardrail-notice.js";
import { InlineCitation } from "./components/ui/inline-citation.js";
import { KindToolbar, KindToolbarButton } from "./components/ui/internal/toolbar.js";
import { Loader } from "./components/ui/loader.js";
import { Markdown } from "./components/ui/markdown.js";
import { MarkdownTable } from "./components/ui/markdown-table.js";
import { Message, MessageContent, MessageCopy, MessageToolbar } from "./components/ui/message.js";
import { ModelControl } from "./components/ui/model-control.js";
import { ModelSelector } from "./components/ui/model-selector.js";
import { Notice } from "./components/ui/notice.js";
import { Picker } from "./components/ui/picker.js";
import { Plan } from "./components/ui/plan.js";
import { Question } from "./components/ui/question.js";
import { Queue } from "./components/ui/queue.js";
import { Reasoning } from "./components/ui/reasoning.js";
import { ReasoningEffort } from "./components/ui/reasoning-effort.js";
import { Selection } from "./components/ui/selection.js";
import { SettingsMenu } from "./components/ui/settings-menu.js";
import { Sources } from "./components/ui/sources.js";
import { StackTrace } from "./components/ui/stack-trace.js";
import { Status } from "./components/ui/status.js";
import { Step, StepContent, StepIcon, StepTitle, StepTrigger } from "./components/ui/step.js";
import { StreamingText } from "./components/ui/streaming-text.js";
import { Subagent } from "./components/ui/subagent.js";
import { Suggestion } from "./components/ui/suggestion.js";
import { Task } from "./components/ui/task.js";
import { Terminal } from "./components/ui/terminal.js";
import { TestResults } from "./components/ui/test-results.js";
import { ThinkingIndicator } from "./components/ui/thinking-indicator.js";
import { Tool } from "./components/ui/tool.js";
import { Transcript } from "./components/ui/transcript.js";
import { TypingIndicator } from "./components/ui/typing-indicator.js";
import { Uploader } from "./components/ui/uploader.js";

// Wave 6 markers (AGENTS.md "Wave 6 shared-file markers"): each task adds its imports right below its own line.

// wave-6-task-2: Thread List

import { ThreadList } from "./components/ui/thread-list.js";

// wave-6-task-3: Thread Search

// wave-6-task-4: Sidebar

import {
  Sidebar,
  SidebarHandle,
  SidebarInset,
  SidebarPanel,
  SidebarTrigger,
} from "./components/ui/sidebar.js";

// wave-6-task-5: Launcher

import { Launcher } from "./components/ui/launcher.js";

// wave-6-task-6: Day Separator

import { DaySeparator } from "./components/ui/day-separator.js";

// wave-6-task-7: Connection Status

import { ConnectionStatus } from "./components/ui/connection-status.js";

// wave-6-task-8: Share Dialog

import { ShareDialog } from "./components/ui/share-dialog.js";

// wave-6-task-9: Message author, time and outcomes

// wave-6-task-10: Conversation states

// wave-6-task-11: Conversation Search

import "./index.css";

const items = {
  step: (
    <Step status="complete">
      <StepTrigger>
        <StepIcon />
        <StepTitle>Read the logs</StepTitle>
      </StepTrigger>
      <StepContent>
        <p>Three timeouts.</p>
      </StepContent>
    </Step>
  ),
  status: <Status status="running" />,
  reasoning: <Reasoning status="complete" durationSeconds={3} text="Checked **two** sources." defaultOpen />,
  tool: (
    <Tool
      call={{
        toolCallId: "t1",
        name: "search_docs",
        dynamic: false,
        input: { state: "ready", value: { query: "steps" } },
        output: { state: "available", value: 0 },
      }}
      defaultOpen
    />
  ),
  "chain-of-thought": (
    <ChainOfThought
      label="Researching flights"
      status="complete"
      steps={[{ id: "search", status: "complete", title: "Search flights", durationSeconds: 3 }]}
      defaultOpen
    />
  ),
  task: (
    <Task
      label="Migrating the users table"
      items={[{ id: "schema", status: "complete", title: "Read the schema", files: ["db/schema.sql"] }]}
      defaultOpen
    />
  ),
  plan: (
    <Plan
      label="Migration plan"
      items={[{ id: "audit", status: "complete", title: "Audit the current schema" }]}
      defaultOpen
    />
  ),
  subagent: (
    <Subagent agentName="Code reviewer" status="complete" result="No issues found." defaultOpen>
      <p>Read two files.</p>
    </Subagent>
  ),
  queue: <Queue label="Queue" items={[{ id: "tests", status: "pending", title: "Write the tests" }]} />,
  confirmation: (
    <Confirmation
      label="Run search_docs?"
      approval={{ approvalId: "a1", generation: 1, state: "requested" }}
      onApprove={() => {}}
      onDeny={() => {}}
      reason
    />
  ),
  question: (
    <Question
      label="Deploy questions"
      questions={[
        {
          id: "env",
          prompt: "Where should it deploy?",
          kind: "single",
          required: true,
          options: [
            { value: "staging", label: "Staging" },
            { value: "prod", label: "Production" },
          ],
        },
      ]}
      onSubmit={() => {}}
    />
  ),
  checkpoint: <Checkpoint description="Before editing auth.ts" onRestore={() => {}} />,
  "model-selector": (
    <ModelSelector
      models={[{ id: "sonnet-4", name: "Sonnet 4", group: "Anthropic" }]}
      defaultValue="sonnet-4"
    />
  ),
  "reasoning-effort": <ReasoningEffort defaultValue="medium" />,
  suggestion: <Suggestion suggestions={[{ id: "a", label: "Summarize this thread" }]} onPick={() => {}} />,
  "context-meter": <ContextMeter used={57_600} total={128_000} usage={{ input: 40_000 }} cost={0.42} />,
  feedback: <Feedback defaultRating="up" onComment={() => {}} />,
  notice: (
    <Notice variant="warning" label="Rate limited" onDismiss={() => {}}>
      Responses are slower for the next few minutes.
    </Notice>
  ),
  "guardrail-notice": (
    <GuardrailNotice
      blocking
      label="Model output withheld"
      reason="The response included personal data."
      detail="Policy."
    />
  ),
  sources: (
    <Sources sources={[{ id: "docs", title: "Rate limits", url: "https://docs.github.com/en/rest" }]} />
  ),
  "inline-citation": (
    <p>
      Back off on a limit{" "}
      <InlineCitation
        sources={[{ id: "docs", title: "Rate limits", url: "https://docs.github.com/en/rest" }]}
      />
    </p>
  ),
  document: <Document label="README.md" content={"# Rate limits\n\nBack off on a 429."} />,
  "generated-image": (
    <GeneratedImage alt="A lighthouse at dusk" status="generating" progress={40} width={768} height={512} />
  ),
  "file-tree": <FileTree entries={[{ path: "src/index.ts", change: "modified", additions: 2 }]} />,
  "stack-trace": (
    <StackTrace
      stack={"TypeError: x is undefined\n    at main (/app/src/index.ts:7:1)"}
      onOpenFrame={() => {}}
    />
  ),
  "test-results": (
    <TestResults
      defaultOpen
      suites={[
        {
          id: "math",
          name: "math",
          tests: [
            { id: "sum", name: "adds", status: "pass", durationMs: 2 },
            { id: "div", name: "divides", status: "fail", error: { message: "Error: divided by zero" } },
          ],
        },
      ]}
    />
  ),
  transcript: (
    <Transcript
      segments={[{ id: "1", speaker: "Priya", start: 0, end: 4, text: "Let's start with the checklist." }]}
      currentTime={1}
      onSeek={() => {}}
    />
  ),
  selection: (
    <Selection actions={[{ id: "ask", label: "Ask" }]} onAction={() => {}}>
      <p>Retry with backoff.</p>
    </Selection>
  ),
  action: (
    <Action label="Explain" quote="Retry with backoff." result="Wait, then try again." status="complete" />
  ),
  picker: (
    <Picker
      label="Work in"
      items={[{ value: "agent-ui", label: "agent-ui", description: "~/code/agent-ui" }]}
      defaultValue="agent-ui"
    />
  ),
  "add-menu": <AddMenu items={[{ id: "upload", label: "Upload file" }]} onAction={() => {}} />,
  "settings-menu": (
    <SettingsMenu
      settings={[{ type: "toggle", id: "search", label: "Web search" }]}
      defaultValues={{ search: true }}
    />
  ),
  "approval-mode": <ApprovalMode modes={[{ value: "ask", label: "Ask every time" }]} defaultValue="ask" />,
  "model-control": (
    <ModelControl
      models={[{ id: "gpt-5", name: "GPT-5" }]}
      levels={[{ value: "high", label: "High" }]}
      defaultModel="gpt-5"
    />
  ),
  "context-bar": <ContextBar chips={[{ id: "readme", label: "README.md", kind: "file" }]} />,
  dictation: <Dictation source={{ async *start() {} }} />,
  terminal: <Terminal command="npm test" output={"\x1b[32m✓\x1b[0m 22 passed"} exitCode={0} defaultOpen />,
  conversation: (
    <Conversation aria-label="Chat" messageCount={1} className="h-40">
      <ConversationViewport>
        <ConversationContent>
          <ConversationRow value="first" index={0}>
            <p>Hello.</p>
          </ConversationRow>
        </ConversationContent>
      </ConversationViewport>
      <ConversationJump />
    </Conversation>
  ),
  message: (
    <Message aria-label="Reply" messageRole="assistant" text="Retry with backoff.">
      <MessageContent>Retry with backoff.</MessageContent>
      <MessageToolbar>
        <KindToolbar aria-label="Reply actions">
          <MessageCopy>
            <KindToolbarButton aria-label="Copy" />
          </MessageCopy>
        </KindToolbar>
      </MessageToolbar>
    </Message>
  ),
  markdown: <Markdown source={"# Title\n\nSome **bold** text.\n\n```ts\nconst a = 1;\n```\n"} />,
  "code-block": <CodeBlock aria-label="Code" code="const a = 1;" language="ts" />,
  "markdown-table": (
    <MarkdownTable aria-label="Table">
      <thead>
        <tr>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Step</td>
        </tr>
      </tbody>
    </MarkdownTable>
  ),
  composer: (
    <Composer aria-label="Message">
      <ComposerInput aria-label="Prompt" />
      <ComposerSubmit />
      <ComposerStop />
    </Composer>
  ),
  attachments: (
    <Attachments
      aria-label="Files"
      items={[{ id: "notes", name: "notes.md", size: 812, mediaType: "text/markdown" }]}
    />
  ),
  uploader: (
    <Uploader
      aria-label="Uploads"
      items={[{ id: "report", name: "report.pdf", size: 2_400_000, progress: 42, status: "uploading" }]}
    />
  ),
  loader: <Loader />,
  "thinking-indicator": <ThinkingIndicator />,
  "typing-indicator": <TypingIndicator />,
  "streaming-text": <StreamingText text="Streaming text" caret />,

  // Wave 6 markers (AGENTS.md "Wave 6 shared-file markers"): each task adds its item right below its own line.

  // wave-6-task-2: Thread List

  "thread-list": (
    <ThreadList threads={[{ id: "a", title: "First chat", href: "#a" }]} now="2026-11-18" onNew={() => {}} />
  ),

  // wave-6-task-3: Thread Search

  // wave-6-task-4: Sidebar

  sidebar: (
    <Sidebar label="Chats" className="h-64">
      <SidebarPanel>Chats</SidebarPanel>
      <SidebarHandle />
      <SidebarInset>
        <SidebarTrigger />
      </SidebarInset>
    </Sidebar>
  ),

  // wave-6-task-5: Launcher

  launcher: (
    <Launcher>
      <p>How can I help?</p>
    </Launcher>
  ),

  // wave-6-task-6: Day Separator

  "day-separator": <DaySeparator date="2026-11-18" />,

  // wave-6-task-7: Connection Status

  "connection-status": <ConnectionStatus state="offline" onRetry={() => {}} />,

  // wave-6-task-8: Share Dialog

  "share-dialog": <ShareDialog link="https://example.com/s/abc" defaultVisibility="link" />,

  // wave-6-task-9: Message author, time and outcomes

  // wave-6-task-10: Conversation states

  // wave-6-task-11: Conversation Search
};

createRoot(document.getElementById("root") as HTMLElement).render(
  <main className="flex max-w-xl flex-col gap-6 p-6">
    {Object.entries(items).map(([name, element]) => (
      <section key={name} data-item={name}>
        {element}
      </section>
    ))}
  </main>,
);
