import type { MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { ContextMeter } from "../../../../src/solid/context-meter.js";
import { context, contextHost, levels } from "../../shared/context-meter.js";
import { expose } from "../../shared/expose.js";
import { contextBreakdown as breakdown } from "../../shared/usage-meter.js";

const { host, record } = contextHost();

function Page(props: { used?: number; motion?: MotionMode; locale?: string; slices?: typeof breakdown }) {
  const [used, setUsed] = createSignal(props.used ?? context.used);
  onSettled(() => expose({ kindHost: { ...host, setUsed } }));
  return (
    <div class="flex flex-col items-start gap-4 p-6">
      <p id="above">Above</p>
      <div class="flex items-center gap-2">
        <ContextMeter
          id="context"
          {...context}
          used={used()}
          onOpenChange={record}
          motion={props.motion}
          locale={props.locale}
          breakdown={props.slices}
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
  breakdown: () => <Page slices={breakdown} />,
};
