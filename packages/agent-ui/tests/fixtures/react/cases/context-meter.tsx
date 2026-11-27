import type { ContextMeterOptions, MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { ContextMeter } from "../../../../src/react/context-meter.js";
import { context, contextHost, levels, meterCases } from "../../shared/context-meter.js";

const { host, record, compact } = contextHost();

function Page({
  used: initial = context.used,
  motion,
  locale,
  extra,
}: {
  used?: number;
  motion?: MotionMode;
  locale?: string;
  extra?: ContextMeterOptions;
}) {
  const [used, setUsed] = useState(initial);
  useEffect(() => {
    Object.assign(window, { kindHost: { ...host, setUsed } });
  }, []);
  return (
    <div className={`flex flex-col items-start gap-4 p-6 ${extra?.layout === "inline" ? "w-[32rem]" : ""}`}>
      <p id="above">Above</p>
      <div className="flex items-center gap-2">
        <ContextMeter
          id="context"
          {...context}
          used={used}
          onOpenChange={record}
          motion={motion}
          locale={locale}
          onCompact={compact}
          {...extra}
        />
        <span id="beside">Beside</span>
      </div>
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  high: () => <Page used={levels.high} />,
  full: () => <Page used={levels.full} />,
  reduced: () => <Page motion="reduced" />,
  german: () => <Page locale="de-DE" />,
  breakdown: () => <Page extra={meterCases.breakdown} />,
  limits: () => <Page extra={meterCases.limits} />,
  "near-cap": () => <Page extra={meterCases["near-cap"]} />,
  compacting: () => <Page extra={meterCases.compacting} />,
  inline: () => <Page extra={meterCases.inline} />,
};
