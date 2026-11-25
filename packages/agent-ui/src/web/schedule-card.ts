import {
  type ScheduleCardActionDetails,
  type ScheduleCardApi,
  type ScheduleCardOptions,
  type ScheduleCardState,
  type ScheduleEnabledChangeReason,
  scheduleCardPrimitive,
  scheduleLastText,
  scheduleNextText,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineInternalSwitch } from "./internal/switch.js";

const DEFAULT_PARTS = `
  <kind-schedule-card-icon><span></span></kind-schedule-card-icon>
  <kind-schedule-card-title><p></p></kind-schedule-card-title>
  <kind-schedule-card-description><p></p></kind-schedule-card-description>
  <kind-schedule-card-next><p></p></kind-schedule-card-next>
  <kind-schedule-card-last><p><kind-schedule-card-last-mark><span></span></kind-schedule-card-last-mark><kind-schedule-card-last-link><a></a></kind-schedule-card-last-link></p></kind-schedule-card-last>
  <kind-schedule-card-enabled><label>Enabled<kind-internal-switch><ui-switch data-agent-hidden><ui-switch-thumb></ui-switch-thumb></ui-switch></kind-internal-switch></label></kind-schedule-card-enabled>
  <kind-schedule-card-run-now><button></button></kind-schedule-card-run-now>
  <kind-schedule-card-edit><button></button></kind-schedule-card-edit>`;

// Parts this element filled in, and so writes. A part someone wrote keeps its own, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const text = (part: Element | null, value: string) => {
  if (!part || !(owned.has(part) || !part.textContent?.trim())) return;
  owned.add(part);
  if (part.textContent !== value) part.textContent = value;
};

const write = <Target extends object, Key extends keyof Target>(
  target: Target | null,
  key: Key,
  value: Target[Key],
) => {
  if (target && target[key] !== value) target[key] = value;
};

/**
 * `<kind-schedule-card>` fills in its parts when it has no children. Set `schedule` as a property. Turning the switch
 * fires `enabledchange`; the switch shows `schedule.enabled`, so set a new `schedule` to take it. `can-run-now` offers
 * Run now, which fires `runnow`: call `event.detail.waitUntil(promise)` to keep it pending until the promise settles.
 * `can-edit` offers Edit, which fires `scheduleedit` with the schedule's id.
 */
export function defineScheduleCard(): void {
  if (customElements.get("kind-schedule-card")) return;
  defineInternalSwitch();
  createParts(scheduleCardPrimitive, {
    root: {
      tag: "kind-schedule-card",
      kinds: { canRunNow: "boolean", canEdit: "boolean" },
      defaults: { agentConfirm: true },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const element = el as KindScheduleCardElement;
        return {
          ...(element.canRunNow ? {} : { onRunNow: undefined }),
          ...(element.canEdit ? {} : { onEdit: undefined }),
        };
      },
      // Named after the card, since a page's own editors may fire an `edit` of their own.
      events: { onEdit: "scheduleedit" },
      // `runNow` and `edit` are offered only while available, so they aren't copied onto `api`.
      api: ["setEnabled"],
      render: (el, instance) => {
        const api = instance.api as ScheduleCardApi;
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const draw = () => {
          const state = instance.get() as ScheduleCardState;
          text(el.querySelector("kind-schedule-card-title > p"), state.label);
          text(el.querySelector("kind-schedule-card-description > p"), state.description);
          // Reads the live `seconds`, as React's next part does.
          text(el.querySelector("kind-schedule-card-next > p"), scheduleNextText(state));
          text(el.querySelector("kind-schedule-card-last-link > a"), scheduleLastText(state));
          text(
            el.querySelector("kind-schedule-card-run-now > button"),
            state.pending ? "Starting" : "Run now",
          );
          const control = el.querySelector<Element & { checked: boolean; ariaLabel: string | null }>(
            "kind-schedule-card-enabled ui-switch",
          );
          const { checked, "aria-label": label } = api.enabledState(state);
          write(control, "checked", checked);
          write(control, "ariaLabel", label);
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    icon: { tag: "kind-schedule-card-icon", target: wrappedChild("span"), display: "contents" },
    title: { tag: "kind-schedule-card-title", target: wrappedChild("p"), display: "contents" },
    description: { tag: "kind-schedule-card-description", target: wrappedChild("p"), display: "contents" },
    next: { tag: "kind-schedule-card-next", target: wrappedChild("p"), display: "contents" },
    last: { tag: "kind-schedule-card-last", target: wrappedChild("p"), display: "contents" },
    "last-mark": { tag: "kind-schedule-card-last-mark", target: wrappedChild("span"), display: "contents" },
    "last-link": { tag: "kind-schedule-card-last-link", target: wrappedChild("a"), display: "contents" },
    enabled: { tag: "kind-schedule-card-enabled", target: wrappedChild("label"), display: "contents" },
    "run-now": { tag: "kind-schedule-card-run-now", target: wrappedButton, display: "contents" },
    edit: { tag: "kind-schedule-card-edit", target: wrappedButton, display: "contents" },
  });
}

export type KindScheduleCardEvents = {
  enabledchange: UiChangeEvent<boolean, ScheduleEnabledChangeReason>;
  runnow: CustomEvent<ScheduleCardActionDetails & Pick<UiActionDetail, "waitUntil">>;
  scheduleedit: CustomEvent<ScheduleCardActionDetails & { value: string }>;
};

export interface KindScheduleCardElement
  extends UiElement<KindScheduleCardEvents>,
    AttributeProperties<typeof scheduleCardPrimitive, "api"> {
  schedule?: ScheduleCardOptions["schedule"];
  canRunNow: boolean;
  canEdit: boolean;
  api: Pick<ScheduleCardApi, "setEnabled">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-schedule-card": KindScheduleCardElement;
    "kind-schedule-card-icon": HTMLElement;
    "kind-schedule-card-title": HTMLElement;
    "kind-schedule-card-description": HTMLElement;
    "kind-schedule-card-next": HTMLElement;
    "kind-schedule-card-last": HTMLElement;
    "kind-schedule-card-last-mark": HTMLElement;
    "kind-schedule-card-last-link": HTMLElement;
    "kind-schedule-card-enabled": HTMLElement;
    "kind-schedule-card-run-now": HTMLElement;
    "kind-schedule-card-edit": HTMLElement;
  }
}
