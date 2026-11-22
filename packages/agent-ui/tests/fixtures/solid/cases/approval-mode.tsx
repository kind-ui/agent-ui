import type { MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { ApprovalMode } from "../../../../src/solid/approval-mode.js";
import { approvalModeHost, initialValue, learnMoreHref, modes } from "../../shared/approval-mode.js";
import { expose } from "../../shared/expose.js";

const { host, change, learn } = approvalModeHost();

function Page(props: {
  motion?: MotionMode;
  refusing?: boolean;
  agentConfirm?: boolean;
  learning?: boolean;
}) {
  const [value, setValue] = createSignal(initialValue);
  onSettled(() => expose({ kindHost: host }));
  return (
    <div class="p-6">
      <ApprovalMode
        modes={modes}
        value={value()}
        {...(props.learning ? { onLearnMore: learn } : { learnMoreHref })}
        onValueChange={(next, details) => {
          change(next, details);
          if (props.refusing) details.cancel();
          else setValue(next);
        }}
        motion={props.motion}
        agentConfirm={props.agentConfirm}
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
