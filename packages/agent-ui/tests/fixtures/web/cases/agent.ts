import type { AttachmentItem, ComposerDraft, UploadItem } from "@kind-ui/agent-ui/core";
import type { UiActionDetail } from "@ui-sdk/web";
import type { AgentAction } from "@ui-sdk/web/agent";
import { defineAttachments } from "../../../../src/web/attachments.js";
import { defineComposer } from "../../../../src/web/composer.js";
import { defineConversation } from "../../../../src/web/conversation.js";
import { defineInternalToolbar } from "../../../../src/web/internal/toolbar.js";
import { defineLoader } from "../../../../src/web/loader.js";
import { defineMarkdown } from "../../../../src/web/markdown.js";
import { defineMessage } from "../../../../src/web/message.js";
import { defineStep, defineStepList } from "../../../../src/web/step.js";
import { defineStreamingText } from "../../../../src/web/streaming-text.js";
import { defineThinkingIndicator } from "../../../../src/web/thinking-indicator.js";
import { defineTypingIndicator } from "../../../../src/web/typing-indicator.js";
import { defineUploader } from "../../../../src/web/uploader.js";
import { agentHost, files, filler, question, replies, steps } from "../../shared/agent.js";
import { commands, mentions } from "../../shared/composer.js";
import { answer } from "../../shared/markdown.js";
import { uploads } from "../../shared/uploader.js";

const host = agentHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

type ChangeEvent<Value> = CustomEvent<{ value: Value; source: string }>;

const recordChange = (component: string, event: Event) =>
  host.change(component, {
    source: (event as ChangeEvent<unknown>).detail.source,
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
  const [user, reply] = root.querySelectorAll("kind-message") as NodeListOf<HTMLElement>;
  const content = user?.querySelector("kind-message-content") as HTMLElement;
  const ask = (text: string) => {
    user?.setAttribute("text", text);
    content.textContent = text;
  };
  ask(question);
  user?.addEventListener("edit", (event) => ask((event as CustomEvent<{ value: string }>).detail.value));

  const markdown = reply?.querySelector("kind-markdown") as HTMLElement;
  const show = (index: number) => {
    reply?.setAttribute("text", replies[index] as string);
    reply?.setAttribute("branch-index", String(index));
    markdown.setAttribute("source", index === 0 ? answer : (replies[index] as string));
  };
  show(0);
  reply?.addEventListener("branchchange", (event) => {
    if (recordChange("message", event)) show((event as ChangeEvent<number>).detail.value);
  });
  reply?.addEventListener("regenerate", () => host.calls.push("regenerate"));
}

function wireComposer(root: HTMLElement) {
  const composer = root.querySelector("kind-composer") as HTMLElement;
  Object.assign(composer, { mentions, commands });
  composer.addEventListener("composersubmit", (event) => {
    const { detail } = event as CustomEvent<UiActionDetail & { value: ComposerDraft }>;
    detail.waitUntil(host.submit(detail.value));
  });
  composer.addEventListener("stop", host.stop);
  composer.addEventListener("valuechange", (event) => recordChange("composer", event));
}

function wireAttachments(root: HTMLElement) {
  const list = root.querySelector('kind-attachments[aria-label="Files"]') as HTMLElement & {
    items: AttachmentItem[];
  };
  list.items = files;
  list.addEventListener("remove", (event) => {
    const id = (event as CustomEvent<{ value: string }>).detail.value;
    list.items = list.items.filter((item) => item.id !== id);
  });
}

function wireUploader(root: HTMLElement) {
  const uploader = root.querySelector("kind-uploader") as HTMLElement & { items: UploadItem[] };
  uploader.items = uploads;
  const { onCancel, onRetry } = host.uploads((change) => {
    uploader.items = change(uploader.items);
  });
  uploader.addEventListener("uploadcancel", (event) =>
    onCancel((event as CustomEvent<{ value: string }>).detail.value),
  );
  uploader.addEventListener("uploadretry", (event) =>
    onRetry((event as CustomEvent<{ value: string }>).detail.value),
  );
}

export const cases = {
  all: (root: HTMLElement) => {
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
  },
};
