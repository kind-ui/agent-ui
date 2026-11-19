import { createConversationController } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/web/agent";
import { defineAction } from "../../../../src/web/action.js";
import { defineAddMenu } from "../../../../src/web/add-menu.js";
import { defineApprovalMode } from "../../../../src/web/approval-mode.js";
import { defineAttachments, type KindAttachmentsElement } from "../../../../src/web/attachments.js";
import { defineChainOfThought } from "../../../../src/web/chain-of-thought.js";
import { defineCheckpoint } from "../../../../src/web/checkpoint.js";
import { defineComposer, type KindComposerElement } from "../../../../src/web/composer.js";
import { defineConfirmation } from "../../../../src/web/confirmation.js";
import { defineConnectionStatus } from "../../../../src/web/connection-status.js";
import { defineContextBar } from "../../../../src/web/context-bar.js";
import { defineContextMeter } from "../../../../src/web/context-meter.js";
import { defineConversation, type KindConversationElement } from "../../../../src/web/conversation.js";
import { defineConversationSearch } from "../../../../src/web/conversation-search.js";
import { defineDaySeparator } from "../../../../src/web/day-separator.js";
import { defineDictation } from "../../../../src/web/dictation.js";
import { defineDocument } from "../../../../src/web/document.js";
import { defineFeedback } from "../../../../src/web/feedback.js";
import { defineFileTree } from "../../../../src/web/file-tree.js";
import { defineGeneratedImage } from "../../../../src/web/generated-image.js";
import { defineGuardrailNotice } from "../../../../src/web/guardrail-notice.js";
import { defineInlineCitation } from "../../../../src/web/inline-citation.js";
import { defineInternalMenu } from "../../../../src/web/internal/menu.js";
import { defineInternalToolbar } from "../../../../src/web/internal/toolbar.js";
import { defineLauncher } from "../../../../src/web/launcher.js";
import { defineLoader } from "../../../../src/web/loader.js";
import { defineMarkdown } from "../../../../src/web/markdown.js";
import { defineMessage } from "../../../../src/web/message.js";
import { defineModelControl } from "../../../../src/web/model-control.js";
import { defineModelSelector } from "../../../../src/web/model-selector.js";
import { defineNotice } from "../../../../src/web/notice.js";
import { definePicker } from "../../../../src/web/picker.js";
import { definePlan } from "../../../../src/web/plan.js";
import { defineQuestion } from "../../../../src/web/question.js";
import { defineQueue } from "../../../../src/web/queue.js";
import { defineReasoning } from "../../../../src/web/reasoning.js";
import { defineReasoningEffort } from "../../../../src/web/reasoning-effort.js";
import { defineSelection } from "../../../../src/web/selection.js";
import { defineSettingsMenu } from "../../../../src/web/settings-menu.js";
import { defineShareDialog } from "../../../../src/web/share-dialog.js";
import { defineSidebar } from "../../../../src/web/sidebar.js";
import { defineSources } from "../../../../src/web/sources.js";
import { defineStackTrace } from "../../../../src/web/stack-trace.js";
import { defineStatus } from "../../../../src/web/status.js";
import { defineStep, defineStepList } from "../../../../src/web/step.js";
import { defineStreamingText } from "../../../../src/web/streaming-text.js";
import { defineSubagent } from "../../../../src/web/subagent.js";
import { defineSuggestion } from "../../../../src/web/suggestion.js";
import { defineTask } from "../../../../src/web/task.js";
import { defineTerminal } from "../../../../src/web/terminal.js";
import { defineTestResults } from "../../../../src/web/test-results.js";
import { defineThinkingIndicator } from "../../../../src/web/thinking-indicator.js";
import { defineThreadList } from "../../../../src/web/thread-list.js";
import { defineThreadSearch } from "../../../../src/web/thread-search.js";
import { defineTool } from "../../../../src/web/tool.js";
import { defineTranscript } from "../../../../src/web/transcript.js";
import { defineTypingIndicator } from "../../../../src/web/typing-indicator.js";
import { defineUploader, type KindUploaderElement } from "../../../../src/web/uploader.js";
import { addItems } from "../../shared/add-menu.js";
import {
  agentDrafts,
  agentHost,
  approvalCall,
  chainSteps,
  draftKey,
  files,
  filler,
  moveItem,
  planItems,
  question,
  queueItems,
  replies,
  selectionActions,
  shellMessages,
  steps,
  taskItems,
  thoughts,
  toolCalls,
} from "../../shared/agent.js";
import { learnMoreHref, modes } from "../../shared/approval-mode.js";
import { commands, mentions } from "../../shared/composer.js";
import { contextChips } from "../../shared/context-bar.js";
import { context } from "../../shared/context-meter.js";
import { dictationHost } from "../../shared/dictation.js";
import { downloads, readme } from "../../shared/document.js";
import { entries } from "../../shared/file-tree.js";
import { lighthouse, size } from "../../shared/generated-image.js";
import { answer } from "../../shared/markdown.js";
import { author, outcomeError, outcomeText, regenerateOptions } from "../../shared/message.js";
import {
  levels as controlLevels,
  models as controlModels,
  settings as controlSettings,
} from "../../shared/model-control.js";
import { levels, modelActions, models } from "../../shared/model-selector.js";
import { guardrails, type NoticeData, notices } from "../../shared/notice.js";
import { placeActions, places } from "../../shared/picker.js";
import { deployQuestions } from "../../shared/question.js";
import { initialValues, settings } from "../../shared/settings-menu.js";
import { shareLink } from "../../shared/share-dialog.js";
import { sources } from "../../shared/sources.js";
import { typeErrorStack } from "../../shared/stack-trace.js";
import { suggestions } from "../../shared/suggestion.js";
import { installRun } from "../../shared/terminal.js";
import { suites } from "../../shared/test-results.js";
import { NOW, threads } from "../../shared/thread-list.js";
import { standup } from "../../shared/transcript.js";
import { uploads } from "../../shared/uploader.js";

