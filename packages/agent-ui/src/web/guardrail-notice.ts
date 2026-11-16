import {
  type GuardrailNoticeApi,
  type GuardrailNoticeOpenChangeReason,
  guardrailNoticePrimitive,
  type NoticeOptions,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";

const HEAD = `<kind-guardrail-notice-icon></kind-guardrail-notice-icon><kind-guardrail-notice-title></kind-guardrail-notice-title><kind-guardrail-notice-reason></kind-guardrail-notice-reason><kind-guardrail-notice-detail-trigger><button>Why?</button></kind-guardrail-notice-detail-trigger><kind-guardrail-notice-detail><p></p></kind-guardrail-notice-detail>`;
const DISMISS = "<kind-guardrail-notice-dismiss><button></button></kind-guardrail-notice-dismiss>";

// Parts this element filled in. A part someone wrote into keeps what they wrote, as React's children do. Kept
// across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const fill = (part: Element | null, text: string) => {
  if (!part || (!owned.has(part) && part.textContent)) return;
  owned.add(part);
  if (part.textContent !== text) part.textContent = text;
};

/**
 * `<kind-guardrail-notice reason="…" detail="…">` adds its mark, title, reason, "Why?" and detail, and Dismiss
 * after any `<kind-guardrail-notice-actions>` it holds, unless it has a mark of its own. `blocking` makes it an
 * alert. The `can-dismiss` attribute shows Dismiss, which fades the notice out and then fires `dismiss`: remove the
 * notice then.
 */
export function defineGuardrailNotice(): void {
  if (customElements.get("kind-guardrail-notice")) return;
  createParts(guardrailNoticePrimitive, {
    root: {
      tag: "kind-guardrail-notice",
      kinds: { canDismiss: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindGuardrailNoticeElement).canDismiss ? {} : { onDismiss: undefined }),
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen", "toggle"],
      render: (el, instance) => {
        if (!el.querySelector(":scope > kind-guardrail-notice-icon")) {
          el.insertAdjacentHTML("afterbegin", HEAD);
          el.insertAdjacentHTML("beforeend", DISMISS);
        }
        const draw = () => {
          const { label, reason, detail } = instance.get();
          fill(el.querySelector(":scope > kind-guardrail-notice-title"), label);
          fill(el.querySelector(":scope > kind-guardrail-notice-reason"), reason);
          fill(el.querySelector(":scope > kind-guardrail-notice-detail > p"), detail);
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    icon: "kind-guardrail-notice-icon",
    title: "kind-guardrail-notice-title",
    reason: "kind-guardrail-notice-reason",
    "detail-trigger": {
      tag: "kind-guardrail-notice-detail-trigger",
      target: wrappedButton,
      display: "contents",
    },
    detail: "kind-guardrail-notice-detail",
    description: "kind-guardrail-notice-description",
    actions: "kind-guardrail-notice-actions",
    dismiss: { tag: "kind-guardrail-notice-dismiss", target: wrappedButton, display: "contents" },
  });
}

export type KindGuardrailNoticeEvents = {
  openchange: UiChangeEvent<boolean, GuardrailNoticeOpenChangeReason>;
  dismiss: CustomEvent<Pick<UiActionDetail, "waitUntil">>;
};

export interface KindGuardrailNoticeElement
  extends UiElement<KindGuardrailNoticeEvents>,
    AttributeProperties<typeof guardrailNoticePrimitive, "api" | "open"> {
  open: boolean;
  canDismiss: boolean;
  /** Where focus goes when Dismiss is pressed. Defaults to the next element Tab reaches after the notice. */
  focusFallback?: NoticeOptions["focusFallback"];
  api: Pick<GuardrailNoticeApi, "isOpen" | "setOpen" | "toggle">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-guardrail-notice": KindGuardrailNoticeElement;
    "kind-guardrail-notice-icon": HTMLElement;
    "kind-guardrail-notice-title": HTMLElement;
    "kind-guardrail-notice-reason": HTMLElement;
    "kind-guardrail-notice-detail-trigger": HTMLElement;
    "kind-guardrail-notice-detail": HTMLElement;
    "kind-guardrail-notice-description": HTMLElement;
    "kind-guardrail-notice-actions": HTMLElement;
    "kind-guardrail-notice-dismiss": HTMLElement;
  }
}
