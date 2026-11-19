import "@ui-sdk/web/input";
import {
  type ConversationSearchApi,
  type ConversationSearchOpenChangeReason,
  type ConversationSearchOptions,
  type ConversationSearchQueryChangeReason,
  type ConversationSearchState,
  conversationSearchPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";

const defaultParts = (describedBy: string) =>
  `<kind-conversation-search-input><ui-input-group><ui-input data-agent-hidden><input type="search" placeholder="Find" aria-describedby="${describedBy}"></ui-input><kind-conversation-search-count></kind-conversation-search-count><ui-input-clear><button type="button" aria-label="Clear search" data-agent-hidden></button></ui-input-clear></ui-input-group></kind-conversation-search-input><kind-conversation-search-previous><button></button></kind-conversation-search-previous><kind-conversation-search-next><button></button></kind-conversation-search-next><kind-conversation-search-close><button></button></kind-conversation-search-close>`;

/**
 * `<kind-conversation-search>` fills in its parts when it has no children, and points the field's description at the
 * count. Set `messages` and `conversation` (a
 * Conversation's `controller`) as properties, and pass `markschange`'s `detail.value` to the Conversation's `marks`.
 * Searching fires `querychange`, and opening or closing fires `openchange`.
 */
export function defineConversationSearch(): void {
  if (customElements.get("kind-conversation-search")) return;
  createParts(conversationSearchPrimitive, {
    root: {
      tag: "kind-conversation-search",
      state: {
        query: { get: (api) => api.getQuery(), set: (api, query) => api.setQuery(String(query ?? "")) },
        open: { get: (api) => api.isOpen(), set: (api, open) => api.setOpen(Boolean(open)) },
      },
      // `next`, `previous` and `close` are getters, offered only while they can run, which a copied list would freeze.
      api: ["search", "getQuery", "setQuery", "isOpen", "setOpen"],
      render: (el, instance) => {
        const api = instance.api as ConversationSearchApi;
        if (!el.firstElementChild) {
          el.innerHTML = defaultParts(api.inputState().describedBy);
          const input = el.querySelector("input");
          if (input) input.value = (instance.get() as ConversationSearchState).query;
        }
        const draw = () => {
          const state = instance.get() as ConversationSearchState;
          // UI SDK builds a new instance, with a new controller, when the element returns to the page.
          const field = el.querySelector<Element & { controller?: unknown }>(
            "kind-conversation-search-input ui-input",
          );
          const count = el.querySelector("kind-conversation-search-count");
          const { controller, label } = api.inputState();
          if (field && field.controller !== controller) field.controller = controller;
          const input = field?.querySelector("input");
          if (input && input.ariaLabel !== label) input.ariaLabel = label;
          // The count's id follows the instance, which UI SDK builds again when the element returns to the page.
          const stale = input && count?.id && input.getAttribute("aria-describedby") !== count.id;
          if (stale && input.ariaDescribedByElements?.[0] !== count) input.ariaDescribedByElements = [count];
          const text = api.countText(state);
          if (count && count.textContent !== text) count.textContent = text;
          api.syncInput();
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    input: "kind-conversation-search-input",
    count: "kind-conversation-search-count",
    previous: { tag: "kind-conversation-search-previous", target: wrappedButton, display: "contents" },
    next: { tag: "kind-conversation-search-next", target: wrappedButton, display: "contents" },
    close: { tag: "kind-conversation-search-close", target: wrappedButton, display: "contents" },
  });
}

export type KindConversationSearchEvents = {
  querychange: UiChangeEvent<string, ConversationSearchQueryChangeReason>;
  openchange: UiChangeEvent<boolean, ConversationSearchOpenChangeReason>;
  markschange: CustomEvent<{ value: readonly number[] }>;
};

export interface KindConversationSearchElement
  extends UiElement<KindConversationSearchEvents>,
    AttributeProperties<
      typeof conversationSearchPrimitive,
      "api" | "messages" | "conversation" | "query" | "open"
    > {
  messages?: ConversationSearchOptions["messages"];
  conversation?: ConversationSearchOptions["conversation"];
  get query(): string;
  set query(query: string);
  get open(): boolean;
  set open(open: boolean);
  api: Pick<ConversationSearchApi, "search" | "getQuery" | "setQuery" | "isOpen" | "setOpen">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-conversation-search": KindConversationSearchElement;
    "kind-conversation-search-input": HTMLElement;
    "kind-conversation-search-count": HTMLElement;
    "kind-conversation-search-previous": HTMLElement;
    "kind-conversation-search-next": HTMLElement;
    "kind-conversation-search-close": HTMLElement;
  }
}
