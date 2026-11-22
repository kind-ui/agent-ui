import type { StepStatus } from "@kind-ui/agent-ui";
import { createSignal, For, onSettled, Show } from "solid-js";
import {
  Step,
  StepChildren,
  StepContent,
  StepIcon,
  StepList,
  StepListItem,
  StepMeta,
  StepTitle,
  StepTrigger,
} from "../../../../src/solid/step.js";
import { expose } from "../../shared/expose.js";

type Row = { id: string; title: string; status: StepStatus; meta?: string; body: string; duration?: number };

const initial: Row[] = [
  {
    id: "plan",
    title: "Plan the answer",
    status: "complete",
    meta: "2s",
    body: "Split the question into three lookups.",
  },
  {
    id: "search",
    title: "Search the web",
    status: "running",
    meta: "3s",
    duration: 3,
    body: "Querying three sources for recent releases.",
  },
  { id: "approve", title: "Run deploy script", status: "awaiting-input", body: "Waiting for approval." },
  { id: "fetch", title: "Fetch changelog", status: "error", meta: "1s", body: "Request failed with 503." },
  { id: "draft", title: "Draft the summary", status: "pending", body: "Collapsed text: kumquat." },
  { id: "old", title: "Old attempt", status: "cancelled", body: "Stopped by the user." },
];

function Steps() {
  const [rows, setRows] = createSignal(initial);
  onSettled(() =>
    expose({
      kindSteps: {
        setStatus: (id: string, status: StepStatus) =>
          setRows((all) => all.map((row) => (row.id === id ? { ...row, status } : row))),
        remove: (id: string) => setRows((all) => all.filter((row) => row.id !== id)),
      },
    }),
  );
  return (
    <StepList aria-label="Agent steps" class="w-96 p-4">
      <For each={rows()} keyed={(row) => row.id}>
        {(row) => (
          <Step status={row().status} durationSeconds={row().duration} kind="tool">
            <StepListItem value={row().id} render={StepTrigger}>
              <StepIcon />
              <StepTitle>{row().title}</StepTitle>
              <Show when={row().meta}>
                <StepMeta>{row().meta}</StepMeta>
              </Show>
            </StepListItem>
            <StepContent>
              <p>{row().body}</p>
            </StepContent>
            <StepChildren />
          </Step>
        )}
      </For>
    </StepList>
  );
}

function Single(props: { motion: "reduced" | "none"; title: string }) {
  const [status, setStatus] = createSignal<StepStatus>("pending");
  onSettled(() => expose({ kindStep: { setStatus } }));
  return (
    <Step motion={props.motion} status={status()}>
      <StepTrigger>
        <StepIcon />
        <StepTitle>{props.title}</StepTitle>
      </StepTrigger>
      <StepContent>
        <p>Step details.</p>
      </StepContent>
    </Step>
  );
}

export const cases = {
  list: () => <Steps />,
  reduced: () => <Single motion="reduced" title="Reduced" />,
  none: () => <Single motion="none" title="Instant" />,
};
