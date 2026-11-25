import type { MotionMode } from "@kind-ui/agent-ui/core";
import { type CSSProperties, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Trace } from "../../../../src/react/trace.js";
import { expose } from "../../shared/expose.js";
import { manySpans, runningSpans, spans, type TraceLog } from "../../shared/trace.js";

const log: TraceLog = { values: [], expanded: [] };

function Page({ motion, refuse, running }: { motion?: MotionMode; refuse?: boolean; running?: boolean }) {
  const [now, setNow] = useState(4000);
  useEffect(() => expose({ kindLog: log, kindHost: { tick: (ms: number) => setNow(ms) } }), []);
  return (
    <div className="w-[44rem] max-w-full p-6">
      <Trace
        id="trace"
        label="Agent run"
        spans={running ? runningSpans : spans}
        {...(running && { now })}
        motion={motion}
        defaultExpanded={["run"]}
        onValueChange={(value, details) => {
          log.values.push(`${value} ${details.reason}`);
          if (refuse) details.cancel();
        }}
        onExpandedChange={(expanded, details) => {
          log.expanded.push(`${expanded.join(",")} ${details.reason}`);
          if (refuse) details.cancel();
        }}
      />
    </div>
  );
}

// A fixed 400px column with a 600px viewport and 28px rows, so the same rows are in view at 50 spans as at 5,000.
function Many({ count }: { count: number }) {
  const [{ spans: many, expanded: initial }] = useState(() => manySpans(count));
  const [value, setValue] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(initial);
  useEffect(
    () =>
      expose({
        kindTrace: {
          select: (id: string | null) => flushSync(() => setValue(id)),
          toggle: (id: string) =>
            flushSync(() =>
              setExpanded((open) => (open.includes(id) ? open.filter((other) => other !== id) : [...open, id])),
            ),
        },
      }),
    [],
  );
  return (
    <div className="w-[400px]" style={{ "--kind-trace-height": "600px" } as CSSProperties}>
      <Trace
        spans={many}
        value={value}
        onValueChange={setValue}
        expanded={expanded}
        onExpandedChange={setExpanded}
        motion="none"
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  running: () => <Page running />,
  reduced: () => <Page motion="reduced" />,
  refused: () => <Page refuse />,
  "many-50": () => <Many count={50} />,
  "many-5000": () => <Many count={5000} />,
};
