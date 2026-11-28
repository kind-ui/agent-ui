import type { ContextMeterOptions, MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { ContextMeter } from "../../../../src/solid/context-meter.js";
import { context, contextHost, levels, meterCases } from "../../shared/context-meter.js";
import { expose } from "../../shared/expose.js";

const { host, record, compact } = contextHost();

function Page(props: { used?: number; motion?: MotionMode; locale?: string; extra?: ContextMeterOptions }) {
  const [used, setUsed] = createSignal(props.used ?? context.used);
  onSettled(() => expose({ kindHost: { ...host, setUsed } }));
  return (
    <div class={`flex flex-col items-start gap-4 p-6 ${props.extra?.layout === "inline" ? "w-[32rem]" : ""}`}>
      <p id="above">Above</p>
      <div class="flex items-center gap-2">
        <ContextMeter
          id="context"
          {...context}
          used={used()}
          onOpenChange={record}
          motion={props.motion}
          locale={props.locale}
          {...(props.extra ? { onCompact: compact, ...props.extra } : {})}
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
