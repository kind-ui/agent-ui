// The Web Components registry consumer's entry: every component, as `shadcn add` copies it, one section each.
import { defineAttachments } from "./components/ui/web/attachments.js";
import { defineChainOfThought } from "./components/ui/web/chain-of-thought.js";
import { defineCheckpoint } from "./components/ui/web/checkpoint.js";
import { defineCodeBlock } from "./components/ui/web/code-block.js";
import { defineComposer } from "./components/ui/web/composer.js";
import { defineConfirmation } from "./components/ui/web/confirmation.js";
import { defineContextMeter } from "./components/ui/web/context-meter.js";
import { defineConversation } from "./components/ui/web/conversation.js";
import { defineInternalToolbar } from "./components/ui/web/internal/toolbar.js";
import { defineLoader } from "./components/ui/web/loader.js";
import { defineMarkdown } from "./components/ui/web/markdown.js";
import { defineMarkdownTable } from "./components/ui/web/markdown-table.js";
import { defineMessage } from "./components/ui/web/message.js";
import { defineModelSelector } from "./components/ui/web/model-selector.js";
import { definePlan } from "./components/ui/web/plan.js";
import { defineQuestion } from "./components/ui/web/question.js";
import { defineQueue } from "./components/ui/web/queue.js";
import { defineReasoning } from "./components/ui/web/reasoning.js";
import { defineReasoningEffort } from "./components/ui/web/reasoning-effort.js";
import { defineStatus } from "./components/ui/web/status.js";
import { defineStep } from "./components/ui/web/step.js";
import { defineStreamingText } from "./components/ui/web/streaming-text.js";
import { defineSubagent } from "./components/ui/web/subagent.js";
import { defineSuggestion } from "./components/ui/web/suggestion.js";
import { defineTask } from "./components/ui/web/task.js";
import { defineThinkingIndicator } from "./components/ui/web/thinking-indicator.js";
import { defineTool } from "./components/ui/web/tool.js";
import { defineTypingIndicator } from "./components/ui/web/typing-indicator.js";
import { defineUploader } from "./components/ui/web/uploader.js";
import "./index.css";

for (const define of [
  defineStep,
  defineStatus,
  defineReasoning,
  defineTool,
  defineChainOfThought,
  defineTask,
  definePlan,
  defineSubagent,
  defineQueue,
  defineConfirmation,
  defineQuestion,
  defineCheckpoint,
  defineModelSelector,
  defineReasoningEffort,
  defineSuggestion,
  defineContextMeter,
  defineConversation,
  defineMessage,
  defineInternalToolbar,
  defineMarkdown,
  defineCodeBlock,
  defineMarkdownTable,
  defineComposer,
  defineAttachments,
  defineUploader,
  defineLoader,
  defineThinkingIndicator,
  defineTypingIndicator,
  defineStreamingText,
]) {
  define();
}

