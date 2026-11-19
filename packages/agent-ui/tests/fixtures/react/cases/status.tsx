import type { StepStatus } from "@kind-ui/agent-ui";
import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Status, StatusIcon, StatusLabel } from "../../../../src/react/status.js";

const statuses: StepStatus[] = ["pending", "running", "awaiting-input", "complete", "error", "cancelled"];

function Live() {
  const [status, setStatus] = useState<StepStatus>("running");
  const [label, setLabel] = useState<string>();
  const [motion, setMotion] = useState<MotionMode>("auto");
  useEffect(() => {
    Object.assign(window, { kindStatus: { setStatus, setLabel, setMotion } });
  }, []);
  return <Status id="live" status={status} label={label} motion={motion} />;
}

export const cases = {
  all: () => (
    <div className="flex flex-col items-start gap-3 bg-[var(--kind-color-surface)] p-6">
      {statuses.map((status) => (
        <Status key={status} status={status} />
      ))}
      <Live />
      <Status id="composed" status="complete">
        <StatusLabel>{({ label }) => `Build ${label.toLowerCase()}`}</StatusLabel>
        <StatusIcon />
      </Status>
    </div>
  ),
};