const host = agentHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

const confirmable: { agentConfirm: boolean }[] = [];
host.confirm = (on) => {
  for (const element of confirmable) element.agentConfirm = on;
};

const recordChange = (component: string, event: CustomEvent<{ source: string }>) =>
  host.change(component, {
    source: event.detail.source,
    cancel: () => event.preventDefault(),
  });

const button = (slot: string, label: string) =>
  `<kind-message-${slot}><ui-toolbar-button><button aria-label="${label}"></button></ui-toolbar-button></kind-message-${slot}>`;

const markup = `
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section data-case="step">
      <kind-step-list aria-label="Agent steps">
        ${steps
          .map(
            (step) => `
          <kind-step status="complete"${step.open ? " default-open" : ""}>
            <kind-step-list-item value="${step.id}">
              <kind-step-trigger><button><kind-step-icon></kind-step-icon><kind-step-title>${step.title}</kind-step-title></button></kind-step-trigger>
            </kind-step-list-item>
            <kind-step-content><p>${step.body}</p></kind-step-content>
          </kind-step>`,
          )
          .join("")}
      </kind-step-list>
    </section>
    <section data-case="conversation">
      <kind-conversation aria-label="Chat" message-count="${filler.length + 2}" class="h-[24rem]">
        <kind-conversation-viewport>
          <kind-conversation-content>
            ${filler.map((line, index) => `<kind-conversation-row value="f${index}" index="${index}"><p>${line}</p></kind-conversation-row>`).join("")}
            <kind-conversation-row value="question" index="${filler.length}">
              <kind-message aria-label="Question" message-role="user" can-edit>
                <kind-message-content></kind-message-content>
                <kind-message-editor><textarea hidden></textarea></kind-message-editor>
                <kind-message-toolbar>
                  <kind-internal-toolbar><ui-toolbar aria-label="Question actions">${button("edit", "Edit")}</ui-toolbar></kind-internal-toolbar>
                </kind-message-toolbar>
              </kind-message>
            </kind-conversation-row>
            <kind-conversation-row value="reply" index="${filler.length + 1}">
              <kind-message aria-label="Reply" message-role="assistant" branch-count="${replies.length}" can-regenerate>
                <kind-message-content><kind-markdown></kind-markdown></kind-message-content>
                <kind-message-toolbar>
                  <kind-message-branch hidden>
                    <kind-message-branch-previous><button></button></kind-message-branch-previous>
                    <kind-message-branch-label></kind-message-branch-label>
                    <kind-message-branch-next><button></button></kind-message-branch-next>
                  </kind-message-branch>
                  <kind-internal-toolbar><ui-toolbar aria-label="Reply actions">${button("copy", "Copy")}${button("regenerate", "Regenerate")}</ui-toolbar></kind-internal-toolbar>
                </kind-message-toolbar>
              </kind-message>
            </kind-conversation-row>
          </kind-conversation-content>
        </kind-conversation-viewport>
        <kind-conversation-jump><button hidden></button></kind-conversation-jump>
      </kind-conversation>
    </section>
    <section data-case="composer">
      <kind-composer can-stop>
        <form aria-label="Compose">
          <ui-file-input>
            <ui-file-input-dropzone>
              <kind-composer-attachments><kind-attachments aria-label="Attachments"></kind-attachments></kind-composer-attachments>
              <kind-composer-input>
                <ui-token-input>
                  <ui-token-input-editor aria-label="Prompt"></ui-token-input-editor>
                  <kind-composer-trigger-menu>
                    <kind-internal-trigger-menu>
                      <ui-trigger-menu>
                        <ui-trigger-menu-content>
                          <ui-trigger-menu-empty>No matches</ui-trigger-menu-empty>
                          <ui-trigger-menu-list></ui-trigger-menu-list>
                        </ui-trigger-menu-content>
                      </ui-trigger-menu>
                    </kind-internal-trigger-menu>
                  </kind-composer-trigger-menu>
                </ui-token-input>
              </kind-composer-input>
              <ui-file-input-trigger><button type="button" aria-label="Attach files"></button></ui-file-input-trigger>
              <kind-composer-submit><button></button></kind-composer-submit>
              <kind-composer-stop><button></button></kind-composer-stop>
            </ui-file-input-dropzone>
          </ui-file-input>
        </form>
      </kind-composer>
    </section>
    <section data-case="attachments">
      <kind-attachments aria-label="Files" can-remove></kind-attachments>
    </section>
    <section data-case="uploader">
      <kind-uploader aria-label="Uploads" can-cancel can-retry></kind-uploader>
    </section>
    <section data-case="indicators" class="flex flex-col items-start gap-4">
      <kind-loader></kind-loader>
      <kind-thinking-indicator></kind-thinking-indicator>
      <kind-typing-indicator></kind-typing-indicator>
      <p><kind-streaming-text text="Streaming text fades in"></kind-streaming-text></p>
    </section>
  </div>`;

