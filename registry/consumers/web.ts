// The Web Components registry consumer's entry: every component, as `shadcn add` copies it, one section each.
import { defineAction } from "./components/ui/web/action.js";
import { defineAddMenu } from "./components/ui/web/add-menu.js";
import { defineApprovalMode } from "./components/ui/web/approval-mode.js";
import { defineAttachments } from "./components/ui/web/attachments.js";
import { defineChainOfThought } from "./components/ui/web/chain-of-thought.js";
import { defineCheckpoint } from "./components/ui/web/checkpoint.js";
import { defineCodeBlock } from "./components/ui/web/code-block.js";
import { defineComposer } from "./components/ui/web/composer.js";
import { defineConfirmation } from "./components/ui/web/confirmation.js";
import { defineContextBar } from "./components/ui/web/context-bar.js";
import { defineContextMeter } from "./components/ui/web/context-meter.js";
import { defineConversation } from "./components/ui/web/conversation.js";
import { defineDictation } from "./components/ui/web/dictation.js";
import { defineDocument } from "./components/ui/web/document.js";
import { defineFeedback } from "./components/ui/web/feedback.js";
import { defineFileTree } from "./components/ui/web/file-tree.js";
import { defineGeneratedImage } from "./components/ui/web/generated-image.js";
import { defineGuardrailNotice } from "./components/ui/web/guardrail-notice.js";
import { defineInlineCitation } from "./components/ui/web/inline-citation.js";
import { defineInternalToolbar } from "./components/ui/web/internal/toolbar.js";
import { defineLoader } from "./components/ui/web/loader.js";
import { defineMarkdown } from "./components/ui/web/markdown.js";
import { defineMarkdownTable } from "./components/ui/web/markdown-table.js";
import { defineMessage } from "./components/ui/web/message.js";
import { defineModelControl } from "./components/ui/web/model-control.js";
import { defineModelSelector } from "./components/ui/web/model-selector.js";
import { defineNotice } from "./components/ui/web/notice.js";
import { definePicker } from "./components/ui/web/picker.js";
import { definePlan } from "./components/ui/web/plan.js";
import { defineQuestion } from "./components/ui/web/question.js";
import { defineQueue } from "./components/ui/web/queue.js";
import { defineReasoning } from "./components/ui/web/reasoning.js";
import { defineReasoningEffort } from "./components/ui/web/reasoning-effort.js";
import { defineSelection } from "./components/ui/web/selection.js";
import { defineSettingsMenu } from "./components/ui/web/settings-menu.js";
import { defineSources } from "./components/ui/web/sources.js";
import { defineStackTrace } from "./components/ui/web/stack-trace.js";
import { defineStatus } from "./components/ui/web/status.js";
import { defineStep } from "./components/ui/web/step.js";
import { defineStreamingText } from "./components/ui/web/streaming-text.js";
import { defineSubagent } from "./components/ui/web/subagent.js";
import { defineSuggestion } from "./components/ui/web/suggestion.js";
import { defineTask } from "./components/ui/web/task.js";
import { defineTerminal } from "./components/ui/web/terminal.js";
import { defineTestResults } from "./components/ui/web/test-results.js";
import { defineThinkingIndicator } from "./components/ui/web/thinking-indicator.js";
import { defineTool } from "./components/ui/web/tool.js";
import { defineTranscript } from "./components/ui/web/transcript.js";
import { defineTypingIndicator } from "./components/ui/web/typing-indicator.js";
import { defineUploader } from "./components/ui/web/uploader.js";

// Wave 6 markers (AGENTS.md "Wave 6 shared-file markers"): each task adds its imports right below its own line.

// wave-6-task-2: Thread List

import { defineThreadList } from "./components/ui/web/thread-list.js";

// wave-6-task-3: Thread Search

// wave-6-task-4: Sidebar

import { defineSidebar } from "./components/ui/web/sidebar.js";

// wave-6-task-5: Launcher

import { defineLauncher } from "./components/ui/web/launcher.js";

// wave-6-task-6: Day Separator

import { defineDaySeparator } from "./components/ui/web/day-separator.js";

// wave-6-task-7: Connection Status

// wave-6-task-8: Share Dialog

// wave-6-task-9: Message author, time and outcomes

// wave-6-task-10: Conversation states

