import type { ContextMeterOptions, MotionMode } from "@kind-ui/agent-ui/core";
import { defineContextMeter } from "../../../../src/web/context-meter.js";
import { context, contextHost, levels, meterCases } from "../../shared/context-meter.js";

const { host, record, compact } = contextHost();

const page =
  (
    used: number = context.used,
    motion?: MotionMode,
    locale?: string,
    markup?: string,
    extra: ContextMeterOptions = {},
  ) =>
  (root: HTMLElement) => {
    defineContextMeter();
    const wrapper = document.createElement("div");
    wrapper.className = `flex flex-col items-start gap-4 p-6 ${extra.layout === "inline" ? "w-[32rem]" : ""}`;
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
    if (locale) meter.locale = locale;
    if (markup) meter.innerHTML = markup;
    // Before the element connects, so it draws the parts its options need.
    if (extra.layout) meter.setAttribute("layout", extra.layout);
    Object.assign(meter, { ...extra, layout: extra.layout });
    meter.canCompact = Object.keys(extra).length > 0 && !("onCompact" in extra);
    meter.addEventListener("compact", (event) =>
      (event as CustomEvent).detail.waitUntil(compact((event as CustomEvent).detail.value)),
    );
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
  german: page(context.used, undefined, "de-DE"),
  breakdown: page(undefined, undefined, undefined, undefined, meterCases.breakdown),
  limits: page(undefined, undefined, undefined, undefined, meterCases.limits),
  "near-cap": page(undefined, undefined, undefined, undefined, meterCases["near-cap"]),
  compacting: page(undefined, undefined, undefined, undefined, meterCases.compacting),
  inline: page(undefined, undefined, undefined, undefined, meterCases.inline),
  written: page(
    context.used,
    undefined,
    undefined,
    `<kind-context-meter-trigger><button><kind-context-meter-value><ui-meter><ui-meter-track></ui-meter-track><ui-meter-value></ui-meter-value></ui-meter></kind-context-meter-value></button></kind-context-meter-trigger><kind-context-meter-content hidden><kind-context-meter-title><h2>Context window</h2></kind-context-meter-title></kind-context-meter-content>`,
  ),
};
