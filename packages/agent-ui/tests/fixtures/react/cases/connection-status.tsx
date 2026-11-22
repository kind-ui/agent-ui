import type { ConnectionState, MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { ConnectionStatus } from "../../../../src/react/connection-status.js";
import {
  Conversation,
  ConversationContent,
  ConversationRow,
  ConversationViewport,
} from "../../../../src/react/conversation.js";
import { type ConnectionHost, connectionHost, messages } from "../../shared/connection-status.js";

const { host, retried } = connectionHost();

function Page({ initial = "online", motion }: { initial?: ConnectionState; motion?: MotionMode }) {
  const [connection, setConnection] = useState<{
    state: ConnectionState;
    retryAt?: string | undefined;
    resuming?: boolean | undefined;
  }>({ state: initial });
  useEffect(() => {
    // Each call renders before it returns, so two calls in a row aren't batched into the second.
    const set: ConnectionHost["set"] = (state, options) =>
      flushSync(() => setConnection({ state, ...options }));
    Object.assign(window, { kindHost: Object.assign(host, { set }) });
  }, []);
  return (
    <Conversation
      aria-label="Conversation"
      messageCount={messages.length}
      className="m-4 h-[24rem] w-[32rem] rounded-xl border border-[var(--kind-color-border)]"
    >
      <ConversationViewport>
        <ConversationContent>
          {messages.map((message, index) => (
            <ConversationRow key={message.id} value={message.id} index={index}>
              <p data-message={message.id}>{message.text}</p>
            </ConversationRow>
          ))}
        </ConversationContent>
      </ConversationViewport>
      <ConnectionStatus
        id="connection"
        state={connection.state}
        retryAt={connection.retryAt}
        resuming={connection.resuming}
        motion={motion}
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
