import type { AgentAction } from "@ui-sdk/web/agent";
import { defineAttachments, type KindAttachmentsElement } from "../../../../src/web/attachments.js";
import { defineChainOfThought } from "../../../../src/web/chain-of-thought.js";
import { defineComposer, type KindComposerElement } from "../../../../src/web/composer.js";
import { defineConversation } from "../../../../src/web/conversation.js";
import { defineInternalToolbar } from "../../../../src/web/internal/toolbar.js";
import { defineLoader } from "../../../../src/web/loader.js";
import { defineMarkdown } from "../../../../src/web/markdown.js";
import { defineMessage } from "../../../../src/web/message.js";
import { definePlan } from "../../../../src/web/plan.js";
import { defineQueue } from "../../../../src/web/queue.js";
import { defineReasoning } from "../../../../src/web/reasoning.js";
import { defineStatus } from "../../../../src/web/status.js";
import { defineStep, defineStepList } from "../../../../src/web/step.js";
import { defineStreamingText } from "../../../../src/web/streaming-text.js";
import { defineSubagent } from "../../../../src/web/subagent.js";
import { defineTask } from "../../../../src/web/task.js";
import { defineThinkingIndicator } from "../../../../src/web/thinking-indicator.js";
import { defineTool } from "../../../../src/web/tool.js";
import { defineTypingIndicator } from "../../../../src/web/typing-indicator.js";
import { defineUploader, type KindUploaderElement } from "../../../../src/web/uploader.js";
import {
  agentHost,
  chainSteps,
  files,
  filler,
  moveItem,
  planItems,
  question,
  queueItems,
  replies,
  steps,
  taskItems,
  thoughts,
  toolCalls,
} from "../../shared/agent.js";
import { commands, mentions } from "../../shared/composer.js";
import { answer } from "../../shared/markdown.js";
import { uploads } from "../../shared/uploader.js";

const host = agentHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

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
  host.confirm = (on) => {
    plan.agentConfirm = on;
    subagent.agentConfirm = on;
  };
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

export const cases = {
  all: foundation,
  "wave-2": (root: HTMLElement) => {
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
  },
};
