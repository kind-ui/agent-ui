import {
  type NoticeOptions,
  type QuotaNoticeApi,
  type QuotaNoticeState,
  type QuotaNoticeUpgradeDetails,
  quotaNoticePrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiElement } from "@ui-sdk/web/events";
import "@ui-sdk/web/meter";

const HEAD =
  "<kind-quota-notice-icon></kind-quota-notice-icon><kind-quota-notice-title></kind-quota-notice-title><kind-quota-notice-meter><ui-meter data-agent-hidden><ui-meter-track><ui-meter-indicator></ui-meter-indicator></ui-meter-track><ui-meter-value></ui-meter-value></ui-meter></kind-quota-notice-meter><kind-quota-notice-reset></kind-quota-notice-reset>";
const UPGRADE = "<kind-quota-notice-upgrade><button></button></kind-quota-notice-upgrade>";
const DISMISS = "<kind-quota-notice-dismiss><button></button></kind-quota-notice-dismiss>";

// Parts this element filled in. A part someone wrote into keeps what they wrote, as React's children do. Kept
// across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

type MeterElement = HTMLElement & {
  value: number;
  max: number;
  locale: string | undefined;
  format: (() => string) | undefined;
  getValueLabel: (() => string) | undefined;
};

// Dismiss stays last, so Tab reaches the text's buttons before it, however late the host adds them. `moveBefore`
// keeps it focused where the browser has it; `append` blurs it.
const keepLast = (el: Movable, dismiss: Element | null) => {
  if (!dismiss || el.lastElementChild === dismiss) return;
  if (el.moveBefore) el.moveBefore(dismiss, null);
  else el.append(dismiss);
};

const fill = (part: Element | null, text: string) => {
  if (!part || (!owned.has(part) && part.textContent)) return;
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
 * `<kind-quota-notice used="800" limit="1000" period="this month" reset-at="…">` adds its mark, title, bar, reset
 * time, Upgrade and Dismiss, unless it has a mark of its own; Upgrade goes first in any
 * `<kind-quota-notice-actions>` it holds. The `can-upgrade` attribute shows Upgrade, which fires `upgrade`;
 * `can-dismiss` shows Dismiss, which fades the notice out and then fires `dismiss`: remove the notice then.
 */
export function defineQuotaNotice(): void {
  if (customElements.get("kind-quota-notice")) return;
  createParts(quotaNoticePrimitive, {
    root: {
      tag: "kind-quota-notice",
      kinds: { canDismiss: "boolean", canUpgrade: "boolean" },
      // Without an attribute its callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const { canDismiss, canUpgrade } = el as KindQuotaNoticeElement;
        return {
          ...(canDismiss ? {} : { onDismiss: undefined }),
          ...(canUpgrade ? {} : { onUpgrade: undefined }),
        };
      },
      render: (el, instance) => {
        let dismiss: Element | null = null;
        if (!el.querySelector(":scope > kind-quota-notice-icon")) {
          el.insertAdjacentHTML("afterbegin", HEAD);
          let actions = el.querySelector(":scope > kind-quota-notice-actions");
          if (!actions) {
            actions = document.createElement("kind-quota-notice-actions");
            el.append(actions);
          }
          actions.insertAdjacentHTML("afterbegin", UPGRADE);
          el.insertAdjacentHTML("beforeend", DISMISS);
          dismiss = el.lastElementChild;
        }
        const api = instance.api as QuotaNoticeApi;
        const draw = () => {
          const state = instance.get() as QuotaNoticeState;
          fill(el.querySelector(":scope > kind-quota-notice-title"), state.label);
          fill(el.querySelector(":scope > kind-quota-notice-reset"), api.resetText(state));
          fill(el.querySelector("kind-quota-notice-upgrade > button"), state.upgradeLabel);
          const meter = el.querySelector<MeterElement>("kind-quota-notice-meter ui-meter");
          const { value, max, locale, label, format, getValueLabel } = api.meterState(state);
          write(meter, "value", value);
          write(meter, "max", max);
          write(meter, "locale", locale);
          write(meter, "format", format);
          write(meter, "getValueLabel", getValueLabel);
          write(meter, "ariaLabel", label);
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
    icon: "kind-quota-notice-icon",
    title: "kind-quota-notice-title",
    meter: "kind-quota-notice-meter",
    reset: "kind-quota-notice-reset",
    description: "kind-quota-notice-description",
    actions: "kind-quota-notice-actions",
    upgrade: { tag: "kind-quota-notice-upgrade", target: wrappedButton, display: "contents" },
    dismiss: { tag: "kind-quota-notice-dismiss", target: wrappedButton, display: "contents" },
  });
}

export type KindQuotaNoticeEvents = {
  upgrade: CustomEvent<QuotaNoticeUpgradeDetails>;
  dismiss: CustomEvent<Pick<UiActionDetail, "waitUntil">>;
};

export interface KindQuotaNoticeElement
  extends UiElement<KindQuotaNoticeEvents>,
    AttributeProperties<typeof quotaNoticePrimitive> {
  canDismiss: boolean;
  canUpgrade: boolean;
  /** Where focus goes when Dismiss is pressed. Defaults to the next element Tab reaches after the notice. */
  focusFallback?: NoticeOptions["focusFallback"];
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-quota-notice": KindQuotaNoticeElement;
    "kind-quota-notice-icon": HTMLElement;
    "kind-quota-notice-title": HTMLElement;
    "kind-quota-notice-meter": HTMLElement;
    "kind-quota-notice-reset": HTMLElement;
    "kind-quota-notice-description": HTMLElement;
    "kind-quota-notice-actions": HTMLElement;
    "kind-quota-notice-upgrade": HTMLElement;
    "kind-quota-notice-dismiss": HTMLElement;
  }
}
