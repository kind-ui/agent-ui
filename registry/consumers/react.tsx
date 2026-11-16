// The React registry consumer's entry: every component, as `shadcn add` copies it, one section each.
import { createRoot } from "react-dom/client";
import { Attachments } from "./components/ui/attachments.js";
import { ChainOfThought } from "./components/ui/chain-of-thought.js";
import { CodeBlock } from "./components/ui/code-block.js";
import { Composer, ComposerInput, ComposerStop, ComposerSubmit } from "./components/ui/composer.js";
import {
  Conversation,
  ConversationContent,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "./components/ui/conversation.js";
import { KindToolbar, KindToolbarButton } from "./components/ui/internal/toolbar.js";
import { Loader } from "./components/ui/loader.js";
import { Markdown } from "./components/ui/markdown.js";
import { MarkdownTable } from "./components/ui/markdown-table.js";
import { Message, MessageContent, MessageCopy, MessageToolbar } from "./components/ui/message.js";
import { Plan } from "./components/ui/plan.js";
import { Queue } from "./components/ui/queue.js";
import { Reasoning } from "./components/ui/reasoning.js";
import { Status } from "./components/ui/status.js";
import { Step, StepContent, StepIcon, StepTitle, StepTrigger } from "./components/ui/step.js";
import { StreamingText } from "./components/ui/streaming-text.js";
import { Subagent } from "./components/ui/subagent.js";
import { Task } from "./components/ui/task.js";
import { ThinkingIndicator } from "./components/ui/thinking-indicator.js";
import { Tool } from "./components/ui/tool.js";
import { TypingIndicator } from "./components/ui/typing-indicator.js";
import { Uploader } from "./components/ui/uploader.js";
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
