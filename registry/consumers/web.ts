// The Web Components registry consumer's entry: every component, as `shadcn add` copies it, one section each.
import { defineAttachments } from "./components/ui/web/attachments.js";
import { defineCodeBlock } from "./components/ui/web/code-block.js";
import { defineComposer } from "./components/ui/web/composer.js";
import { defineConversation } from "./components/ui/web/conversation.js";
import { defineInternalToolbar } from "./components/ui/web/internal/toolbar.js";
import { defineLoader } from "./components/ui/web/loader.js";
import { defineMarkdown } from "./components/ui/web/markdown.js";
import { defineMarkdownTable } from "./components/ui/web/markdown-table.js";
import { defineMessage } from "./components/ui/web/message.js";
import { defineReasoning } from "./components/ui/web/reasoning.js";
import { defineStatus } from "./components/ui/web/status.js";
import { defineStep } from "./components/ui/web/step.js";
import { defineStreamingText } from "./components/ui/web/streaming-text.js";
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
Object.assign(main.querySelector("kind-attachments") as HTMLElement, {
  items: [{ id: "notes", name: "notes.md", size: 812, mediaType: "text/markdown" }],
});
Object.assign(main.querySelector("kind-uploader") as HTMLElement, {
  items: [{ id: "report", name: "report.pdf", size: 2_400_000, progress: 42, status: "uploading" }],
});
