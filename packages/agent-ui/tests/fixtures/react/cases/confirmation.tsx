import type { Approval } from "@kind-ui/agent-ui";
import type { ConfirmationOptions } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/react/agent";
import { useEffect, useState } from "react";
import { Confirmation } from "../../../../src/react/confirmation.js";
import { confirmationHost, moreConfirmations, request } from "../../shared/confirmation.js";

const { host, approve, deny, always } = confirmationHost();
const more = moreConfirmations();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

function Confirmations({ motion }: { motion?: ConfirmationOptions["motion"] }) {
  const [approvals, setApprovals] = useState({ confirm: request("requested"), reason: request("requested") });
  useEffect(() => {
    Object.assign(window, {
      kindHost: host,
      kindApproval: {
        set: (next: Approval, id: "confirm" | "reason" = "confirm") =>
          setApprovals((all) => ({ ...all, [id]: next })),
      },
    });
  }, []);
  return (
    <div className="flex w-full max-w-[28rem] flex-col gap-4 p-6">
      <p id="above">Above</p>
      <Confirmation
        id="confirm"
        label="Run search_docs?"
        approval={approvals.confirm}
        onApprove={approve}
        onDeny={deny}
        motion={motion}
      />
      <p id="below">Below</p>
      <Confirmation
        id="reason"
        label="Delete notes.md?"
        approval={approvals.reason}
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
      {more.map(({ id, options }) => (
        <Confirmation
          key={id}
          id={id}
          {...options}
          onApprove={approve}
          onDeny={deny}
          onAlwaysAllow={options.alwaysTarget ? always : undefined}
          motion={motion}
        />
      ))}
    </div>
  );
}

export const cases = { all: () => <Confirmations />, reduced: () => <Confirmations motion="reduced" /> };
