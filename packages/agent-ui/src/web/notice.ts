import { type NoticeOptions, noticePrimitive } from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiElement } from "@ui-sdk/web/events";

const HEAD = "<kind-notice-icon></kind-notice-icon><kind-notice-title></kind-notice-title>";
const DISMISS = "<kind-notice-dismiss><button></button></kind-notice-dismiss>";

// Titles this element filled in. A title someone wrote text into keeps it, as React's `NoticeTitle` children do.
// Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

/**
 * `<kind-notice variant="…" label="…">` takes its text inside a `<kind-notice-description>` and its buttons inside
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
        if (!el.querySelector(":scope > kind-notice-icon")) {
          el.insertAdjacentHTML("afterbegin", HEAD);
          el.insertAdjacentHTML("beforeend", DISMISS);
        }
        const draw = () => {
          const title = el.querySelector(":scope > kind-notice-title");
          if (!title || (!owned.has(title) && title.textContent)) return;
          owned.add(title);
          const { label } = instance.get();
          if (title.textContent !== label) title.textContent = label;
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    icon: "kind-notice-icon",
    title: "kind-notice-title",
    description: "kind-notice-description",
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
    "kind-notice-actions": HTMLElement;
    "kind-notice-dismiss": HTMLElement;
  }
}