function wireMessages(root: HTMLElement) {
  const [user, reply] = root.querySelectorAll("kind-message");
  const content = user?.querySelector("kind-message-content") as HTMLElement;
  const ask = (text: string) => {
    user?.setAttribute("text", text);
    content.textContent = text;
  };
  ask(question);
  user?.addEventListener("edit", (event) => ask(event.detail.value));

  const markdown = reply?.querySelector("kind-markdown") as HTMLElement;
  const show = (index: number) => {
    reply?.setAttribute("text", replies[index] as string);
    reply?.setAttribute("branch-index", String(index));
    markdown.setAttribute("source", index === 0 ? answer : (replies[index] as string));
  };
  show(0);
  reply?.addEventListener("branchchange", (event) => {
    if (recordChange("message", event)) show(event.detail.value);
  });
  reply?.addEventListener("regenerate", () => host.calls.push("regenerate"));
}

function wireComposer(root: HTMLElement) {
  const composer = root.querySelector("kind-composer") as KindComposerElement;
  Object.assign(composer, { mentions, commands });
  composer.addEventListener("composersubmit", ({ detail }) => detail.waitUntil(host.submit(detail.value)));
  composer.addEventListener("stop", host.stop);
  composer.addEventListener("valuechange", (event) => recordChange("composer", event));
}

function wireAttachments(root: HTMLElement) {
  const list = root.querySelector('kind-attachments[aria-label="Files"]') as KindAttachmentsElement;
  list.items = files;
  list.addEventListener("remove", (event) => {
    const id = event.detail.value;
    list.items = list.items?.filter((item) => item.id !== id);
  });
}

function wireUploader(root: HTMLElement) {
  const uploader = root.querySelector("kind-uploader") as KindUploaderElement;
  uploader.items = uploads;
  const { onCancel, onRetry } = host.uploads((change) => {
    uploader.items = change(uploader.items ?? []);
  });
  uploader.addEventListener("uploadcancel", (event) => onCancel(event.detail.value));
  uploader.addEventListener("uploadretry", (event) => onRetry(event.detail.value));
}

const activity = `
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section data-case="status"><kind-status id="status" status="running" label="Deploying"></kind-status></section>
    <section data-case="reasoning">
      <kind-reasoning id="reasoning" duration-seconds="3" status="complete"></kind-reasoning>
    </section>
    <section data-case="tool" class="flex flex-col gap-2">
      ${toolCalls.map((call) => `<kind-tool id="${call.toolCallId}"></kind-tool>`).join("")}
    </section>
    <section data-case="chain-of-thought">
      <kind-chain-of-thought id="chain" label="Researching retries" status="complete"></kind-chain-of-thought>
    </section>
    <section data-case="task"><kind-task id="task" label="Patching the client"></kind-task></section>
    <section data-case="plan">
      <kind-plan id="plan" label="Retry plan" status="awaiting-input" can-accept></kind-plan>
    </section>
    <section data-case="subagent">
      <kind-subagent id="subagent" agent-name="Code reviewer" status="running" can-cancel></kind-subagent>
    </section>
    <section data-case="queue"><kind-queue id="queue" label="Queue" can-reorder can-remove></kind-queue></section>
  </div>`;

