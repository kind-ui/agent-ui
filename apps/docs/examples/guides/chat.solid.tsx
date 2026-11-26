import { fromUIMessages } from "@kind-ui/agent-ui/adapters/ai-sdk";
import { AbstractChat, type ChatInit, type ChatState, type UIMessage } from "ai";
import { createMemo, createSignal, For } from "solid-js";
import { Composer, ComposerInput, ComposerStop, ComposerSubmit } from "@/components/ui/solid/composer";
import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationEmptyTitle,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/solid/conversation";
import { Markdown } from "@/components/ui/solid/markdown";
import { Message, MessageContent, MessageOutcome } from "@/components/ui/solid/message";

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
        set: (target, key, value) => {
          Reflect.set(target, key, value);
          onChange();
          return true;
        },
      }),
    });
  }
}

export default function ChatExample() {
  const [version, setVersion] = createSignal(0);
  const chat = new Chat({}, () => setVersion((count) => count + 1));
  const rendered = createMemo(() => {
    version();
    return fromUIMessages(chat.messages, { status: chat.status, error: chat.error });
  });

  return (
    <div class="flex h-96 flex-col gap-3">
      <Conversation aria-label="Chat" messageCount={rendered().length} class="min-h-0 flex-1">
        <ConversationViewport>
          <ConversationContent>
            <For each={rendered()} keyed={(message) => message.id}>
              {(message, index) => (
                <ConversationRow value={message().id} index={index()}>
                  <Message
                    aria-label={message().role === "user" ? "Your message" : "Assistant message"}
                    messageRole={message().role}
                    status={message().status}
                    error={message().error?.message}
                    onRetry={() => chat.regenerate()}
                  >
                    <MessageContent>
                      <For
                        each={message().parts.filter((part) => part.type === "text")}
                        keyed={(part) => part.id}
                      >
                        {(part) => <Markdown source={part().text} streaming={part().state === "streaming"} />}
                      </For>
                    </MessageContent>
                    <MessageOutcome />
                  </Message>
                </ConversationRow>
              )}
            </For>
            <ConversationEmpty>
              <ConversationEmptyTitle>Ask anything</ConversationEmptyTitle>
            </ConversationEmpty>
          </ConversationContent>
        </ConversationViewport>
        <ConversationJump />
      </Conversation>
      <Composer
        aria-label="Message"
        onSubmit={(draft) => chat.sendMessage({ text: draft.text })}
        onStop={chat.stop}
      >
        <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
        <ComposerSubmit />
        <ComposerStop />
      </Composer>
    </div>
  );
}
