import "@ui-sdk/web/avatar";
import {
  avatarInitials,
  type HandoffApi,
  type HandoffOptions,
  type HandoffParty,
  type HandoffState,
  handoffPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiElement } from "@ui-sdk/web/events";
import {
  APPROVAL_KINDS,
  type ApprovalAttributes,
  approvalOptions,
  defineConfirmation,
  type KindConfirmationElement,
  type KindConfirmationEvents,
  writeApproval,
} from "./confirmation.js";

const DEFAULT_PARTS = `<kind-handoff-from-avatar></kind-handoff-from-avatar><kind-handoff-to-avatar></kind-handoff-to-avatar><kind-handoff-text><p></p></kind-handoff-text><kind-handoff-status><kind-handoff-status-icon></kind-handoff-status-icon></kind-handoff-status><kind-handoff-reason><blockquote></blockquote></kind-handoff-reason><kind-handoff-approval></kind-handoff-approval>`;

// Parts this element filled in. A part someone wrote into keeps what they wrote, as React's children do. Kept
// across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Node>();

const claim = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || !part.firstChild)) return false;
  owned.add(part);
  return true;
};

const fill = (part: Element | null, text: string) => {
  if (claim(part) && part.textContent !== text) part.textContent = text;
};

/** The status's words, in a text node of their own after the mark, unless someone wrote the part's content. */
const fillStatus = (part: Element | null, text: string) => {
  if (!part) return;
  let words = [...part.childNodes].find((node) => owned.has(node));
  if (!words) {
    const written = [...part.childNodes].some(
      (node) => node.nodeName !== "KIND-HANDOFF-STATUS-ICON" && node.textContent?.trim(),
    );
    if (written) return;
    words = part.appendChild(part.ownerDocument.createTextNode(""));
    owned.add(words);
  }
  if (words.textContent !== text) words.textContent = text;
};

/** Fills an empty avatar part with a UI SDK Avatar of `src`, its initials until it loads. */
const drawAvatar = (part: Element | null, src: string | undefined, initials: string) => {
  if (!claim(part)) return;
  const document = part.ownerDocument;
  let avatar = part.querySelector("ui-avatar");
  if (!avatar) {
    avatar = document.createElement("ui-avatar");
    avatar.append(document.createElement("ui-avatar-fallback"));
    part.replaceChildren(avatar);
  }
  let image = avatar.querySelector(":scope > img");
  if (src) {
    if (!image) {
      image = document.createElement("img");
      image.setAttribute("alt", "");
      avatar.prepend(image);
    }
    if (image.getAttribute("src") !== src) image.setAttribute("src", src);
  } else image?.remove();
  const fallback = avatar.querySelector("ui-avatar-fallback");
  if (fallback && fallback.textContent !== initials) fallback.textContent = initials;
};

/**
 * `<kind-handoff status="…" reason="…">` fills in its parts when it has no children. Set `from` and `to` as
 * properties. While `approval` is set (a property), an empty `<kind-handoff-approval>` gets a `kind-confirmation`,
 * which offers Approve with the `can-approve` attribute, Always allow with `can-always-allow` and Deny with
 * `can-deny`, which fire `approve`, `alwaysallow` and `deny` on the handoff.
 */
export function defineHandoff(): void {
  if (customElements.get("kind-handoff")) return;
  defineConfirmation();
  createParts(handoffPrimitive, {
    root: {
      tag: "kind-handoff",
      kinds: { ...APPROVAL_KINDS },
      options: (el) => approvalOptions(el as KindHandoffElement),
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const api = instance.api as HandoffApi;
        const draw = () => {
          const state = instance.get() as HandoffState;
          if (state.fromAgent)
            drawAvatar(
              el.querySelector("kind-handoff-from-avatar"),
              state.fromSrc,
              avatarInitials(state.fromName),
            );
          if (state.toAgent)
            drawAvatar(el.querySelector("kind-handoff-to-avatar"), state.toSrc, avatarInitials(state.toName));
          fill(el.querySelector("kind-handoff-text > p"), state.text);
          fill(el.querySelector("kind-handoff-reason > blockquote"), state.reason);
          fillStatus(el.querySelector("kind-handoff-status"), state.statusText);
          // Filled only once there's an approval, so a handoff without one holds no Confirmation.
          const approval = state.approval && el.querySelector("kind-handoff-approval");
          if (approval) {
            if (!approval.firstElementChild) approval.innerHTML = "<kind-confirmation></kind-confirmation>";
            const confirmation = approval.querySelector<KindConfirmationElement>(
              ":scope > kind-confirmation",
            );
            if (confirmation) writeApproval(confirmation, api.approvalState(state));
          }
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        // Parts written after the element connected, like a reason a framework renders later, are filled in too.
        const arrivals = new MutationObserver((records) => {
          const arrived = records.some(
            (record) =>
              !(record.target instanceof Element && record.target.closest("kind-confirmation")) &&
              [...record.addedNodes].some((node) => node instanceof Element),
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
    "from-avatar": "kind-handoff-from-avatar",
    "to-avatar": "kind-handoff-to-avatar",
    text: { tag: "kind-handoff-text", target: wrappedChild("p"), display: "contents" },
    reason: { tag: "kind-handoff-reason", target: wrappedChild("blockquote"), display: "contents" },
    status: "kind-handoff-status",
    "status-icon": "kind-handoff-status-icon",
    approval: "kind-handoff-approval",
  });
}

export type KindHandoffEvents = {
  approve: KindConfirmationEvents["approve"];
  deny: KindConfirmationEvents["deny"];
  alwaysallow: KindConfirmationEvents["alwaysallow"];
};

export interface KindHandoffElement
  extends UiElement<KindHandoffEvents>,
    AttributeProperties<typeof handoffPrimitive, "from" | "to" | "approval">,
    ApprovalAttributes {
  from?: HandoffParty;
  to?: HandoffParty;
  approval?: HandoffOptions["approval"];
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-handoff": KindHandoffElement;
    "kind-handoff-from-avatar": HTMLElement;
    "kind-handoff-to-avatar": HTMLElement;
    "kind-handoff-text": HTMLElement;
    "kind-handoff-reason": HTMLElement;
    "kind-handoff-status": HTMLElement;
    "kind-handoff-status-icon": HTMLElement;
    "kind-handoff-approval": HTMLElement;
  }
}
