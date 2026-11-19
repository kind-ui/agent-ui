import type { ConnectionState, MotionMode } from "@kind-ui/agent-ui/core";
import { defineConnectionStatus } from "../../../../src/web/connection-status.js";
import { defineConversation } from "../../../../src/web/conversation.js";
import { type ConnectionHost, connectionHost, messages } from "../../shared/connection-status.js";

const { host, retried } = connectionHost();

const page =
  ({
    initial = "online",
    motion,
    markup = "",
  }: {
    initial?: ConnectionState;
    motion?: MotionMode;
    markup?: string;
  } = {}) =>
  (root: HTMLElement) => {
    defineConversation();
    defineConnectionStatus();
    root.innerHTML = `
      <kind-conversation aria-label="Conversation" message-count="${messages.length}"
        class="m-4 h-[24rem] w-[32rem] rounded-xl border border-[var(--kind-color-border)]">
        <kind-conversation-viewport>
          <kind-conversation-content></kind-conversation-content>
        </kind-conversation-viewport>
      </kind-conversation>`;
    const content = root.querySelector("kind-conversation-content") as HTMLElement;
    content.append(
      ...messages.map((message, index) => {
        const row = document.createElement("kind-conversation-row");
        row.setAttribute("value", message.id);
        row.setAttribute("index", String(index));
        const text = document.createElement("p");
        text.dataset.message = message.id;
        text.textContent = message.text;
        row.append(text);
        return row;
      }),
    );
    const status = document.createElement("kind-connection-status");
    status.id = "connection";
    status.innerHTML = markup;
    status.state = initial;
    if (motion) status.motion = motion;
    status.canRetry = true;
    status.addEventListener("retry", (event) => event.detail.waitUntil(retried()));
    root.querySelector("kind-conversation")?.append(status);
    const set: ConnectionHost["set"] = (state, options) => {
      status.retryAt = options?.retryAt;
      status.resuming = options?.resuming ?? false;
      status.state = state;
    };
    Object.assign(window, { kindHost: Object.assign(host, { set }) });
  };

export const cases = {
  online: page(),
  offline: page({ initial: "offline" }),
  reduced: page({ initial: "offline", motion: "reduced" }),
  // Parts with words of their own, and a Retry without the mark and text before it.
  written: page({
    initial: "offline",
    markup:
      "<kind-connection-status-text>Sin conexión</kind-connection-status-text>" +
      "<kind-connection-status-retry><button>Reintentar</button></kind-connection-status-retry>",
  }),
};
