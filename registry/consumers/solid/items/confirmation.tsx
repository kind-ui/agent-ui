import { Confirmation } from "../components/ui/solid/confirmation.js";

export default function ConfirmationItem() {
  return (
    <Confirmation
      label="Run search_docs?"
      approval={{ approvalId: "a1", generation: 1, state: "requested" }}
      onApprove={() => {}}
      onDeny={() => {}}
      reason
    />
  );
}
