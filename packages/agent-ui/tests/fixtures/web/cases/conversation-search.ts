import { type ConversationSearchMessage, createConversationController } from "@kind-ui/agent-ui/core";
import type { VirtualItem } from "@ui-sdk/core";
import { defineConversation, type KindConversationElement } from "../../../../src/web/conversation.js";
import {
  defineConversationSearch,
  type KindConversationSearchElement,
} from "../../../../src/web/conversation-search.js";
import { defineMarkdown } from "../../../../src/web/markdown.js";
import { markdownMessage, type SearchRecord, searchMessages } from "../../shared/conversation-search.js";

const recorded: SearchRecord = { queries: [], opens: [] };

function row(message: ConversationSearchMessage, index: number): HTMLElement {
  const el = document.createElement("kind-conversation-row");
  el.setAttribute("value", message.id);
  el.setAttribute("index", String(index));
  if (message.id === "md") {
    const markdown = document.createElement("kind-markdown");
    markdown.setAttribute("source", message.text);
    el.append(markdown);
  } else {
    const text = document.createElement("p");
    text.className = "truncate";
    text.dataset.message = message.id;
    text.textContent = message.text;
    el.append(text);
  }
  return el;
}

function search(
  root: HTMLElement,
  messages: ConversationSearchMessage[],
  { virtualize = false, controlled = false, refused = false, defaultQuery = "" } = {},
) {
  defineConversation();
  defineConversationSearch();
  defineMarkdown();
  root.innerHTML = `
    <div class="flex flex-col gap-3 bg-[var(--kind-color-surface)] p-4">
      <button type="button" id="before">Before</button>
      <div class="relative w-[32rem]">
        <kind-conversation-search default-open default-query="${defaultQuery}" shortcut="mod+f" motion="none"></kind-conversation-search>
        <kind-conversation aria-label="Conversation" message-count="${messages.length}" estimate-row-height="48"
          motion="none"${virtualize ? " virtualize" : ""} class="h-[480px] rounded-xl">
          <kind-conversation-viewport>
            <kind-conversation-content></kind-conversation-content>
          </kind-conversation-viewport>
          <kind-conversation-jump><button hidden></button></kind-conversation-jump>
          <kind-conversation-marks></kind-conversation-marks>
        </kind-conversation>
      </div>
    </div>`;
  const conversation = root.querySelector("kind-conversation") as KindConversationElement;
  const bar = root.querySelector("kind-conversation-search") as KindConversationSearchElement;
  const content = root.querySelector("kind-conversation-content") as HTMLElement;
  conversation.rowKey = (index) => messages[index]?.id ?? String(index);
  bar.messages = messages;
  const controller = createConversationController();
  conversation.controller = controller;
  bar.conversation = controller;
  bar.addEventListener("markschange", (event) => {
    conversation.marks = (event as CustomEvent<{ value: readonly number[] }>).detail.value;
  });
  bar.addEventListener("querychange", (event) => {
    const { value, reason } = (event as CustomEvent<{ value: string; reason: string }>).detail;
    recorded.queries.push([value, reason]);
    if (refused) event.preventDefault();
    if (controlled) bar.query = value;
  });
  bar.addEventListener("openchange", (event) => {
    const { value, reason } = (event as CustomEvent<{ value: boolean; reason: string }>).detail;
    recorded.opens.push([value, reason]);
  });

  if (virtualize) {
    const rendered = new Map<number, HTMLElement>();
    const render = (items: readonly VirtualItem[]) => {
      const keep = new Set(items.map((item) => item.index));
      for (const index of rendered.keys()) if (!keep.has(index)) rendered.delete(index);
      content.replaceChildren(
        ...items.flatMap((item) => {
          const message = messages[item.index];
          if (!message) return [];
          let el = rendered.get(item.index);
          if (!el) {
            el = row(message, item.index);
            rendered.set(item.index, el);
          }
          return [el];
        }),
      );
    };
    conversation.addEventListener("rowschange", (event) =>
      render((event as CustomEvent<{ value: readonly VirtualItem[] }>).detail.value),
    );
    render(controller.getRows());
  } else {
    content.append(...messages.map(row));
  }
  Object.assign(window, { kindHost: recorded, kindSearch: { set: (query: string) => (bar.query = query) } });
}

export const cases = {
  basic: (root: HTMLElement) => search(root, searchMessages(50)),
  refused: (root: HTMLElement) => search(root, searchMessages(50), { refused: true }),
  preset: (root: HTMLElement) => search(root, searchMessages(50), { defaultQuery: "rollout" }),
  markdown: (root: HTMLElement) => search(root, [...searchMessages(3), markdownMessage]),
  "many-100": (root: HTMLElement) =>
    search(root, searchMessages(100), { virtualize: true, controlled: true }),
  "many-5000": (root: HTMLElement) =>
    search(root, searchMessages(5000), { virtualize: true, controlled: true }),
};