// wave-6-task-11: Conversation Search

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
  defineFeedback,
  defineNotice,
  defineGuardrailNotice,
  defineSources,
  defineInlineCitation,
  defineDocument,
  defineGeneratedImage,
  defineFileTree,
  defineTerminal,
  defineStackTrace,
  defineTestResults,
  defineTranscript,
  defineSelection,
  defineAction,
  definePicker,
  defineAddMenu,
  defineSettingsMenu,
  defineApprovalMode,
  defineModelControl,
  defineContextBar,
  defineDictation,
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

  // Wave 6 markers (AGENTS.md "Wave 6 shared-file markers"): each task adds its define function right below its own line.

  // wave-6-task-2: Thread List

  defineThreadList,

  // wave-6-task-3: Thread Search

  // wave-6-task-4: Sidebar

  defineSidebar,

  // wave-6-task-5: Launcher

  defineLauncher,

  // wave-6-task-6: Day Separator

  defineDaySeparator,

  // wave-6-task-7: Connection Status

  // wave-6-task-8: Share Dialog

  // wave-6-task-9: Message author, time and outcomes

  // wave-6-task-10: Conversation states

  // wave-6-task-11: Conversation Search
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
  feedback: `<kind-feedback can-comment></kind-feedback>`,
  notice: `<kind-notice variant="warning" label="Rate limited" can-dismiss><kind-notice-description>Responses are slower for the next few minutes.</kind-notice-description></kind-notice>`,
  "guardrail-notice": `<kind-guardrail-notice blocking label="Model output withheld" reason="The response included personal data." detail="Policy."></kind-guardrail-notice>`,
  sources: `<kind-sources></kind-sources>`,
  "inline-citation": `<p>Back off on a limit <kind-inline-citation></kind-inline-citation></p>`,
  document: `<kind-document label="README.md" content="Back off on a 429."></kind-document>`,
  "generated-image": `<kind-generated-image alt="A lighthouse at dusk" status="generating" progress="40" width="768" height="512"></kind-generated-image>`,
  "file-tree": `<kind-file-tree></kind-file-tree>`,
  "stack-trace": `<kind-stack-trace can-open-frame stack="TypeError: x is undefined
    at main (/app/src/index.ts:7:1)"></kind-stack-trace>`,
  "test-results": `<kind-test-results default-open></kind-test-results>`,
  transcript: `<kind-transcript can-seek current-time="1"></kind-transcript>`,
  selection: `<kind-selection can-run><kind-selection-content><p>Retry with backoff.</p></kind-selection-content></kind-selection>`,
  action: `<kind-action label="Explain" quote="Retry with backoff." result="Wait, then try again." status="complete"></kind-action>`,
  picker: `<kind-picker label="Work in"></kind-picker>`,
  "add-menu": `<kind-add-menu can-run></kind-add-menu>`,
  "settings-menu": `<kind-settings-menu></kind-settings-menu>`,
  "approval-mode": `<kind-approval-mode></kind-approval-mode>`,
  "model-control": `<kind-model-control></kind-model-control>`,
  "context-bar": `<kind-context-bar></kind-context-bar>`,
  dictation: `<kind-dictation></kind-dictation>`,
  terminal: `<kind-terminal command="npm test" exit-code="0" default-open></kind-terminal>`,
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

  // Wave 6 markers (AGENTS.md "Wave 6 shared-file markers"): each task adds its item right below its own line.

  // wave-6-task-2: Thread List

  "thread-list": `<kind-thread-list can-new></kind-thread-list>`,

  // wave-6-task-3: Thread Search

  // wave-6-task-4: Sidebar

  sidebar: `<kind-sidebar label="Chats" class="h-64"><kind-sidebar-panel>Chats</kind-sidebar-panel><kind-sidebar-inset><kind-sidebar-trigger><button></button></kind-sidebar-trigger></kind-sidebar-inset></kind-sidebar>`,

  // wave-6-task-5: Launcher

  launcher: `<kind-launcher><kind-launcher-content><p>How can I help?</p></kind-launcher-content></kind-launcher>`,

  // wave-6-task-6: Day Separator

  "day-separator": `<kind-day-separator date="2026-11-18"></kind-day-separator>`,

  // wave-6-task-7: Connection Status

  // wave-6-task-8: Share Dialog

  // wave-6-task-9: Message author, time and outcomes

  // wave-6-task-10: Conversation states

  // wave-6-task-11: Conversation Search
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
Object.assign(main.querySelector("kind-sources") as HTMLElement, {
  sources: [{ id: "docs", title: "Rate limits", url: "https://docs.github.com/en/rest" }],
});
Object.assign(main.querySelector("kind-terminal") as HTMLElement, { output: "\x1b[32m✓\x1b[0m 22 passed" });
Object.assign(main.querySelector("kind-test-results") as HTMLElement, {
  suites: [{ id: "math", name: "math", tests: [{ id: "sum", name: "adds", status: "pass", durationMs: 2 }] }],
});
Object.assign(main.querySelector("kind-transcript") as HTMLElement, {
  segments: [{ id: "1", speaker: "Priya", start: 0, end: 4, text: "Let's start with the checklist." }],
});
Object.assign(main.querySelector("kind-selection") as HTMLElement, {
  actions: [{ id: "ask", label: "Ask" }],
});
Object.assign(main.querySelector("kind-picker") as HTMLElement, {
  items: [{ value: "agent-ui", label: "agent-ui", description: "~/code/agent-ui" }],
  value: "agent-ui",
});
Object.assign(main.querySelector("kind-add-menu") as HTMLElement, {
  items: [{ id: "upload", label: "Upload file" }],
});
Object.assign(main.querySelector("kind-settings-menu") as HTMLElement, {
  settings: [{ type: "toggle", id: "search", label: "Web search" }],
  values: { search: true },
});
Object.assign(main.querySelector("kind-approval-mode") as HTMLElement, {
  modes: [{ value: "ask", label: "Ask every time" }],
  value: "ask",
});
Object.assign(main.querySelector("kind-file-tree") as HTMLElement, {
  entries: [{ path: "src/index.ts", change: "modified", additions: 2 }],
});
Object.assign(main.querySelector("kind-inline-citation") as HTMLElement, {
  sources: [{ id: "docs", title: "Rate limits", url: "https://docs.github.com/en/rest" }],
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
