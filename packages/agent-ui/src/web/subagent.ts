import "@ui-sdk/web/avatar";
import {
  avatarInitials,
  type StepApi,
  type StepOpenChangeReason,
  type SubagentState,
  subagentPrimitive,
  subagentStatus,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineMarkdown, type KindMarkdownElement } from "./markdown.js";

const TRIGGER = `<kind-subagent-trigger><button><kind-subagent-avatar></kind-subagent-avatar><kind-subagent-title></kind-subagent-title><kind-subagent-icon></kind-subagent-icon><kind-subagent-meta></kind-subagent-meta></button></kind-subagent-trigger>`;
const END = `<kind-subagent-cancel><button>Stop</button></kind-subagent-cancel><kind-subagent-result></kind-subagent-result>`;

// Parts this element filled in. A part someone wrote into keeps what they wrote, as React's children do. Kept
// across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const claim = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || !part.firstChild)) return false;
  owned.add(part);
  return true;
};

const fill = (part: Element | null, text: string) => {
  if (claim(part) && part.textContent !== text) part.textContent = text;
};

/** Fills an empty avatar part with a UI SDK Avatar, and keeps the one it wrote current. */
const drawAvatar = (part: Element | null, name: string, src: string | undefined) => {
  if (!claim(part)) return;
  let avatar = part.querySelector("ui-avatar");
  if (!avatar) {
    avatar = part.ownerDocument.createElement("ui-avatar");
    avatar.append(part.ownerDocument.createElement("ui-avatar-fallback"));
    part.replaceChildren(avatar);
  }
  let image = avatar.querySelector(":scope > img");
  if (src) {
    if (!image) {
      image = part.ownerDocument.createElement("img");
      image.setAttribute("alt", "");
      avatar.prepend(image);
    }
    if (image.getAttribute("src") !== src) image.setAttribute("src", src);
  } else image?.remove();
  fill(avatar.querySelector("ui-avatar-fallback"), avatarInitials(name));
};

/**
 * `<kind-subagent agent-name="…" status="…">` takes the subagent's steps inside a `<kind-subagent-content>`, and
 * adds its trigger before that and its Stop button and result after it, unless it has a trigger of its own. It
 * writes its `result` into a `<kind-markdown>` inside an empty `kind-subagent-result`. The `can-cancel` attribute
 * shows Stop, which fires `subagentcancel`: call `event.detail.waitUntil(promise)` to keep it pending.
 */
export function defineSubagent(): void {
  if (customElements.get("kind-subagent")) return;
  defineMarkdown();
  createParts(subagentPrimitive, {
    root: {
      tag: "kind-subagent",
      kinds: { canCancel: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindSubagentElement).canCancel ? {} : { onCancel: undefined }),
      events: { onCancel: "subagentcancel" },
      defaults: { agentConfirm: true },
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen", "expand", "collapse", "toggle"],
      render: (el, instance) => {
        // Lookups stay out of nested subagents.
        const own = (tag: string) =>
          [...el.querySelectorAll(tag)].find((part) => part.closest("kind-subagent") === el) ?? null;
        // The parts go around the content, never the other way, so a framework rendering the steps keeps every node
        // where it put it.
        if (!own("kind-subagent-trigger")) {
          let content = el.querySelector(":scope > kind-subagent-content");
          if (!content) content = el.appendChild(el.ownerDocument.createElement("kind-subagent-content"));
          content.insertAdjacentHTML("beforebegin", TRIGGER);
          content.insertAdjacentHTML("afterend", END);
        }
        const draw = () => {
          const { title, status, durationSeconds, agentName, avatarSrc, result } =
            instance.get() as SubagentState;
          fill(own("kind-subagent-title"), title);
          fill(own("kind-subagent-meta"), subagentStatus(status, durationSeconds));
          drawAvatar(own("kind-subagent-avatar"), agentName, avatarSrc);
          const resultPart = own("kind-subagent-result");
          if (claim(resultPart)) {
            let markdown = resultPart.querySelector<KindMarkdownElement>(":scope > kind-markdown");
            // Left empty without a result, so the part hides.
            if (!result) markdown?.remove();
            else {
              if (!markdown) {
                markdown = resultPart.ownerDocument.createElement("kind-markdown");
                resultPart.replaceChildren(markdown);
              }
              if (markdown.source !== result) markdown.source = result;
            }
          }
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        const arrivals = new MutationObserver((records) => {
          // The subagent's steps and the blocks `kind-markdown` renders aren't its parts.
          const arrived = records.some(
            (record) =>
              !(
                record.target instanceof Element &&
                record.target.closest("kind-subagent-content, kind-markdown")
              ) && [...record.addedNodes].some((node) => node instanceof Element),
          );
          if (arrived) draw();
        });
        arrivals.observe(el, { childList: true, subtree: true });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    trigger: { tag: "kind-subagent-trigger", target: wrappedButton, display: "contents" },
    avatar: "kind-subagent-avatar",
    icon: "kind-subagent-icon",
    title: "kind-subagent-title",
    meta: "kind-subagent-meta",
    content: "kind-subagent-content",
    children: "kind-subagent-children",
    cancel: { tag: "kind-subagent-cancel", target: wrappedButton, display: "contents" },
    result: "kind-subagent-result",
  });
}

export type KindSubagentEvents = {
  openchange: UiChangeEvent<boolean, StepOpenChangeReason>;
  subagentcancel: CustomEvent<Pick<UiActionDetail, "waitUntil">>;
};

export interface KindSubagentElement
  extends UiElement<KindSubagentEvents>,
    AttributeProperties<typeof subagentPrimitive, "api" | "open"> {
  open: boolean;
  canCancel: boolean;
  api: Pick<StepApi, "isOpen" | "setOpen" | "expand" | "collapse" | "toggle">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-subagent": KindSubagentElement;
    "kind-subagent-trigger": HTMLElement;
    "kind-subagent-avatar": HTMLElement;
    "kind-subagent-icon": HTMLElement;
    "kind-subagent-title": HTMLElement;
    "kind-subagent-meta": HTMLElement;
    "kind-subagent-content": HTMLElement;
    "kind-subagent-children": HTMLElement;
    "kind-subagent-cancel": HTMLElement;
    "kind-subagent-result": HTMLElement;
  }
}
