"use client";
import type { Approval } from "@kind-ui/agent-ui";
import { useState } from "react";
import { Confirmation } from "@/components/ui/confirmation";

export default function ConfirmationAlwaysExample() {
  const [approval, setApproval] = useState<Approval>({
    approvalId: "search",
    generation: 1,
    state: "requested",
  });
  const record = (decision: Approval["decision"]) =>
    setApproval({ ...approval, state: "responded", decision });
  return (
    <Confirmation
      label="Allow `search_docs`?"
      approval={approval}
      alwaysTarget="search_docs"
      alwaysScope="in this project"
      alwaysDetail="Covers `search_docs` in this project. You can change it in Settings."
      onDeny={() => record({ approved: false })}
      onAlwaysAllow={({ scope }) => record({ approved: true, always: true, ...(scope && { scope }) })}
      onApprove={() => record({ approved: true })}
    />
  );
}
