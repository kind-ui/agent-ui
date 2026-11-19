import type { ConnectionState, MotionMode } from "@kind-ui/agent-ui/core";
import { defineConnectionStatus } from "../../../../src/web/connection-status.js";
import { defineConversation } from "../../../../src/web/conversation.js";
import { type ConnectionHost, connectionHost, messages } from "../../shared/connection-status.js";

const { host, retried } = connectionHost();

const page =
  ({ initial = "online", motion }: { initial?: ConnectionState; motion?: MotionMode } = {}) =>
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
    status.state = initial;
    if (motion) status.motion = motion;
    status.canRetry = true;
    status.addEventListener("retry", (event) => event.detail.waitUntil(retried()));
    root.querySelector("kind-conversation")?.append(status);
    const set: ConnectionHost["set"] = (state, retryAt) => {
      status.retryAt = retryAt;
      status.state = state;
    };
    Object.assign(window, { kindHost: Object.assign(host, { set }) });
  };

export const cases = {
  online: page(),
  offline: page({ initial: "offline" }),
  reduced: page({ initial: "offline", motion: "reduced" }),
};
