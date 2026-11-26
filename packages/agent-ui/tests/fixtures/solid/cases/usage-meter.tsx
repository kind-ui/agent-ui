import type { MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { UsageMeter, type UsageMeterProps } from "../../../../src/solid/usage-meter.js";
import { expose } from "../../shared/expose.js";
import { levels, requests, reset, usage, usageHost } from "../../shared/usage-meter.js";

const { host, record } = usageHost();

function Page(props: { used?: number; motion?: MotionMode; extra?: Partial<UsageMeterProps> }) {
  const [used, setUsed] = createSignal(props.used ?? usage.used);
  onSettled(() => expose({ kindHost: { ...host, setUsed } }));
  return (
    <div class="flex flex-col items-start gap-4 p-6">
      <p id="above">Above</p>
      <div class="flex items-center gap-2">
        <UsageMeter
          id="usage"
          {...usage}
          used={used()}
          onOpenChange={record}
          motion={props.motion}
          {...props.extra}
        />
        <span id="beside">Beside</span>
      </div>
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  warning: () => <Page used={levels.warning} />,
  error: () => <Page used={levels.error} />,
  reduced: () => <Page motion="reduced" />,
  requests: () => <Page used={requests.used} extra={{ ...requests, breakdown: undefined }} />,
  reset: () => <Page extra={{ resetAt: reset.resetAt }} />,
};
