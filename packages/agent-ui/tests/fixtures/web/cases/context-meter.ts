import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineContextMeter } from "../../../../src/web/context-meter.js";
import { context, contextHost, levels } from "../../shared/context-meter.js";

const { host, record } = contextHost();

const page =
  (used: number = context.used, motion?: MotionMode) =>
  (root: HTMLElement) => {
    defineContextMeter();
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col items-start gap-4 p-6";
    const above = Object.assign(document.createElement("p"), { id: "above", textContent: "Above" });
    const row = document.createElement("div");
    row.className = "flex items-center gap-2";
    const meter = document.createElement("kind-context-meter");
    meter.id = "context";
    meter.used = used;
    meter.total = context.total;
    meter.usage = context.usage;
    meter.cost = context.cost;
    if (motion) meter.motion = motion;
    meter.addEventListener("openchange", (event) => record(event.detail.value, event.detail));
    const beside = Object.assign(document.createElement("span"), { id: "beside", textContent: "Beside" });
    row.append(meter, beside);
    wrapper.append(above, row);
    root.append(wrapper);
    Object.assign(window, {
      kindHost: {
        ...host,
        setUsed: (value: number) => {
          meter.used = value;
        },
      },
    });
  };

export const cases = {
  all: page(),
  high: page(levels.high),
  full: page(levels.full),
  reduced: page(context.used, "reduced"),
};
