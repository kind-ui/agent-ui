import { type ConversationSearchMessage, createConversationController } from "@kind-ui/agent-ui/core";
import { memo, useEffect, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationJump,
  ConversationMarks,
  ConversationRow,
  ConversationViewport,
} from "../../../../src/react/conversation.js";
import { ConversationSearch } from "../../../../src/react/conversation-search.js";
import { Markdown } from "../../../../src/react/markdown.js";
import { markdownMessage, type SearchRecord, searchMessages } from "../../shared/conversation-search.js";

const recorded: SearchRecord = { queries: [], opens: [] };

const Row = memo(function Row({ message, index }: { message: ConversationSearchMessage; index: number }) {
  return (
    <ConversationRow value={message.id} index={index}>
      {message.id === "md" ? (
        <Markdown source={message.text} />
      ) : (
        <p className="truncate" data-message={message.id}>
          {message.text}
        </p>
      )}
    </ConversationRow>
  );
});

function Search({
  messages,
  virtualize = false,
  controlled = false,
  defaultQuery,
  refused = false,
}: {
  messages: ConversationSearchMessage[];
  virtualize?: boolean;
  controlled?: boolean;
  defaultQuery?: string;
  refused?: boolean;
}) {
  const [controller] = useState(createConversationController);
  const [marks, setMarks] = useState<readonly number[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    Object.assign(window, { kindHost: recorded, kindSearch: { set: setQuery } });
  }, []);
  return (
    <div className="flex flex-col gap-3 bg-[var(--kind-color-surface)] p-4">
      <button type="button" id="before">
        Before
      </button>
      <div className="relative w-[32rem]">
        <ConversationSearch
          messages={messages}
          conversation={controller}
          defaultOpen
          shortcut="mod+f"
          motion="none"
          onMarksChange={setMarks}
          onQueryChange={(next, details) => {
            recorded.queries.push([next, details.reason]);
            if (controlled && !refused) setQuery(next);
          }}
          onOpenChange={(open, details) => recorded.opens.push([open, details.reason])}
          {...(controlled && { query })}
          {...(defaultQuery !== undefined && { defaultQuery })}
        />
        <Conversation
          aria-label="Conversation"
          messageCount={messages.length}
          virtualize={virtualize}
          estimateRowHeight={48}
          rowKey={(index) => messages[index]?.id ?? String(index)}
          controller={controller}
          marks={marks}
          motion="none"
          className="h-[480px] rounded-xl"
        >
          <ConversationViewport>
            <ConversationContent>
              {virtualize
                ? ({ rows }) =>
                    rows.flatMap((r) =>
                      messages[r.index]
                        ? [
                            <Row
                              key={r.index}
                              message={messages[r.index] as ConversationSearchMessage}
                              index={r.index}
                            />,
                          ]
                        : [],
                    )
                : messages.map((m, i) => <Row key={m.id} message={m} index={i} />)}
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
