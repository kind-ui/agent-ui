import type { Part, ToolCall } from "@kind-ui/agent-ui";
import { fromUIMessages, toApprovalResponse } from "@kind-ui/agent-ui/adapters/ai-sdk";
import {
  AbstractChat,
  type ChatInit,
  type ChatState,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
} from "ai";
import { createMemo, createSignal, For, Match, Switch } from "solid-js";
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
import { Message, MessageContent } from "@/components/ui/solid/message";
import { Reasoning } from "@/components/ui/solid/reasoning";
import { Tool } from "@/components/ui/solid/tool";

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

function MessagePart(props: { part: Part; chat: Chat }) {
  const respond = (call: ToolCall, approved: boolean) =>
    call.approval && props.chat.addToolApprovalResponse(toApprovalResponse(call.approval, { approved }));

  return (
    <Switch>
      <Match when={props.part.type === "text" && props.part}>
        {(part) => <Markdown source={part().text} streaming={part().state === "streaming"} />}
      </Match>
      <Match when={props.part.type === "reasoning" && props.part}>
        {(part) => (
          <Reasoning status={part().state === "streaming" ? "running" : "complete"} text={part().text} />
        )}
      </Match>
      <Match when={props.part.type === "step" && props.part.step.kind === "tool" && props.part.step}>
        {(step) => (
          <Tool
            call={step().call}
            error={step().error}
            onApprove={() => respond(step().call, true)}
            onDeny={() => respond(step().call, false)}
          />
        )}
      </Match>
    </Switch>
  );
}

export default function ChatExample() {
  const [version, setVersion] = createSignal(0);
  const chat = new Chat({ sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses }, () =>
    setVersion((count) => count + 1),
  );
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
                  >
                    <MessageContent>
                      <For each={message().parts} keyed={(part) => part.id}>
                        {(part) => <MessagePart part={part()} chat={chat} />}
                      </For>
                    </MessageContent>
                  </Message>
                </ConversationRow>
              )}
            </For>
            <ConversationEmpty>
              <ConversationEmptyTitle>Ask the agent to clean up merged branches</ConversationEmptyTitle>
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
        <ComposerInput aria-label="Prompt" placeholder="Clean up merged branches" />
        <ComposerSubmit />
        <ComposerStop />
      </Composer>
    </div>
  );
}
