import type { CheckpointOptions } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/react/agent";
import { useEffect, useState } from "react";
import { Checkpoint } from "../../../../src/react/checkpoint.js";
import { checkpointHost, SCOPED } from "../../shared/checkpoint.js";

const { host, restore, compare } = checkpointHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

function Checkpoints({ motion, scoped }: { motion?: CheckpointOptions["motion"]; scoped?: boolean }) {
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
        {...(scoped && { ...SCOPED, onCompare: compare })}
      />
      <p id="below">Below</p>
    </div>
  );
}

export const cases = {
  all: () => <Checkpoints />,
  reduced: () => <Checkpoints motion="reduced" />,
  scoped: () => <Checkpoints scoped />,
};
