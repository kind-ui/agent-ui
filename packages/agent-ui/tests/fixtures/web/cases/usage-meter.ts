import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineUsageMeter, type KindUsageMeterElement } from "../../../../src/web/usage-meter.js";
import { levels, requests, reset, usage, usageHost } from "../../shared/usage-meter.js";

const { host, record } = usageHost();

const page =
  (used: number = usage.used, motion?: MotionMode, extra: Partial<KindUsageMeterElement> = {}) =>
  (root: HTMLElement) => {
    defineUsageMeter();
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col items-start gap-4 p-6";
    const above = Object.assign(document.createElement("p"), { id: "above", textContent: "Above" });
    const row = document.createElement("div");
    row.className = "flex items-center gap-2";
    const meter = document.createElement("kind-usage-meter");
    meter.id = "usage";
    Object.assign(meter, usage, { used }, extra);
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
  warning: page(levels.warning),
  error: page(levels.error),
  reduced: page(usage.used, "reduced"),
  requests: page(requests.used, undefined, { ...requests, breakdown: undefined }),
  reset: page(usage.used, undefined, { resetAt: reset.resetAt }),
};
