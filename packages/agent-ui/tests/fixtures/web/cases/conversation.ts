import type { VirtualItem } from "@ui-sdk/core";
import { defineConversation } from "../../../../src/web/conversation.js";

const lines = [
  "How do I keep a chat scrolled to the newest reply?",
  "Follow the end while the reader is at the bottom, and let go the moment they scroll up. A jump control brings them back, with a count of what arrived while they were away.",
  "And long histories?",
  "Render only the rows in view and measure each one as it mounts, so the scrollbar stays steady.",
];

const bubble = "ms-auto w-fit max-w-[80%] rounded-2xl bg-[var(--kind-hover)] px-3.5 py-2";

function row(index: number): HTMLElement {
  const el = document.createElement("kind-conversation-row");
  el.setAttribute("value", `m${index}`);
  el.setAttribute("index", String(index));
  const text = document.createElement("p");
  text.dataset.message = `m${index}`;
  if (index % 2 === 0) text.className = bubble;
  text.textContent = lines[index % lines.length] as string;
  el.append(text);
  return el;
}

function chat(root: HTMLElement, count: number, virtualize = false) {
  defineConversation();
  root.innerHTML = `
    <kind-conversation aria-label="Conversation" message-count="${count}"${virtualize ? " virtualize" : ""}
      class="m-4 h-[28rem] w-[32rem] rounded-xl border border-[var(--kind-border)]">
      <kind-conversation-viewport>
        <kind-conversation-content></kind-conversation-content>
      </kind-conversation-viewport>
      <kind-conversation-jump><button></button></kind-conversation-jump>
    </kind-conversation>`;
  const conversation = root.querySelector("kind-conversation") as HTMLElement;
  const content = root.querySelector("kind-conversation-content") as HTMLElement;
  const rows = () => [...content.querySelectorAll("kind-conversation-row")];
  let total = count;
  const setCount = (next: number) => {
    total = next;
    conversation.setAttribute("message-count", String(next));
  };

  if (virtualize) {
    conversation.addEventListener("rowschange", (event) => {
      const items = (event as CustomEvent<{ value: readonly VirtualItem[] }>).detail.value;
      content.replaceChildren(...items.map((item) => row(item.index)));
    });
  } else {
    content.append(...Array.from({ length: count }, (_, i) => row(i)));
    const empty = document.createElement("kind-conversation-empty");
    empty.textContent = "No messages yet.";
    content.append(empty);
  }

  Object.assign(window, {
    kindConversation: {
      append: (n = 1) => {
        for (let i = 0; i < n; i++) content.querySelector("kind-conversation-empty")?.before(row(total + i));
        setCount(total + n);
      },
      stream: (chunk: string) => {
        const text = rows().at(-1)?.querySelector("p");
        if (text) text.textContent += chunk;
      },
      remove: (n = 1) => {
        for (const el of rows().slice(-n)) el.remove();
        setCount(total - n);
      },
    },
  });
}

export const cases = {
  chat: (root: HTMLElement) => chat(root, 31),
  empty: (root: HTMLElement) => chat(root, 0),
  virtual: (root: HTMLElement) => chat(root, 1000, true),
};
