import type { CheckpointOptions } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/react/agent";
import { useEffect, useState } from "react";
import { Checkpoint } from "../../../../src/react/checkpoint.js";
import { checkpointHost } from "../../shared/checkpoint.js";

const { host, restore } = checkpointHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

function Checkpoints({ motion }: { motion?: CheckpointOptions["motion"] }) {
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    Object.assign(window, { kindHost: host, kindCheckpoint: { restore: setRestored } });
  }, []);
  return (
    <div className="flex w-[28rem] flex-col gap-4 p-6">
      <p id="above">Above</p>
      <Checkpoint
        id="checkpoint"
        description="Before editing auth.ts"
        onRestore={restore}
        restored={restored}
        motion={motion}
      />
      <p id="below">Below</p>
    </div>
  );
}

export const cases = { all: () => <Checkpoints />, reduced: () => <Checkpoints motion="reduced" /> };
