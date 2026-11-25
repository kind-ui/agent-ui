import "@ui-sdk/web/avatar";
import {
  type AgentCardActionReason,
  type AgentCardOptions,
  agentCardPrimitive,
  agentCardStatus,
  avatarInitials,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";

const PARTS = `<kind-agent-card-avatar></kind-agent-card-avatar><kind-agent-card-name></kind-agent-card-name><kind-agent-card-status></kind-agent-card-status><kind-agent-card-model></kind-agent-card-model><kind-agent-card-action><button></button></kind-agent-card-action><kind-agent-card-description></kind-agent-card-description><kind-agent-card-capabilities></kind-agent-card-capabilities>`;

// Parts this element filled in. A part someone wrote into keeps what they wrote, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const claim = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || !part.firstChild)) return false;
  owned.add(part);
  return true;
};

const fill = (part: Element | null, text: string) => {
  if (claim(part) && part.textContent !== text) part.textContent = text;
};

/**
 * `<kind-agent-card>` takes its `agent` as a property and adds its parts when it has none, filling each empty one in.
 * The `can-run` attribute shows the action, which fires `agentaction` with the agent's `id`.
 */
export function defineAgentCard(): void {
  if (customElements.get("kind-agent-card")) return;
  createParts(agentCardPrimitive, {
    root: {
      tag: "kind-agent-card",
      kinds: { canRun: "boolean" },
      events: { onAction: "agentaction" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindAgentCardElement).canRun ? {} : { onAction: undefined }),
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = PARTS;
        const own = (tag: string) => el.querySelector(`kind-agent-card-${tag}`);
        const draw = () => {
          const state = instance.get();
          const document = el.ownerDocument;

          const avatar = own("avatar");
          if (claim(avatar)) {
            let root = avatar.querySelector("ui-avatar");
            if (!root) {
              root = document.createElement("ui-avatar");
              root.append(document.createElement("ui-avatar-fallback"));
              avatar.replaceChildren(root);
            }
            let image = root.querySelector(":scope > img");
            if (state.avatarUrl) {
              if (!image) {
                image = document.createElement("img");
                image.setAttribute("alt", "");
                root.prepend(image);
              }
              if (image.getAttribute("src") !== state.avatarUrl) image.setAttribute("src", state.avatarUrl);
            } else image?.remove();
            const fallback = root.querySelector("ui-avatar-fallback");
            const initials = avatarInitials(state.name);
            if (fallback && fallback.textContent !== initials) fallback.textContent = initials;
          }

          const name = own("name");
          if (claim(name)) {
            const link = name.querySelector(":scope > a");
            if (state.href) {
              const anchor = link ?? document.createElement("a");
              if (!link) name.replaceChildren(anchor);
              if (anchor.getAttribute("href") !== state.href) anchor.setAttribute("href", state.href);
              if (anchor.textContent !== state.name) anchor.textContent = state.name;
            } else if (link || name.textContent !== state.name) name.textContent = state.name;
          }

          fill(own("model"), state.model);
          fill(own("description"), state.description);
          fill(own("action > button"), state.actionLabel);

          const status = own("status");
          if (claim(status) && state.status) {
            if (!status.firstChild) status.append(document.createElement("kind-agent-card-status-icon"), "");
            const words = status.lastChild;
            const label = agentCardStatus(state.status);
            if (words && words.textContent !== label) words.textContent = label;
          }

          const list = own("capabilities");
          if (claim(list)) {
            const items = [...list.children];
            const same =
              items.length === state.capabilities.length &&
              items.every((item, index) => item.getAttribute("value") === state.capabilities[index]);
            if (!same)
              list.replaceChildren(
                ...state.capabilities.map((capability) => {
                  const item = document.createElement("kind-agent-card-capability");
                  item.setAttribute("value", capability);
                  item.textContent = capability;
                  return item;
                }),
              );
          }
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        return unsubscribe;
      },
    },
    avatar: "kind-agent-card-avatar",
    name: "kind-agent-card-name",
    model: "kind-agent-card-model",
    description: "kind-agent-card-description",
    capabilities: "kind-agent-card-capabilities",
    capability: "kind-agent-card-capability",
    status: "kind-agent-card-status",
    "status-icon": "kind-agent-card-status-icon",
    action: { tag: "kind-agent-card-action", target: wrappedButton, display: "contents" },
  });
}

export type KindAgentCardEvents = {
  agentaction: UiChangeEvent<string, AgentCardActionReason>;
};

export interface KindAgentCardElement
  extends UiElement<KindAgentCardEvents>,
    AttributeProperties<typeof agentCardPrimitive, "api" | "agent"> {
  canRun: boolean;
  agent?: AgentCardOptions["agent"];
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-agent-card": KindAgentCardElement;
    "kind-agent-card-avatar": HTMLElement;
    "kind-agent-card-name": HTMLElement;
    "kind-agent-card-model": HTMLElement;
    "kind-agent-card-description": HTMLElement;
    "kind-agent-card-capabilities": HTMLElement;
    "kind-agent-card-capability": HTMLElement;
    "kind-agent-card-status": HTMLElement;
    "kind-agent-card-status-icon": HTMLElement;
    "kind-agent-card-action": HTMLElement;
  }
}
