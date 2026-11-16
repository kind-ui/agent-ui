import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { ContextMeter } from "../../../../src/react/context-meter.js";
import { context, contextHost, levels } from "../../shared/context-meter.js";

const { host, record } = contextHost();

function Page({
  used: initial = context.used,
  motion,
  locale,
}: {
  used?: number;
  motion?: MotionMode;
  locale?: string;
}) {
  const [used, setUsed] = useState(initial);
  useEffect(() => {
    Object.assign(window, { kindHost: { ...host, setUsed } });
  }, []);
  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <p id="above">Above</p>
      <div className="flex items-center gap-2">
        <ContextMeter
          id="context"
          {...context}
          used={used}
          onOpenChange={record}
          motion={motion}
          locale={locale}
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
};