function wireActivity(root: HTMLElement) {
  const element = <Tag extends keyof HTMLElementTagNameMap>(tag: Tag, id: string) =>
    root.querySelector(`${tag}#${id}`) as HTMLElementTagNameMap[Tag];
  const reasoning = element("kind-reasoning", "reasoning");
  reasoning.setAttribute("text", thoughts);
  reasoning.addEventListener("openchange", (event) => recordChange("reasoning", event));
  for (const call of toolCalls) element("kind-tool", call.toolCallId).call = call;
  const chain = element("kind-chain-of-thought", "chain");
  chain.steps = chainSteps;
  chain.addEventListener("openstepschange", (event) => recordChange("chain", event));
  element("kind-task", "task").items = taskItems;
  const plan = element("kind-plan", "plan");
  plan.items = planItems;
  plan.addEventListener("accept", () => host.calls.push("accept"));
  const subagent = element("kind-subagent", "subagent");
  subagent.addEventListener("subagentcancel", () => host.calls.push("cancel"));
  confirmable.push(plan, subagent);
  const queue = element("kind-queue", "queue");
  queue.items = queueItems;
  queue.addEventListener("reorder", (event) => {
    const { value, index } = event.detail;
    if (recordChange("queue", event)) queue.items = moveItem(queue.items ?? [], value, index);
  });
  queue.addEventListener("remove", (event) => {
    const id = event.detail.value;
    host.calls.push(`remove:${id}`);
    queue.items = queue.items?.filter((item) => item.id !== id);
  });
}

const rateLimited = notices.find((notice) => notice.id === "warning") as NoticeData;

const humanInput = `
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section data-case="tool-approval"><kind-tool id="delete_file" can-approve can-deny></kind-tool></section>
    <section data-case="confirmation">
      <kind-confirmation id="confirmation" label="Run the migration?" can-approve can-deny></kind-confirmation>
    </section>
    <section data-case="question">
      <kind-question id="question" label="Deploy questions" can-submit can-skip></kind-question>
    </section>
    <section data-case="checkpoint">
      <kind-checkpoint id="checkpoint" description="Before editing auth.ts" can-restore></kind-checkpoint>
    </section>
    <section data-case="model-selector" class="flex items-center gap-2">
      <kind-context-meter id="context"></kind-context-meter>
    </section>
    <section data-case="suggestion"><kind-suggestion id="suggestion" can-pick></kind-suggestion></section>
    <section data-case="feedback"><kind-feedback id="feedback" can-comment></kind-feedback></section>
    <section id="notice" data-case="notice">
      <kind-notice variant="${rateLimited.variant}" label="${rateLimited.label}" can-dismiss>
        <kind-notice-description>${rateLimited.text}</kind-notice-description>
      </kind-notice>
    </section>
    <section id="guardrail" data-case="guardrail-notice">
      <kind-guardrail-notice blocking can-dismiss></kind-guardrail-notice>
    </section>
  </div>`;

const decide =
  (name: string) =>
  (event: CustomEvent<{ value?: unknown; waitUntil?(promise: Promise<unknown>): void }>) => {
    const settled = host.decide(name)(event.detail);
    event.detail.waitUntil?.(settled);
  };

function wireHumanInput(wave: Element) {
  const element = <Tag extends keyof HTMLElementTagNameMap>(tag: Tag) =>
    wave.querySelector(`:scope > section > ${tag}`) as HTMLElementTagNameMap[Tag];
  const tool = element("kind-tool");
  tool.call = approvalCall;
  tool.addEventListener("approve", decide("approve"));
  tool.addEventListener("deny", decide("deny"));
  const confirmation = element("kind-confirmation");
  confirmation.approval = { approvalId: "migrate", generation: 1, state: "requested" };
  confirmation.addEventListener("approve", decide("approve"));
  confirmation.addEventListener("deny", decide("deny"));
  const question = element("kind-question");
  question.questions = deployQuestions;
  question.addEventListener("valuechange", (event) => recordChange("question", event));
  question.addEventListener("questionsubmit", (event) =>
    event.detail.waitUntil(
      host
        .decide("submit")(event.detail)
        .then(() => {
          question.submitted = event.detail.value;
        }),
    ),
  );
  question.addEventListener("skip", (event) =>
    event.detail.waitUntil(
      host
        .decide("skip")(event.detail)
        .then(() => {
          question.submitted = {};
        }),
    ),
  );
  const checkpoint = element("kind-checkpoint");
  checkpoint.addEventListener("openchange", (event) => recordChange("checkpoint", event));
  checkpoint.addEventListener("restore", (event) =>
    event.detail.waitUntil(host.decide("restore")(event.detail.value)),
  );
  confirmable.push(question, checkpoint);
  const model = Object.assign(document.createElement("kind-model-selector"), {
    id: "model",
    models,
    defaultValue: "gpt-5",
  });
  model.addEventListener("modelchange", (event) => recordChange("model", event));
  const effort = Object.assign(document.createElement("kind-reasoning-effort"), {
    id: "effort",
    levels,
    defaultValue: "medium",
  });
  effort.addEventListener("effortchange", (event) => recordChange("effort", event));
  const meter = element("kind-context-meter");
  meter.before(model, effort);
  Object.assign(meter, context);
  meter.addEventListener("openchange", (event) => recordChange("context", event));
  const suggestion = element("kind-suggestion");
  suggestion.suggestions = suggestions;
  suggestion.addEventListener("pick", decide("pick"));
  const feedback = element("kind-feedback");
  feedback.addEventListener("ratingchange", (event) => recordChange("feedback", event));
  feedback.addEventListener("comment", decide("comment"));
  const notice = element("kind-notice");
  notice.addEventListener("dismiss", () => {
    host.calls.push("dismiss");
    notice.remove();
  });
  const guardrail = element("kind-guardrail-notice");
  Object.assign(guardrail, guardrails.blocking);
  guardrail.addEventListener("openchange", (event) => recordChange("guardrail", event));
  guardrail.addEventListener("dismiss", () => {
    host.calls.push("dismiss");
    guardrail.remove();
  });
}

