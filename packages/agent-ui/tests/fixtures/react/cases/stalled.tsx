import { useEffect, useState } from "react";
import { Status } from "../../../../src/react/status.js";
import { Step, StepContent, StepIcon, StepMeta, StepTitle, StepTrigger } from "../../../../src/react/step.js";
import { ThinkingIndicator } from "../../../../src/react/thinking-indicator.js";
import { stalled } from "../../shared/stalled.js";

type Rows = Record<keyof typeof stalled, string>;

function Stalled() {
  const [activity, setActivity] = useState<Rows>({
    running: stalled.running.lastActivityAt,
    stalled: stalled.stalled.lastActivityAt,
    status: stalled.status.lastActivityAt,
    indicator: stalled.indicator.lastActivityAt,
  });
  useEffect(() => {
    Object.assign(window, {
      kindStalled: {
        touch: (id: keyof Rows) => setActivity((rows) => ({ ...rows, [id]: new Date().toISOString() })),
      },
    });
  }, []);
  const step = (id: "running" | "stalled") => (
    <Step id={id} status="running" autoOpen="never" lastActivityAt={activity[id]}>
      <StepTrigger>
        <StepIcon />
        <StepTitle>{stalled[id].title}</StepTitle>
        <StepMeta>{stalled[id].meta}</StepMeta>
      </StepTrigger>
      <StepContent>
        <p>Reading the API reference.</p>
      </StepContent>
    </Step>
  );
  return (
    <div className="flex w-[28rem] flex-col items-start gap-6 p-6">
      <div className="w-full">{step("running")}</div>
      <div className="w-full">{step("stalled")}</div>
      <ThinkingIndicator id="indicator" lastActivityAt={activity.indicator} />
      <Status id="status" status="running" label={stalled.status.label} lastActivityAt={activity.status} />
    </div>
  );
}

export const cases = { all: () => <Stalled /> };
