import { defineActivityGraph } from "../../../../src/web/activity-graph.js";
import { activityDays, activityHost, activityNow } from "../../shared/activity-graph.js";

const { host, record } = activityHost();

const graph = (root: HTMLElement, attributes: string, wrap = (html: string) => html) => {
  defineActivityGraph();
  Object.assign(window, { kindHost: host });
  root.innerHTML = `<div class="bg-[var(--kind-color-surface)] p-6">${wrap(
    `<kind-activity-graph now="${activityNow}" time-zone="UTC" ${attributes}></kind-activity-graph>`,
  )}</div>`;
  const el = root.querySelector("kind-activity-graph");
  if (!el) return;
  el.days = activityDays;
  el.addEventListener("dayselect", (event) => record(event.detail.value, event.detail));
};

export const cases = {
  all: (root: HTMLElement) => graph(root, "can-select"),
  "read-only": (root: HTMLElement) => graph(root, ""),
  monday: (root: HTMLElement) =>
    graph(root, `can-select week-start="1" weeks="8" unit="tokens" unit-one="token" label="Tokens"`),
  rtl: (root: HTMLElement) => graph(root, "can-select", (html) => `<div dir="rtl">${html}</div>`),
  narrow: (root: HTMLElement) => graph(root, "", (html) => `<div style="width: 320px">${html}</div>`),
};