const artifacts = `
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section data-case="sources"><kind-sources id="sources"></kind-sources></section>
    <section data-case="inline-citation">
      <p>Back off when you hit a limit <kind-inline-citation id="citation"></kind-inline-citation>.</p>
    </section>
    <section data-case="document"><kind-document id="document" label="README.md" can-download></kind-document></section>
    <section data-case="generated-image">
      <kind-generated-image id="image" alt="A lighthouse at dusk" can-download></kind-generated-image>
    </section>
    <section data-case="file-tree"></section>
    <section data-case="terminal">
      <kind-terminal id="terminal" command="npm install" exit-code="0" duration-seconds="3"></kind-terminal>
    </section>
    <section data-case="stack-trace"><kind-stack-trace id="stack-trace" can-open-frame></kind-stack-trace></section>
    <section data-case="test-results"><kind-test-results id="test-results" default-open></kind-test-results></section>
    <section data-case="transcript"><kind-transcript id="transcript" can-seek></kind-transcript></section>
    <section data-case="selection">
      <kind-selection id="selection" can-run>
        <kind-selection-content>
          <p id="selection-text">Rate limits reset every hour. Each response carries the remaining count in its headers.</p>
        </kind-selection-content>
      </kind-selection>
    </section>
    <section data-case="action">
      <kind-action id="action" label="Explain" status="running" quote="Rate limits reset every hour."></kind-action>
    </section>
  </div>`;

function wireArtifacts(wave: Element) {
  const element = <Tag extends keyof HTMLElementTagNameMap>(tag: Tag, id: string) =>
    wave.querySelector(`${tag}#${id}`) as HTMLElementTagNameMap[Tag];
  const sourceList = element("kind-sources", "sources");
  sourceList.sources = sources;
  sourceList.addEventListener("openchange", (event) => recordChange("sources", event));
  const citation = element("kind-inline-citation", "citation");
  citation.sources = sources;
  citation.addEventListener("openchange", (event) => recordChange("citation", event));
  const documentElement = element("kind-document", "document");
  Object.assign(documentElement, { content: readme, downloads });
  documentElement.addEventListener("openchange", (event) => recordChange("document", event));
  documentElement.addEventListener("documentcopy", decide("copy"));
  documentElement.addEventListener("download", decide("download"));
  const image = element("kind-generated-image", "image");
  Object.assign(image, size, { src: lighthouse });
  image.addEventListener("openchange", (event) => recordChange("image", event));
  image.addEventListener("download", decide("download"));
  const tree = Object.assign(document.createElement("kind-file-tree"), {
    id: "file-tree",
    canSelect: true,
    defaultExpanded: ["src"],
  });
  wave.querySelector('[data-case="file-tree"]')?.append(tree);
  tree.entries = entries;
  tree.addEventListener("pathchange", (event) => recordChange("file-tree", event));
  tree.addEventListener("expandchange", (event) => recordChange("file-tree", event));
  tree.addEventListener("fileselect", decide("select"));
  const terminal = element("kind-terminal", "terminal");
  terminal.output = installRun;
  terminal.addEventListener("openchange", (event) => recordChange("terminal", event));
  terminal.addEventListener("terminalcopy", decide("copy"));
  const trace = element("kind-stack-trace", "stack-trace");
  trace.stack = typeErrorStack;
  trace.addEventListener("openchange", (event) => recordChange("stack-trace", event));
  trace.addEventListener("showlibraryframeschange", (event) => recordChange("stack-trace", event));
  trace.addEventListener("stackcopy", decide("copy"));
  trace.addEventListener("openframe", decide("openFrame"));
  const results = element("kind-test-results", "test-results");
  results.suites = suites;
  results.addEventListener("openchange", (event) => recordChange("test-results", event));
  results.addEventListener("filterchange", (event) => recordChange("test-results", event));
  results.addEventListener("expandchange", (event) => recordChange("test-results", event));
  const transcript = element("kind-transcript", "transcript");
  transcript.segments = standup;
  transcript.addEventListener("querychange", (event) => recordChange("transcript", event));
  transcript.addEventListener("seek", decide("seek"));
  const selection = element("kind-selection", "selection");
  selection.actions = selectionActions;
  selection.addEventListener("selectionaction", decide("run"));
  selection.addEventListener("dismiss", decide("dismiss"));
  const action = element("kind-action", "action");
  action.result = "The limit resets on the hour.";
  action.addEventListener("openchange", (event) => recordChange("action", event));
}

