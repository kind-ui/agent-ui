"use client";
import type { Approval } from "@kind-ui/agent-ui";
import { useState } from "react";
import { Confirmation } from "@/components/ui/confirmation";

export default function ConfirmationExample() {
  const [approval, setApproval] = useState<Approval>({
    approvalId: "delete",
    generation: 1,
    state: "requested",
  });
  const record = (approved: boolean, reason?: string) =>
    setApproval({ ...approval, state: "responded", decision: { approved, ...(reason && { reason }) } });
  return (
    <Confirmation
      label="Delete notes.md?"
      approval={approval}
      reason
      onApprove={() => record(true)}
      onDeny={({ reason }) => record(false, reason)}
    />
  );
}
