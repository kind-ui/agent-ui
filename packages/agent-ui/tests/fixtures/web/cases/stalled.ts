import { defineStatus } from "../../../../src/web/status.js";
import { defineStep } from "../../../../src/web/step.js";
import { defineThinkingIndicator } from "../../../../src/web/thinking-indicator.js";
import { stalled } from "../../shared/stalled.js";

const step = (id: "running" | "stalled") => `
  <div class="w-full">
    <kind-step id="${id}" status="running" auto-open="never" last-activity-at="${stalled[id].lastActivityAt}">
      <kind-step-trigger><button>
        <kind-step-icon></kind-step-icon>
        <kind-step-title>${stalled[id].title}</kind-step-title>
        <kind-step-meta>${stalled[id].meta}</kind-step-meta>
      </button></kind-step-trigger>
      <kind-step-content><p>Reading the API reference.</p></kind-step-content>
    </kind-step>
  </div>`;

export const cases = {
  all: (root: HTMLElement) => {
    defineStep();
    defineStatus();
    defineThinkingIndicator();
    root.innerHTML = `<div class="flex w-[28rem] flex-col items-start gap-6 p-6">
      ${step("running")}${step("stalled")}
      <kind-thinking-indicator id="indicator" last-activity-at="${stalled.indicator.lastActivityAt}"></kind-thinking-indicator>
      <kind-status id="status" status="running" label="${stalled.status.label}" last-activity-at="${stalled.status.lastActivityAt}"></kind-status>
    </div>`;
    Object.assign(window, {
      kindStalled: {
        touch: (id: string) =>
          root.querySelector(`#${id}`)?.setAttribute("last-activity-at", new Date().toISOString()),
      },
    });
  },
};
