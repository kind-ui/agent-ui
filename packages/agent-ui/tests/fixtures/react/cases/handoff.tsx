import type { HandoffOptions } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Handoff } from "../../../../src/react/handoff.js";
import { confirmationHost } from "../../shared/confirmation.js";
import { handoffs } from "../../shared/handoff.js";

function Handoffs() {
  const [{ host, approve, deny, always }] = useState(confirmationHost);
  const [rows, setRows] = useState(handoffs);
  useEffect(() => {
    Object.assign(window, {
      kindHost: host,
      kindHandoff: {
        set: (id: string, next: Partial<HandoffOptions>) =>
          setRows((all) => ({ ...all, [id]: { ...all[id], ...next } })),
      },
    });
  }, [host]);
  return (
    <div className="flex w-[34rem] flex-col gap-3 p-6">
      {Object.entries(rows).map(([id, { approve: decides, ...row }]) => (
        <Handoff
          key={id}
          id={id}
          {...row}
          {...(decides && { onApprove: approve, onDeny: deny, onAlwaysAllow: always })}
        />
      ))}
    </div>
  );
}

export const cases = {
  all: () => <Handoffs />,
};
