import type { StepStatus } from "@kind-ui/agent-ui";
import type { MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, For, onSettled } from "solid-js";
import { Status, StatusIcon, StatusLabel } from "../../../../src/solid/status.js";
import { expose } from "../../shared/expose.js";

const statuses: StepStatus[] = ["pending", "running", "awaiting-input", "complete", "error", "cancelled"];

function Live() {
  const [status, setStatus] = createSignal<StepStatus>("running");
  const [label, setLabel] = createSignal<string>();
  const [motion, setMotion] = createSignal<MotionMode>("auto");
  onSettled(() => expose({ kindStatus: { setStatus, setLabel, setMotion } }));
  return <Status id="live" status={status()} label={label()} motion={motion()} />;
}

export const cases = {
  all: () => (
    <div class="flex flex-col items-start gap-3 bg-[var(--kind-color-surface)] p-6">
      <For each={statuses}>{(status) => <Status status={status} />}</For>
      <Live />
      <Status id="composed" status="complete">
        <StatusLabel>{(state) => `Build ${state.label.toLowerCase()}`}</StatusLabel>
        <StatusIcon />
      </Status>
    </div>
  ),
};
