import {
  type ConfirmationApi,
  type ConfirmationCallback,
  type ConfirmationDecision,
  type ConfirmationOptions,
  type ConfirmationState,
  confirmationPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ActionDetails } from "@ui-sdk/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiElement } from "@ui-sdk/web/events";
import { defineInternalTextarea } from "./internal/textarea.js";

const DEFAULT_PARTS = `<kind-confirmation-reason><kind-internal-textarea><ui-textarea><textarea aria-label="Reason for denying" placeholder="Add a reason (optional)" rows="2"></textarea></ui-textarea></kind-internal-textarea></kind-confirmation-reason><kind-confirmation-choices><kind-confirmation-approve><button></button></kind-confirmation-approve><kind-confirmation-deny><button></button></kind-confirmation-deny><kind-confirmation-error>Decision not sent. Try again.</kind-confirmation-error></kind-confirmation-choices><kind-confirmation-outcome><kind-confirmation-outcome-icon></kind-confirmation-outcome-icon><span data-confirmation-label></span><span data-confirmation-reason></span></kind-confirmation-outcome>`;

// Parts this element wrote text into. A part someone wrote text into keeps it, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const fill = (part: Element | null | undefined, text: string) => {
  if (!part || !(owned.has(part) || !part.textContent)) return;
  owned.add(part);
  if (part.textContent !== text) part.textContent = text;
};

const write = <Target extends object, Key extends keyof Target>(
  target: Target | null,
  key: Key,
  value: Target[Key],
) => {
  if (target && target[key] !== value) target[key] = value;
};

/**
 * `<kind-confirmation label="Run search_docs?">` fills in its reason box, choices and outcome when it has no
 * children. Set `approval` as a property. The `can-approve` and `can-deny` attributes show Approve and Deny, which
 * fire `approve` and `deny` with the decision as `detail.value`: call `event.detail.waitUntil(promise)` to keep both
 * choices disabled until it settles.
 */
export function defineConfirmation(): void {
  if (customElements.get("kind-confirmation")) return;
  defineInternalTextarea();
  createParts(confirmationPrimitive, {
    root: {
      tag: "kind-confirmation",
      kinds: { canApprove: "boolean", canDeny: "boolean" },
      // A Tool's own handlers, which offer the choices without the attributes.
      properties: ["approveHandler", "denyHandler"],
      // Without either, the callback is left out; with only the attribute, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const { canApprove, canDeny, approveHandler, denyHandler } = el as KindConfirmationElement;
        return {
          ...(approveHandler ? { onApprove: approveHandler } : !canApprove && { onApprove: undefined }),
          ...(denyHandler ? { onDeny: denyHandler } : !canDeny && { onDeny: undefined }),
        };
      },
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const api = instance.api as ConfirmationApi;
        const draw = () => {
          const state = instance.get() as ConfirmationState;
          fill(el.querySelector("kind-confirmation-approve button"), state.approveLabel);
          fill(el.querySelector("kind-confirmation-deny button"), state.denyLabel);
          fill(el.querySelector("kind-confirmation-outcome [data-confirmation-label]"), state.outcome ?? "");
          fill(
            el.querySelector("kind-confirmation-outcome [data-confirmation-reason]"),
            state.outcomeReason ?? "",
          );
          const { controller, readOnly } = api.reasonState(state);
          write(
            el.querySelector<Element & { controller?: unknown }>("kind-confirmation-reason ui-textarea"),
            "controller",
            controller,
          );
          write(
            el.querySelector<HTMLTextAreaElement>("kind-confirmation-reason textarea"),
            "readOnly",
            readOnly,
          );
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        const arrivals = new MutationObserver((records) => {
          if (records.some((record) => [...record.addedNodes].some((node) => node instanceof Element)))
            draw();
        });
        arrivals.observe(el, { childList: true, subtree: true });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    reason: "kind-confirmation-reason",
    choices: "kind-confirmation-choices",
    approve: { tag: "kind-confirmation-approve", target: wrappedButton, display: "contents" },
    deny: { tag: "kind-confirmation-deny", target: wrappedButton, display: "contents" },
    error: "kind-confirmation-error",
    outcome: "kind-confirmation-outcome",
    "outcome-icon": "kind-confirmation-outcome-icon",
  });
}

type DecisionEvent = CustomEvent<
  { value: ConfirmationDecision } & ActionDetails & Pick<UiActionDetail, "waitUntil">
>;

export type KindConfirmationEvents = { approve: DecisionEvent; deny: DecisionEvent };

export interface KindConfirmationElement
  extends UiElement<KindConfirmationEvents>,
    AttributeProperties<typeof confirmationPrimitive, "approval" | "focusFallback"> {
  canApprove: boolean;
  canDeny: boolean;
  approval?: ConfirmationOptions["approval"];
  focusFallback?: ConfirmationOptions["focusFallback"];
  approveHandler?: ConfirmationCallback;
  denyHandler?: ConfirmationCallback;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-confirmation": KindConfirmationElement;
    "kind-confirmation-reason": HTMLElement;
    "kind-confirmation-choices": HTMLElement;
    "kind-confirmation-approve": HTMLElement;
    "kind-confirmation-deny": HTMLElement;
    "kind-confirmation-error": HTMLElement;
    "kind-confirmation-outcome": HTMLElement;
    "kind-confirmation-outcome-icon": HTMLElement;
  }
}