function foundation(root: HTMLElement) {
  defineStep();
  defineStepList();
  defineConversation();
  defineMessage();
  defineMarkdown();
  defineInternalToolbar();
  defineComposer();
  defineAttachments();
  defineUploader();
  defineLoader();
  defineThinkingIndicator();
  defineTypingIndicator();
  defineStreamingText();
  root.innerHTML = markup;
  for (const step of root.querySelectorAll("kind-step"))
    step.addEventListener("openchange", (event) => recordChange("step", event));
  wireMessages(root);
  wireComposer(root);
  wireAttachments(root);
  wireUploader(root);
}

function waveTwo(root: HTMLElement) {
  foundation(root);
  defineStatus();
  defineReasoning();
  defineTool();
  defineChainOfThought();
  defineTask();
  definePlan();
  defineSubagent();
  defineQueue();
  root.insertAdjacentHTML("beforeend", activity);
  wireActivity(root);
}

function waveThree(root: HTMLElement) {
  waveTwo(root);
  defineConfirmation();
  defineQuestion();
  defineCheckpoint();
  defineModelSelector();
  defineReasoningEffort();
  defineContextMeter();
  defineSuggestion();
  defineFeedback();
  defineNotice();
  defineGuardrailNotice();
  root.insertAdjacentHTML("beforeend", humanInput);
  wireHumanInput(root.lastElementChild as Element);
}

const composing = `
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section id="picker" data-case="picker"></section>
    <section id="add-menu" data-case="add-menu"></section>
    <section id="settings-menu" data-case="settings-menu"></section>
    <section id="approval-mode" data-case="approval-mode"></section>
    <section id="model-control" data-case="model-control"></section>
    <section id="context-bar" data-case="context-bar" style="width: 360px"></section>
    <section id="dictation" data-case="dictation" style="width: 320px"></section>
    <section id="answer" data-case="message">
      <kind-message aria-label="Answer" message-role="assistant" can-regenerate text="${replies[0]}">
        <kind-message-content>${replies[0]}</kind-message-content>
        <kind-message-toolbar>
          <kind-internal-toolbar><ui-toolbar aria-label="Answer actions">${button("copy", "Copy")}
            <kind-message-regenerate><kind-internal-menu><ui-menu>
              <kind-message-regenerate-trigger><ui-toolbar-button><ui-menu-trigger><button aria-label="Regenerate"></button></ui-menu-trigger></ui-toolbar-button></kind-message-regenerate-trigger>
              <kind-message-regenerate-content><ui-menu-content side-offset="6" align="start" data-agent-hidden></ui-menu-content></kind-message-regenerate-content>
            </ui-menu></kind-internal-menu></kind-message-regenerate>
          </ui-toolbar></kind-internal-toolbar>
        </kind-message-toolbar>
      </kind-message>
    </section>
    <section id="draft" data-case="composer">
      <kind-composer draft-key="${draftKey}">
        <form aria-label="Draft">
          <ui-file-input>
            <ui-file-input-dropzone>
              <kind-composer-input>
                <ui-token-input><ui-token-input-editor aria-label="Draft prompt"></ui-token-input-editor></ui-token-input>
              </kind-composer-input>
              <kind-composer-restored></kind-composer-restored>
              <kind-composer-submit><button></button></kind-composer-submit>
            </ui-file-input-dropzone>
          </ui-file-input>
        </form>
      </kind-composer>
    </section>
  </div>`;

