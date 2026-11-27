import { type NoticeApi, type NoticeOptions, noticePrimitive } from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiElement } from "@ui-sdk/web/events";

const HEAD =
  "<kind-notice-icon></kind-notice-icon><kind-notice-title></kind-notice-title><kind-notice-reset></kind-notice-reset>";
const DISMISS = "<kind-notice-dismiss><button></button></kind-notice-dismiss>";

// Titles this element filled in. A title someone wrote text into keeps it, as React's `NoticeTitle` children do.
// Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// Dismiss stays last, so Tab reaches the text's buttons before it, however late the host adds them. `moveBefore`
// keeps it focused where the browser has it; `append` blurs it.
const keepLast = (el: Movable, dismiss: Element | null) => {
  if (!dismiss || el.lastElementChild === dismiss) return;
  if (el.moveBefore) el.moveBefore(dismiss, null);
  else el.append(dismiss);
};

/**
 * `<kind-notice variant="…" label="…" resets-at="…">` takes its text inside a `<kind-notice-description>` and its buttons inside
 * a `<kind-notice-actions>`, and adds its mark and title before them and Dismiss after them, unless it has a mark
 * of its own. The `can-dismiss` attribute shows Dismiss, which fades the notice out and then fires `dismiss`:
 * remove the notice then, or call `event.detail.waitUntil(promise)` and reject it to bring the notice back.
 */
export function defineNotice(): void {
  if (customElements.get("kind-notice")) return;
  createParts(noticePrimitive, {
    root: {
      tag: "kind-notice",
      kinds: { canDismiss: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindNoticeElement).canDismiss ? {} : { onDismiss: undefined }),
      render: (el, instance) => {
        let dismiss: Element | null = null;
        if (!el.querySelector(":scope > kind-notice-icon")) {
          el.insertAdjacentHTML("afterbegin", HEAD);
          el.insertAdjacentHTML("beforeend", DISMISS);
          dismiss = el.lastElementChild;
        }
        const fill = (part: Element | null, text: string) => {
          if (!part || (!owned.has(part) && part.textContent)) return;
          owned.add(part);
          if (part.textContent !== text) part.textContent = text;
        };
        const draw = () => {
          const state = instance.get();
          fill(el.querySelector(":scope > kind-notice-title"), state.label);
          fill(el.querySelector(":scope > kind-notice-reset"), (instance.api as NoticeApi).resetText(state));
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        const arrivals = new MutationObserver(() => keepLast(el, dismiss));
        arrivals.observe(el, { childList: true });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    icon: "kind-notice-icon",
    title: "kind-notice-title",
    description: "kind-notice-description",
    reset: "kind-notice-reset",
    actions: "kind-notice-actions",
    dismiss: { tag: "kind-notice-dismiss", target: wrappedButton, display: "contents" },
  });
}

export type KindNoticeEvents = {
  dismiss: CustomEvent<Pick<UiActionDetail, "waitUntil">>;
};

export interface KindNoticeElement
  extends UiElement<KindNoticeEvents>,
    AttributeProperties<typeof noticePrimitive> {
  canDismiss: boolean;
  /** Where focus goes when Dismiss is pressed. Defaults to the next element Tab reaches after the notice. */
  focusFallback?: NoticeOptions["focusFallback"];
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-notice": KindNoticeElement;
    "kind-notice-icon": HTMLElement;
    "kind-notice-title": HTMLElement;
    "kind-notice-description": HTMLElement;
    "kind-notice-reset": HTMLElement;
    "kind-notice-actions": HTMLElement;
    "kind-notice-dismiss": HTMLElement;
  }
}
