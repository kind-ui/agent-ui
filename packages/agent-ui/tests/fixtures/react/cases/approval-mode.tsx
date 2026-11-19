import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { ApprovalMode } from "../../../../src/react/approval-mode.js";
import { approvalModeHost, initialValue, learnMoreHref, modes } from "../../shared/approval-mode.js";

const { host, change, learn } = approvalModeHost();

function Page({
  motion,
  refusing,
  agentConfirm,
  learning,
}: {
  motion?: MotionMode;
  refusing?: boolean;
  agentConfirm?: boolean;
  learning?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="p-6">
      <ApprovalMode
        modes={modes}
        value={value}
        {...(learning ? { onLearnMore: learn } : { learnMoreHref })}
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
  learning: () => <Page learning />,
};
