import type { Approval } from "@kind-ui/agent-ui";
import type { ConfirmationOptions } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/solid/agent";
import { createSignal, onSettled } from "solid-js";
import { Confirmation } from "../../../../src/solid/confirmation.js";
import { confirmationHost, request } from "../../shared/confirmation.js";
import { expose } from "../../shared/expose.js";

const { host, approve, deny } = confirmationHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

function Confirmations(props: { motion?: ConfirmationOptions["motion"] }) {
  const [approvals, setApprovals] = createSignal({
    confirm: request("requested"),
    reason: request("requested"),
  });
  onSettled(() =>
    expose({
      kindHost: host,
      kindApproval: {
        set: (next: Approval, id: "confirm" | "reason" = "confirm") =>
          setApprovals((all) => ({ ...all, [id]: next })),
      },
    }),
  );
  return (
    <div class="flex w-[28rem] flex-col gap-4 p-6">
      <p id="above">Above</p>
      <Confirmation
        id="confirm"
        label="Run search_docs?"
        approval={approvals().confirm}
        onApprove={approve}
        onDeny={deny}
        motion={props.motion}
      />
      <p id="below">Below</p>
      <Confirmation
        id="reason"
        label="Delete notes.md?"
        approval={approvals().reason}
        onApprove={approve}
        onDeny={deny}
        reason
      />
      <Confirmation
        id="approve-only"
        label="Open the link?"
        approval={request("requested")}
        onApprove={approve}
      />
      <Confirmation
        id="auto"
        label="Read README.md?"
        approval={request("auto", 1, { approved: true })}
        onApprove={approve}
        onDeny={deny}
      />
    </div>
  );
}

export const cases = { all: () => <Confirmations />, reduced: () => <Confirmations motion="reduced" /> };