function wireComposing(wave: Element) {
  const place = <Tag extends keyof HTMLElementTagNameMap>(id: string, tag: Tag, props: object) => {
    const el = Object.assign(document.createElement(tag), props);
    wave.querySelector(`#${id}`)?.append(el);
    return el;
  };
  const picker = place("picker", "kind-picker", {
    label: "Work in",
    items: places,
    actions: placeActions,
    canRun: true,
    defaultValue: "kind-ui/agent-ui",
  });
  picker.addEventListener("pickerchange", (event) => recordChange("picker", event));
  picker.addEventListener("pickeraction", decide("picker-action"));
  const add = place("add-menu", "kind-add-menu", { items: addItems, canRun: true });
  add.addEventListener("addaction", decide("add"));
  const settingsMenu = place("settings-menu", "kind-settings-menu", { settings, values: initialValues });
  settingsMenu.addEventListener("valueschange", (event) => recordChange("settings", event));
  const approval = place("approval-mode", "kind-approval-mode", { modes, value: "ask", learnMoreHref });
  approval.addEventListener("modechange", (event) => recordChange("approval", event));
  const control = place("model-control", "kind-model-control", {
    models: controlModels,
    levels: controlLevels,
    settings: controlSettings,
    defaultModel: "opus",
    defaultEffort: "medium",
    defaultValues: { fast: false, context: "1m" },
    actions: modelActions,
    canRun: true,
  });
  for (const name of ["modelchange", "effortchange", "valueschange"] as const)
    control.addEventListener(name, (event) => recordChange("model-control", event));
  control.addEventListener("modelaction", decide("model-control-action"));
  const bar = place("context-bar", "kind-context-bar", { chips: contextChips(4), canRemove: true });
  bar.style.setProperty("--kind-context-chip-max-width", "120px");
  bar.addEventListener("contextremove", (event) => {
    const id = event.detail.value;
    if (recordChange("context-bar", event)) bar.chips = (bar.chips ?? []).filter((chip) => chip.id !== id);
  });
  const fake = dictationHost();
  Object.assign(window, { kindDictation: fake.host });
  const dictation = place("dictation", "kind-dictation", { source: fake.source });
  dictation.addEventListener("dictationtext", decide("dictate"));
  const answerMessage = wave.querySelector("#answer kind-message") as HTMLElementTagNameMap["kind-message"];
  answerMessage.regenerateOptions = regenerateOptions;
  answerMessage.addEventListener("regenerate", (event) =>
    host.decide(`regenerate:${event.detail.optionId ?? ""}`)(event.detail),
  );
  const draft = wave.querySelector("#draft kind-composer") as KindComposerElement;
  draft.draftStorage = agentDrafts();
  draft.addEventListener("composersubmit", ({ detail }) => detail.waitUntil(host.submit(detail.value)));
  draft.addEventListener("valuechange", (event) => {
    if (event.detail.reason !== "restore") recordChange("draft", event);
  });
  confirmable.push(approval, dictation);
}

const shell = `
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section id="thread-list" data-case="thread-list" class="flex h-[22rem] flex-col"></section>
    <section id="thread-search" data-case="thread-search"></section>
    <section id="sidebar" data-case="sidebar">
      <kind-sidebar label="History" class="h-48">
        <kind-sidebar-panel><p class="p-2">Earlier chats</p></kind-sidebar-panel>
        <kind-sidebar-inset><kind-sidebar-trigger><button></button></kind-sidebar-trigger></kind-sidebar-inset>
      </kind-sidebar>
    </section>
    <section id="launcher" data-case="launcher" class="relative h-20 [transform:translateZ(0)]">
      <kind-launcher label="Assistant">
        <kind-launcher-content><p class="p-4">How can I help?</p></kind-launcher-content>
      </kind-launcher>
    </section>
    <section id="share" data-case="share-dialog"></section>
    <section id="day" data-case="day-separator">
      <kind-day-separator date="2026-11-18T09:30:00Z" time-zone="UTC"></kind-day-separator>
    </section>
    <section id="failed" data-case="message">
      <kind-message aria-label="Failed answer" message-role="assistant" status="error" error="${outcomeError}"
        text="${outcomeText}" can-retry>
        <kind-message-avatar></kind-message-avatar>
        <kind-message-header></kind-message-header>
        <kind-message-content>${outcomeText}</kind-message-content>
        <kind-message-outcome></kind-message-outcome>
      </kind-message>
    </section>
    <section id="earlier" data-case="conversation">
      <kind-conversation aria-label="Earlier chat" message-count="0" status="error" can-retry class="h-40">
        <kind-conversation-viewport>
          <kind-conversation-content>
            <kind-conversation-skeleton hidden></kind-conversation-skeleton>
            <kind-conversation-loading hidden></kind-conversation-loading>
            <kind-conversation-error hidden></kind-conversation-error>
          </kind-conversation-content>
        </kind-conversation-viewport>
      </kind-conversation>
    </section>
    <section id="connection" data-case="connection-status" class="relative h-16"></section>
    <section id="find" data-case="conversation-search" class="relative">
      <kind-conversation-search default-open motion="none"></kind-conversation-search>
      <kind-conversation aria-label="Found chat" message-count="${shellMessages.length}" motion="none" class="h-48">
        <kind-conversation-viewport>
          <kind-conversation-content>${shellMessages
            .map(
              ({ id, text }, index) =>
                `<kind-conversation-row value="${id}" index="${index}"><p>${text}</p></kind-conversation-row>`,
            )
            .join("")}</kind-conversation-content>
        </kind-conversation-viewport>
        <kind-conversation-marks></kind-conversation-marks>
      </kind-conversation>
    </section>
  </div>`;

