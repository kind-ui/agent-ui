import { fromUIMessages } from "@kind-ui/agent-ui/adapters/ai-sdk";
import { AbstractChat, type ChatInit, type ChatState, type UIMessage } from "ai";
import { defineComposer } from "@/components/ui/web/composer";
import { defineConversation } from "@/components/ui/web/conversation";
import { defineMarkdown } from "@/components/ui/web/markdown";
import { defineMessage } from "@/components/ui/web/message";

class Chat extends AbstractChat<UIMessage> {
  constructor(init: Omit<ChatInit<UIMessage>, "messages">, onChange: () => void) {
    const state: ChatState<UIMessage> = {
      status: "ready",
      error: undefined,
      messages: [],
      pushMessage(message) {
        this.messages = [...this.messages, message];
      },
      popMessage() {
        this.messages = this.messages.slice(0, -1);
      },
      replaceMessage(index, message) {
        this.messages = this.messages.map((each, at) => (at === index ? message : each));
      },
      snapshot: (thing) => structuredClone(thing),
    };
    super({
      ...init,
      state: new Proxy(state, {
        set(target, key, value) {
          Reflect.set(target, key, value);
          onChange();
          return true;
        },
      }),
    });
  }
}

defineConversation();
defineMessage();
defineMarkdown();
defineComposer();

const root = document.querySelector("#chat") as HTMLElement;
root.innerHTML = `
  <div class="flex h-96 flex-col gap-3">
    <kind-conversation aria-label="Chat" message-count="0" class="min-h-0 flex-1">
      <kind-conversation-viewport>
        <kind-conversation-content>
          <kind-conversation-empty>
            <kind-conversation-empty-title>Ask anything</kind-conversation-empty-title>
          </kind-conversation-empty>
        </kind-conversation-content>
      </kind-conversation-viewport>
      <kind-conversation-jump><button hidden></button></kind-conversation-jump>
    </kind-conversation>
    <kind-composer can-stop>
      <form aria-label="Message">
        <ui-file-input>
          <ui-file-input-dropzone>
            <kind-composer-input>
              <ui-token-input>
                <ui-token-input-editor aria-label="Prompt" placeholder="Ask anything"></ui-token-input-editor>
              </ui-token-input>
            </kind-composer-input>
            <kind-composer-submit><button></button></kind-composer-submit>
            <kind-composer-stop><button></button></kind-composer-stop>
          </ui-file-input-dropzone>
        </ui-file-input>
      </form>
    </kind-composer>
  </div>`;

const conversation = root.querySelector("kind-conversation") as HTMLElementTagNameMap["kind-conversation"];
const empty = root.querySelector("kind-conversation-empty") as HTMLElement;
const composer = root.querySelector("kind-composer") as HTMLElementTagNameMap["kind-composer"];
const rows = new Map<
  string,
  {
    row: HTMLElementTagNameMap["kind-conversation-row"];
    message: HTMLElementTagNameMap["kind-message"];
    content: HTMLElement;
  }
>();
const parts = new Map<string, HTMLElementTagNameMap["kind-markdown"]>();

const chat = new Chat({}, render);

function render() {
  const rendered = fromUIMessages(chat.messages, { status: chat.status, error: chat.error });
  rendered.forEach((message, index) => {
    let entry = rows.get(message.id);
    if (!entry) {
      const row = document.createElement("kind-conversation-row");
      const element = document.createElement("kind-message");
      const content = document.createElement("kind-message-content");
      row.value = message.id;
      element.messageRole = message.role;
      element.ariaLabel = message.role === "user" ? "Your message" : "Assistant message";
      element.canRetry = true;
      element.addEventListener("retry", (event) => event.detail.waitUntil(chat.regenerate()));
      element.append(content, document.createElement("kind-message-outcome"));
      row.append(element);
      empty.before(row);
      entry = { row, message: element, content };
      rows.set(message.id, entry);
    }
    entry.row.index = index;
    entry.message.status = message.status;
    entry.message.error = message.error?.message;
    for (const part of message.parts) {
      if (part.type !== "text") continue;
      let markdown = parts.get(part.id);
      if (!markdown) {
        markdown = document.createElement("kind-markdown");
        entry.content.append(markdown);
        parts.set(part.id, markdown);
      }
      markdown.source = part.text;
      markdown.streaming = part.state === "streaming";
    }
  });
  for (const [id, { row }] of rows) {
    if (!rendered.some((message) => message.id === id)) {
      row.remove();
      rows.delete(id);
    }
  }
  conversation.messageCount = rendered.length;
}

composer.addEventListener("composersubmit", (event) =>
  event.detail.waitUntil(chat.sendMessage({ text: event.detail.value.text })),
);
composer.addEventListener("stop", () => chat.stop());