const items = {
  step: `<kind-step status="complete">
      <kind-step-trigger><button><kind-step-icon></kind-step-icon><kind-step-title>Read the logs</kind-step-title></button></kind-step-trigger>
      <kind-step-content><p>Three timeouts.</p></kind-step-content>
    </kind-step>`,
  status: `<kind-status status="running"></kind-status>`,
  reasoning: `<kind-reasoning status="complete" duration-seconds="3" text="Checked **two** sources." default-open></kind-reasoning>`,
  tool: `<kind-tool default-open></kind-tool>`,
  "chain-of-thought": `<kind-chain-of-thought label="Researching flights" status="complete" default-open></kind-chain-of-thought>`,
  task: `<kind-task label="Migrating the users table" default-open></kind-task>`,
  plan: `<kind-plan label="Migration plan" default-open></kind-plan>`,
  subagent: `<kind-subagent agent-name="Code reviewer" status="complete" result="No issues found." default-open>
      <kind-subagent-content><p>Read two files.</p></kind-subagent-content>
    </kind-subagent>`,
  queue: `<kind-queue label="Queue"></kind-queue>`,
  confirmation: `<kind-confirmation label="Run search_docs?" can-approve can-deny reason></kind-confirmation>`,
  question: `<kind-question label="Deploy questions" can-submit></kind-question>`,
  checkpoint: `<kind-checkpoint description="Before editing auth.ts" can-restore></kind-checkpoint>`,
  "model-selector": `<kind-model-selector></kind-model-selector>`,
  "reasoning-effort": `<kind-reasoning-effort></kind-reasoning-effort>`,
  suggestion: `<kind-suggestion can-pick></kind-suggestion>`,
  "context-meter": `<kind-context-meter used="57600" total="128000" cost="0.42"></kind-context-meter>`,
  conversation: `<kind-conversation aria-label="Chat" message-count="1" class="h-40">
      <kind-conversation-viewport>
        <kind-conversation-content>
          <kind-conversation-row value="first" index="0"><p>Hello.</p></kind-conversation-row>
        </kind-conversation-content>
      </kind-conversation-viewport>
      <kind-conversation-jump><button hidden></button></kind-conversation-jump>
    </kind-conversation>`,
  message: `<kind-message aria-label="Reply" message-role="assistant" text="Retry with backoff.">
      <kind-message-content>Retry with backoff.</kind-message-content>
      <kind-message-toolbar>
        <kind-internal-toolbar><ui-toolbar aria-label="Reply actions">
          <kind-message-copy><ui-toolbar-button><button aria-label="Copy"></button></ui-toolbar-button></kind-message-copy>
        </ui-toolbar></kind-internal-toolbar>
      </kind-message-toolbar>
    </kind-message>`,
  markdown: `<kind-markdown></kind-markdown>`,
  "code-block": `<kind-code-block aria-label="Code" language="ts" code="const a = 1;"></kind-code-block>`,
  "markdown-table": `<kind-markdown-table aria-label="Table">
      <table><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Step</td></tr></tbody></table>
    </kind-markdown-table>`,
  composer: `<kind-composer>
      <form aria-label="Message">
        <kind-composer-input><ui-token-input><ui-token-input-editor aria-label="Prompt"></ui-token-input-editor></ui-token-input></kind-composer-input>
        <kind-composer-submit><button></button></kind-composer-submit>
        <kind-composer-stop><button></button></kind-composer-stop>
      </form>
    </kind-composer>`,
  attachments: `<kind-attachments aria-label="Files"></kind-attachments>`,
  uploader: `<kind-uploader aria-label="Uploads"></kind-uploader>`,
  loader: `<kind-loader></kind-loader>`,
  "thinking-indicator": `<kind-thinking-indicator></kind-thinking-indicator>`,
  "typing-indicator": `<kind-typing-indicator></kind-typing-indicator>`,
  "streaming-text": `<kind-streaming-text text="Streaming text" caret></kind-streaming-text>`,
};

const main = document.createElement("main");
main.className = "flex max-w-xl flex-col gap-6 p-6";
main.innerHTML = Object.entries(items)
  .map(([name, markup]) => `<section data-item="${name}">${markup}</section>`)
  .join("");
document.body.append(main);

main
  .querySelector("kind-markdown")
  ?.setAttribute("source", "# Title\n\nSome **bold** text.\n\n```ts\nconst a = 1;\n```\n");
Object.assign(main.querySelector("kind-tool") as HTMLElement, {
  call: {
    toolCallId: "t1",
    name: "search_docs",
    dynamic: false,
    input: { state: "ready", value: { query: "steps" } },
    output: { state: "available", value: 0 },
  },
});
Object.assign(main.querySelector("kind-confirmation") as HTMLElement, {
  approval: { approvalId: "a1", generation: 1, state: "requested" },
});
Object.assign(main.querySelector("kind-question") as HTMLElement, {
  questions: [
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
  ],
});
Object.assign(main.querySelector("kind-suggestion") as HTMLElement, {
  suggestions: [{ id: "a", label: "Summarize this thread" }],
});
Object.assign(main.querySelector("kind-chain-of-thought") as HTMLElement, {
  steps: [{ id: "search", status: "complete", title: "Search flights", durationSeconds: 3 }],
});
Object.assign(main.querySelector("kind-task") as HTMLElement, {
  items: [{ id: "schema", status: "complete", title: "Read the schema", files: ["db/schema.sql"] }],
});
Object.assign(main.querySelector("kind-plan") as HTMLElement, {
  items: [{ id: "audit", status: "complete", title: "Audit the current schema" }],
});
Object.assign(main.querySelector("kind-attachments") as HTMLElement, {
  items: [{ id: "notes", name: "notes.md", size: 812, mediaType: "text/markdown" }],
});
Object.assign(main.querySelector("kind-uploader") as HTMLElement, {
  items: [{ id: "report", name: "report.pdf", size: 2_400_000, progress: 42, status: "uploading" }],
});