function wireShell(wave: Element) {
  const place = <Tag extends keyof HTMLElementTagNameMap>(id: string, tag: Tag, props: object) => {
    const el = Object.assign(document.createElement(tag), props);
    wave.querySelector(`#${id}`)?.append(el);
    return el;
  };
  const list = place("thread-list", "kind-thread-list", {
    threads,
    value: "t2",
    now: NOW,
    timeZone: "UTC",
    canSelect: true,
    canNew: true,
    canRename: true,
    canPin: true,
    canShare: true,
    canDelete: true,
  });
  list.addEventListener("threadselect", (event) => recordChange("thread-select", event));
  list.addEventListener("threadnew", (event) => host.decide("thread-new")(event.detail.value));
  list.addEventListener("threadrename", decide("thread-rename"));
  list.addEventListener("pinchange", decide("thread-pin"));
  list.addEventListener("threadshare", decide("thread-share"));
  list.addEventListener("threaddelete", decide("thread-delete"));
  const search = place("thread-search", "kind-thread-search", {
    threads,
    now: NOW,
    timeZone: "UTC",
    canSelect: true,
    canNew: true,
  });
  search.addEventListener("openchange", (event) => recordChange("thread-search", event));
  search.addEventListener("threadquerychange", (event) => recordChange("thread-search-query", event));
  search.addEventListener("threadselect", (event) => recordChange("thread-search-select", event));
  search.addEventListener("threadnew", decide("thread-search-new"));
  wave
    .querySelector("kind-sidebar")
    ?.addEventListener("openchange", (event) => recordChange("sidebar", event));
  wave
    .querySelector("kind-launcher")
    ?.addEventListener("openchange", (event) => recordChange("launcher", event));
  const share = place("share", "kind-share-dialog", {
    defaultVisibility: "link",
    canCreateLink: true,
    canRevoke: true,
  });
  share.addEventListener("openchange", (event) => recordChange("share", event));
  share.addEventListener("sharevisibilitychange", (event) => recordChange("share-visibility", event));
  const answer = (action: string, link: string | undefined) => (event: CustomEvent) =>
    event.detail.waitUntil(
      host
        .decide(action)(event.detail)
        .then(() => (share.link = link)),
    );
  share.addEventListener("createlink", answer("share-create", shareLink));
  share.addEventListener("revoke", answer("share-revoke", undefined));
  share.addEventListener("linkcopy", decide("share-copy"));
  const failed = wave.querySelector("#failed kind-message") as HTMLElementTagNameMap["kind-message"];
  failed.author = author;
  failed.addEventListener("retry", decide("message-retry"));
  const history = wave.querySelector("#earlier kind-conversation") as KindConversationElement;
  history.addEventListener("retry", (event) =>
    event.detail.waitUntil(
      host
        .decide("conversation-retry")(event.detail)
        .then(() => history.setAttribute("status", "loading")),
    ),
  );
  const connection = place("connection", "kind-connection-status", { state: "offline", canRetry: true });
  connection.addEventListener("connectionretry", decide("connection-retry"));
  const bar = wave.querySelector(
    "kind-conversation-search",
  ) as HTMLElementTagNameMap["kind-conversation-search"];
  const found = wave.querySelector("#find kind-conversation") as KindConversationElement;
  const controller = createConversationController();
  found.controller = controller;
  Object.assign(bar, { messages: shellMessages, conversation: controller });
  bar.addEventListener("markschange", (event) => {
    found.marks = event.detail.value;
  });
  bar.addEventListener("querychange", (event) => recordChange("find-query", event));
  bar.addEventListener("openchange", (event) => recordChange("find", event));
  confirmable.push(share);
}

function waveFour(root: HTMLElement) {
  waveThree(root);
  defineSources();
  defineInlineCitation();
  defineDocument();
  defineGeneratedImage();
  defineFileTree();
  defineTerminal();
  defineStackTrace();
  defineTestResults();
  defineTranscript();
  defineSelection();
  defineAction();
  root.insertAdjacentHTML("beforeend", artifacts);
  wireArtifacts(root.lastElementChild as Element);
}

function waveFive(root: HTMLElement) {
  waveFour(root);
  const model = root.querySelector(
    "kind-model-selector#model",
  ) as HTMLElementTagNameMap["kind-model-selector"];
  Object.assign(model, { actions: modelActions, canRun: true });
  model.addEventListener("modelaction", decide("model-action"));
  definePicker();
  defineAddMenu();
  defineSettingsMenu();
  defineApprovalMode();
  defineModelControl();
  defineContextBar();
  defineDictation();
  defineInternalMenu();
  root.insertAdjacentHTML("beforeend", composing);
  wireComposing(root.lastElementChild as Element);
}

export const cases = {
  all: foundation,
  "wave-2": waveTwo,
  "wave-3": waveThree,
  "wave-4": waveFour,
  "wave-5": waveFive,
  "wave-6": (root: HTMLElement) => {
    foundation(root);
    defineThreadList();
    defineThreadSearch();
    defineSidebar();
    defineLauncher();
    defineShareDialog();
    defineDaySeparator();
    defineConnectionStatus();
    defineConversationSearch();
    root.insertAdjacentHTML("beforeend", shell);
    wireShell(root.lastElementChild as Element);
  },
};
