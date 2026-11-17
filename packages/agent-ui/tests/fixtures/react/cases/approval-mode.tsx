import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { ApprovalMode } from "../../../../src/react/approval-mode.js";
import { approvalModeHost, initialValue, learnMoreHref, modes } from "../../shared/approval-mode.js";

const { host, change } = approvalModeHost();

function Page({
  motion,
  refusing,
  agentConfirm,
}: {
  motion?: MotionMode;
  refusing?: boolean;
  agentConfirm?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="p-6">
      <ApprovalMode
        id="approvals"
        modes={modes}
        value={value}
        learnMoreHref={learnMoreHref}
        onValueChange={(next, details) => {
          change(next, details);
          if (refusing) details.cancel();
          else setValue(next);
        }}
        motion={motion}
        agentConfirm={agentConfirm}
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  refusing: () => <Page refusing />,
  unconfirmed: () => <Page agentConfirm={false} />,
};
