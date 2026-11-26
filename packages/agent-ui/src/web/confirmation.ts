import {
  type ApprovalPartState,
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

const PENDING_MARK = `<span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true"></span>`;
const DEFAULT_PARTS = `<kind-confirmation-title></kind-confirmation-title><kind-confirmation-reason><kind-internal-textarea><ui-textarea><textarea aria-label="Reason for denying" placeholder="Add a reason (optional)" rows="2"></textarea></ui-textarea></kind-internal-textarea></kind-confirmation-reason><kind-confirmation-choices><kind-confirmation-approve><button>${PENDING_MARK}<span data-kind-label></span></button></kind-confirmation-approve><kind-confirmation-always><button>${PENDING_MARK}<span data-kind-label></span></button></kind-confirmation-always><kind-confirmation-deny><button>${PENDING_MARK}<span data-kind-label></span></button></kind-confirmation-deny><kind-confirmation-cancel><button>Cancel</button></kind-confirmation-cancel><kind-confirmation-error>Decision not sent. Try again.</kind-confirmation-error></kind-confirmation-choices><kind-confirmation-outcome><kind-confirmation-outcome-icon></kind-confirmation-outcome-icon><span data-confirmation-label></span><span data-confirmation-reason></span></kind-confirmation-outcome>`;

// Parts this element wrote text into. A part someone wrote text into keeps it, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const fill = (part: Element | null | undefined, text: string) => {
  if (!part || !(owned.has(part) || !part.textContent)) return;
  owned.add(part);
  if (part.textContent !== text) part.textContent = text;
};

// A button the host wrote takes its label as its text.
const label = (button: Element | null) => button?.querySelector("[data-kind-label]") ?? button;

const write = <Target extends object, Key extends keyof Target>(
  target: Target | null,
  key: Key,
  value: Target[Key],
) => {
  if (target && target[key] !== value) target[key] = value;
};

/** The `can-*` attributes that offer the choices of a component's approval part, as Tool's. */
export const APPROVAL_KINDS = {
  canApprove: "boolean",
  canDeny: "boolean",
  canAlwaysAllow: "boolean",
} as const;

export type ApprovalAttributes = { canApprove: boolean; canDeny: boolean; canAlwaysAllow: boolean };

/** Leaves out each approval callback whose attribute is off; with it, `@ui-sdk/web` fills it in with an event. */
export const approvalOptions = ({ canApprove, canDeny, canAlwaysAllow }: ApprovalAttributes) => ({
  ...(!canApprove && { onApprove: undefined }),
  ...(!canDeny && { onDeny: undefined }),
  ...(!canAlwaysAllow && { onAlwaysAllow: undefined }),
});

/** Writes an approval part's props onto the `kind-confirmation` inside it, its callbacks as the handlers. */
export const writeApproval = (
  confirmation: KindConfirmationElement,
  { onApprove, onDeny, onAlwaysAllow, ...props }: ApprovalPartState,
): void => {
  const target = confirmation as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries({
    ...props,
    approveHandler: onApprove,
    denyHandler: onDeny,
    alwaysAllowHandler: onAlwaysAllow,
  }))
    if (target[key] !== value) target[key] = value;
};

/**
 * `<kind-confirmation label="Run search_docs?">` fills in its title, reason box, choices and outcome when it has no
 * children. Set `approval` as a property. The `can-approve`, `can-always-allow` and `can-deny` attributes show
 * Approve, Always allow and Deny, which fire `approve`, `alwaysallow` and `deny` with the decision as
 * `detail.value`: call `event.detail.waitUntil(promise)` to keep the choices disabled until it settles.
 */
export function defineConfirmation(): void {
  if (customElements.get("kind-confirmation")) return;
  defineInternalTextarea();
  createParts(confirmationPrimitive, {
    root: {
      tag: "kind-confirmation",
      kinds: APPROVAL_KINDS,
      // The handlers of a Tool or Terminal, which offer the choices without the attributes.
      properties: ["approveHandler", "denyHandler", "alwaysAllowHandler"],
      // Without either, the callback is left out; with only the attribute, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const confirmation = el as KindConfirmationElement;
        const { approveHandler, denyHandler, alwaysAllowHandler } = confirmation;
        return {
          ...approvalOptions(confirmation),
          ...(approveHandler && { onApprove: approveHandler }),
          ...(denyHandler && { onDeny: denyHandler }),
          ...(alwaysAllowHandler && { onAlwaysAllow: alwaysAllowHandler }),
        };
      },
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const api = instance.api as ConfirmationApi;
        const draw = () => {
          const state = instance.get() as ConfirmationState;
          fill(el.querySelector("kind-confirmation-title"), state.title ?? "");
          fill(label(el.querySelector("kind-confirmation-approve button")), state.approveLabel);
          fill(label(el.querySelector("kind-confirmation-always button")), state.alwaysLabel);
          fill(label(el.querySelector("kind-confirmation-deny button")), state.denyLabel);
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
    title: "kind-confirmation-title",
    reason: "kind-confirmation-reason",
    choices: "kind-confirmation-choices",
    approve: { tag: "kind-confirmation-approve", target: wrappedButton, display: "contents" },
    always: { tag: "kind-confirmation-always", target: wrappedButton, display: "contents" },
    deny: { tag: "kind-confirmation-deny", target: wrappedButton, display: "contents" },
    cancel: { tag: "kind-confirmation-cancel", target: wrappedButton, display: "contents" },
    error: "kind-confirmation-error",
    outcome: "kind-confirmation-outcome",
    "outcome-icon": "kind-confirmation-outcome-icon",
  });
}

type DecisionEvent = CustomEvent<
  { value: ConfirmationDecision } & ActionDetails & Pick<UiActionDetail, "waitUntil">
>;

export type KindConfirmationEvents = {
  approve: DecisionEvent;
  deny: DecisionEvent;
  alwaysallow: DecisionEvent;
};

export interface KindConfirmationElement
  extends UiElement<KindConfirmationEvents>,
    AttributeProperties<typeof confirmationPrimitive, "approval" | "focusFallback"> {
  canApprove: boolean;
  canDeny: boolean;
  canAlwaysAllow: boolean;
  approval?: ConfirmationOptions["approval"];
  focusFallback?: ConfirmationOptions["focusFallback"];
  approveHandler?: ConfirmationCallback;
  denyHandler?: ConfirmationCallback;
  alwaysAllowHandler?: ConfirmationCallback;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-confirmation": KindConfirmationElement;
    "kind-confirmation-title": HTMLElement;
    "kind-confirmation-reason": HTMLElement;
    "kind-confirmation-choices": HTMLElement;
    "kind-confirmation-approve": HTMLElement;
    "kind-confirmation-always": HTMLElement;
    "kind-confirmation-deny": HTMLElement;
    "kind-confirmation-cancel": HTMLElement;
    "kind-confirmation-error": HTMLElement;
    "kind-confirmation-outcome": HTMLElement;
    "kind-confirmation-outcome-icon": HTMLElement;
  }
}
