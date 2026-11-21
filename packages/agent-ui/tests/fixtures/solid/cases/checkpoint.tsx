import type { CheckpointOptions } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/solid/agent";
import { createSignal, onSettled } from "solid-js";
import { Checkpoint } from "../../../../src/solid/checkpoint.js";
import { checkpointHost } from "../../shared/checkpoint.js";
import { expose } from "../../shared/expose.js";

const { host, restore } = checkpointHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

function Checkpoints(props: { motion?: CheckpointOptions["motion"] }) {
  const [restored, setRestored] = createSignal(false);
  onSettled(() =>
    expose({ kindHost: host, kindCheckpoint: { restore: (next: boolean) => setRestored(next) } }),
  );
  return (
    <div class="flex w-[28rem] flex-col gap-4 p-6">
      <p id="above">Above</p>
      <Checkpoint
        id="checkpoint"
        description="Before editing auth.ts"
        onRestore={restore}
        restored={restored()}
        motion={props.motion}
      />
      <p id="below">Below</p>
    </div>
  );
}

export const cases = { all: () => <Checkpoints />, reduced: () => <Checkpoints motion="reduced" /> };
