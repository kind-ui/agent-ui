import { type ConversationSearchMessage, createConversationController } from "@kind-ui/agent-ui/core";
import { createSignal, For, onSettled, Show } from "solid-js";
import {
  Conversation,
  ConversationContent,
  ConversationJump,
  ConversationMarks,
  ConversationRow,
  ConversationViewport,
} from "../../../../src/solid/conversation.js";
import { ConversationSearch } from "../../../../src/solid/conversation-search.js";
import { Markdown } from "../../../../src/solid/markdown.js";
import { markdownMessage, type SearchRecord, searchMessages } from "../../shared/conversation-search.js";
import { expose } from "../../shared/expose.js";

const recorded: SearchRecord = { queries: [], opens: [] };

function Row(props: { message: ConversationSearchMessage; index: number }) {
  return (
    <ConversationRow value={props.message.id} index={props.index}>
      <Show
        when={props.message.id === "md"}
        fallback={
          <p class="truncate" data-message={props.message.id}>
            {props.message.text}
          </p>
        }
      >
        <Markdown source={props.message.text} />
      </Show>
    </ConversationRow>
  );
}

function Search(props: {
  messages: ConversationSearchMessage[];
  virtualize?: boolean;
  controlled?: boolean;
  defaultQuery?: string;
  refused?: boolean;
}) {
  const controller = createConversationController();
  const [marks, setMarks] = createSignal<readonly number[]>([]);
  const [query, setQuery] = createSignal("");
  onSettled(() => expose({ kindHost: recorded, kindSearch: { set: setQuery } }));
  return (
    <div class="flex flex-col gap-3 bg-[var(--kind-color-surface)] p-4">
      <button type="button" id="before">
        Before
      </button>
      <div class="relative w-[32rem]">
        <ConversationSearch
          messages={props.messages}
          conversation={controller}
          defaultOpen
          shortcut="mod+f"
          motion="none"
          onMarksChange={setMarks}
          onQueryChange={(next, details) => {
            recorded.queries.push([next, details.reason]);
            if (props.controlled && !props.refused) setQuery(next);
          }}
          onOpenChange={(open, details) => recorded.opens.push([open, details.reason])}
          query={props.controlled ? query() : undefined}
          defaultQuery={props.defaultQuery}
        />
        <Conversation
          aria-label="Conversation"
          messageCount={props.messages.length}
          virtualize={props.virtualize ?? false}
          estimateRowHeight={48}
          rowKey={(index) => props.messages[index]?.id ?? String(index)}
          controller={controller}
          marks={marks()}
          motion="none"
          class="h-[480px] rounded-xl"
        >
          <ConversationViewport>
            <ConversationContent>
              {props.virtualize
                ? (state) => (
                    <For each={state.rows} keyed={(r) => r.index}>
                      {(r) => (
                        <Show when={props.messages[r().index]}>
                          {(m) => <Row message={m()} index={r().index} />}
                        </Show>
                      )}
                    </For>
                  )
                : [
                    <For each={props.messages} keyed={(m) => m.id}>
                      {(m, i) => <Row message={m()} index={i()} />}
                    </For>,
                  ]}
            </ConversationContent>
          </ConversationViewport>
          <ConversationJump />
          <ConversationMarks />
        </Conversation>
      </div>
    </div>
  );
}

export const cases = {
  basic: () => <Search messages={searchMessages(50)} />,
  refused: () => <Search messages={searchMessages(50)} controlled refused />,
  preset: () => <Search messages={searchMessages(50)} defaultQuery="rollout" />,
  markdown: () => <Search messages={[...searchMessages(3), markdownMessage]} />,
  "many-100": () => <Search messages={searchMessages(100)} virtualize controlled />,
  "many-5000": () => <Search messages={searchMessages(5000)} virtualize controlled />,
};
