import { defineScheduleCard } from "../../../../src/web/schedule-card.js";
import { scheduleCardHost, schedules } from "../../shared/schedule-card.js";

const page =
  ({
    name = "all",
    refusing = false,
    agentConfirm,
    actions = true,
  }: {
    name?: string;
    refusing?: boolean;
    agentConfirm?: boolean;
    actions?: boolean;
  } = {}) =>
  (root: HTMLElement) => {
    defineScheduleCard();
    const { host, record, runNow } = scheduleCardHost();
    const wrapper = Object.assign(document.createElement("div"), { className: "max-w-[28rem] p-6" });
    const card = document.createElement("kind-schedule-card");
    card.id = "schedule";
    card.schedule = schedules[name] ?? schedules.all;
    card.timeZone = "UTC";
    if (agentConfirm !== undefined) card.agentConfirm = agentConfirm;
    card.addEventListener("enabledchange", (event) => {
      record("enabled", event.detail, event.detail.value);
      if (!refusing && card.schedule) card.schedule = { ...card.schedule, enabled: event.detail.value };
    });
    if (actions) {
      card.canRunNow = true;
      card.canEdit = true;
      card.addEventListener("runnow", (event) => event.detail.waitUntil(runNow(event.detail)));
      card.addEventListener("scheduleedit", (event) => record("edit", event.detail, event.detail.value));
    }
    wrapper.append(card);
    root.append(wrapper);
    Object.assign(window, { kindHost: host });
  };

export const cases = {
  all: page(),
  soon: page({ name: "soon" }),
  paused: page({ name: "paused" }),
  unsafe: page({ name: "unsafe" }),
  new: page({ name: "new" }),
  refusing: page({ refusing: true }),
  unconfirmed: page({ agentConfirm: false }),
  bare: page({ actions: false }),
};
