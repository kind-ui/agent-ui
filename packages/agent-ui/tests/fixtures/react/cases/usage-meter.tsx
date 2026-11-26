import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { UsageMeter } from "../../../../src/react/usage-meter.js";
import { levels, requests, reset, usage, usageHost } from "../../shared/usage-meter.js";

const { host, record } = usageHost();

function Page({
  used: initial = usage.used,
  motion,
  extra,
}: {
  used?: number;
  motion?: MotionMode;
  extra?: Partial<Parameters<typeof UsageMeter>[0]>;
}) {
  const [used, setUsed] = useState(initial);
  useEffect(() => {
    Object.assign(window, { kindHost: { ...host, setUsed } });
  }, []);
  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <p id="above">Above</p>
      <div className="flex items-center gap-2">
        <UsageMeter id="usage" {...usage} used={used} onOpenChange={record} motion={motion} {...extra} />
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
