import { defineConversation } from "../../../../src/web/conversation.js";
import { defineInternalAvatar } from "../../../../src/web/internal/avatar.js";
import { defineInternalToolbar } from "../../../../src/web/internal/toolbar.js";
import { defineMarkdown } from "../../../../src/web/markdown.js";
import { defineMessage } from "../../../../src/web/message.js";
import { answer } from "../../shared/markdown.js";

const replies = [
  "Retry with exponential backoff, and cap the number of attempts.",
  "Queue the request and retry it from a background job.",
  "Fail fast and let the caller decide whether to retry.",
];
const question = "How should the client handle a flaky upstream?";

const calls: string[] = [];

function define() {
  defineMessage();
  defineMarkdown();
  defineInternalToolbar();
  defineInternalAvatar();
  Object.assign(window, { kindMessage: { calls } });
}

const button = (slot: string, label: string) =>
  `<kind-message-${slot}><ui-toolbar-button><button aria-label="${label}"></button></ui-toolbar-button></kind-message-${slot}>`;

const actions = (more = "") => `
  <kind-internal-toolbar><ui-toolbar aria-label="Message actions">${button("copy", "Copy")}${more}</ui-toolbar></kind-internal-toolbar>`;

const user = `
  <kind-message aria-label="User message" message-role="user" can-edit>
    <kind-message-content></kind-message-content>
    <kind-message-editor><textarea hidden></textarea></kind-message-editor>
    <kind-message-toolbar>${actions(button("edit", "Edit"))}</kind-message-toolbar>
  </kind-message>`;

const assistant = (branches: boolean) => `
  <kind-message aria-label="Assistant message" message-role="assistant"${branches ? ` branch-count="${replies.length}"` : ""}>
    <kind-message-avatar>
      <kind-internal-avatar><ui-avatar><ui-avatar-fallback>AI</ui-avatar-fallback></ui-avatar></kind-internal-avatar>
    </kind-message-avatar>
    <kind-message-content><kind-markdown></kind-markdown></kind-message-content>
    <kind-message-toolbar>
      <kind-message-branch hidden>
        <kind-message-branch-previous><button></button></kind-message-branch-previous>
        <kind-message-branch-label></kind-message-branch-label>
        <kind-message-branch-next><button></button></kind-message-branch-next>
      </kind-message-branch>
      ${actions(button("regenerate", "Regenerate"))}
    </kind-message-toolbar>
  </kind-message>`;

function wireUser(el: HTMLElement) {
  const content = el.querySelector("kind-message-content") as HTMLElement;
  const show = (text: string) => {
    el.setAttribute("text", text);
    content.textContent = text;
  };
  show(question);
  el.addEventListener("edit", (event) => {
    const text = (event as CustomEvent<{ value: string }>).detail.value;
    calls.push(`edit:${text}`);
    show(text);
  });
}

function wireAssistant(el: HTMLElement & { canRegenerate?: boolean }, callbacks: boolean) {
  const markdown = el.querySelector("kind-markdown") as HTMLElement;
  const show = (index: number) => {
    const text = replies[index] as string;
    el.setAttribute("text", text);
    el.setAttribute("branch-index", String(index));
    markdown.setAttribute("source", text);
  };
  show(0);
  if (!callbacks) return;
  el.addEventListener("branchchange", (event) =>
    show((event as CustomEvent<{ value: number }>).detail.value),
  );
  el.addEventListener("messagecopy", (event) =>
    calls.push(`copy:${(event as CustomEvent<{ value: string }>).detail.value}`),
  );
  el.canRegenerate = true;
  el.addEventListener("regenerate", () => calls.push("regenerate"));
}

export const cases = {
  all: (root: HTMLElement) => {
    define();
    root.innerHTML = `<div class="m-4 flex w-[36rem] flex-col gap-6">${user}${assistant(true)}</div>`;
    const [first, second] = root.querySelectorAll<HTMLElement>("kind-message");
    wireUser(first as HTMLElement);
    wireAssistant(second as HTMLElement, true);
  },
  "no-callbacks": (root: HTMLElement) => {
    define();
    root.innerHTML = `<div class="m-4 w-[36rem]">${assistant(false)}</div>`;
    wireAssistant(root.querySelector("kind-message") as HTMLElement, false);
  },
  chat: (root: HTMLElement) => {
    define();
    defineConversation();
    root.innerHTML = `
      <kind-conversation aria-label="Conversation" message-count="2"
        class="m-4 h-[40rem] w-[44rem] rounded-xl border border-[var(--kind-color-border)]">
        <kind-conversation-viewport>
          <kind-conversation-content>
            <kind-conversation-row value="q" index="0">${user}</kind-conversation-row>
            <kind-conversation-row value="a" index="1">
              <kind-message aria-label="Assistant message" message-role="assistant" status="streaming" can-regenerate>
                <kind-message-content><kind-markdown streaming></kind-markdown></kind-message-content>
                <kind-message-toolbar hidden>${actions(button("regenerate", "Regenerate"))}</kind-message-toolbar>
              </kind-message>
            </kind-conversation-row>
          </kind-conversation-content>
        </kind-conversation-viewport>
      </kind-conversation>`;
    const [first, second] = root.querySelectorAll<HTMLElement>("kind-message");
    wireUser(first as HTMLElement);
    const reply = second as HTMLElement;
    reply.addEventListener("regenerate", () => calls.push("regenerate"));
    const markdown = reply.querySelector("kind-markdown") as HTMLElement;
    let text = "";
    Object.assign(window, {
      kindMessage: {
        calls,
        source: answer,
        append: (chunk: string) => {
          text += chunk;
          reply.setAttribute("text", text);
          markdown.setAttribute("source", text);
        },
        finish: () => {
          reply.setAttribute("status", "complete");
          markdown.removeAttribute("streaming");
        },
      },
    });
  },
};
