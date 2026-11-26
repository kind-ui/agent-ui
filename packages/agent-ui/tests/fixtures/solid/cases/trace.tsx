import type { MotionMode } from "@kind-ui/agent-ui/core";
import type { JSX } from "@solidjs/web";
import { createSignal, flush, onSettled } from "solid-js";
import { Trace } from "../../../../src/solid/trace.js";
import { expose } from "../../shared/expose.js";
import { manySpans, runningSpans, spans, type TraceLog } from "../../shared/trace.js";

const log: TraceLog = { values: [], expanded: [] };

function Page(props: { motion?: MotionMode; refuse?: boolean; running?: boolean }) {
  const [now, setNow] = createSignal(4000);
  onSettled(() => expose({ kindLog: log, kindHost: { tick: (ms: number) => void setNow(ms) } }));
  return (
    <div class="w-[44rem] max-w-full p-6">
      <Trace
        id="trace"
        label="Agent run"
        spans={props.running ? runningSpans : spans}
        now={props.running ? now() : undefined}
        motion={props.motion}
        defaultExpanded={["run"]}
        onValueChange={(value, details) => {
          log.values.push(`${value} ${details.reason}`);
          if (props.refuse) details.cancel();
        }}
        onExpandedChange={(expanded, details) => {
          log.expanded.push(`${expanded.join(",")} ${details.reason}`);
          if (props.refuse) details.cancel();
        }}
      />
    </div>
  );
}

// A fixed 400px column with a 600px viewport and 28px rows, so the same rows are in view at 50 spans as at 5,000.
function Many(props: { count: number }) {
  const { spans: many, expanded: initial } = manySpans(props.count);
  const [value, setValue] = createSignal<string | null>(null);
  const [expanded, setExpanded] = createSignal(initial);
  onSettled(() =>
    expose({
      kindTrace: {
        select: (id: string | null) => {
          setValue(id);
          flush();
        },
        toggle: (id: string) => {
          setExpanded((open) => (open.includes(id) ? open.filter((other) => other !== id) : [...open, id]));
          flush();
        },
      },
    }),
  );
  return (
    <div class="w-[400px]" style={{ "--kind-trace-height": "600px" } as JSX.CSSProperties}>
      <Trace
        spans={many}
        value={value()}
        onValueChange={(next) => void setValue(next)}
        expanded={expanded()}
        onExpandedChange={(next) => void setExpanded(next)}
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
