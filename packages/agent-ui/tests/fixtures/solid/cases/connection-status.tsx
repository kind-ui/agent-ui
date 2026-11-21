import type { ConnectionState, MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, For, flush, onSettled } from "solid-js";
import { ConnectionStatus } from "../../../../src/solid/connection-status.js";
import {
  Conversation,
  ConversationContent,
  ConversationRow,
  ConversationViewport,
} from "../../../../src/solid/conversation.js";
import { type ConnectionHost, connectionHost, messages } from "../../shared/connection-status.js";
import { expose } from "../../shared/expose.js";

const { host, retried } = connectionHost();

function Page(props: { initial?: ConnectionState; motion?: MotionMode }) {
  const [connection, setConnection] = createSignal<{
    state: ConnectionState;
    retryAt?: string | undefined;
    resuming?: boolean | undefined;
  }>({ state: props.initial ?? "online" });
  onSettled(() => {
    const set: ConnectionHost["set"] = (state, options) => {
      setConnection({ state, ...options });
      flush();
    };
    expose({ kindHost: Object.assign(host, { set }) });
  });
  return (
    <Conversation
      aria-label="Conversation"
      messageCount={messages.length}
      class="m-4 h-[24rem] w-[32rem] rounded-xl border border-[var(--kind-color-border)]"
    >
      <ConversationViewport>
        <ConversationContent>
          <For each={messages} keyed={(message) => message.id}>
            {(message, index) => (
              <ConversationRow value={message().id} index={index()}>
                <p data-message={message().id}>{message().text}</p>
              </ConversationRow>
            )}
          </For>
        </ConversationContent>
      </ConversationViewport>
      <ConnectionStatus
        id="connection"
        state={connection().state}
        retryAt={connection().retryAt}
        resuming={connection().resuming}
        motion={props.motion}
        onRetry={retried}
      />
    </Conversation>
  );
}

export const cases = {
  online: () => <Page />,
  offline: () => <Page initial="offline" />,
  reduced: () => <Page initial="offline" motion="reduced" />,
};
