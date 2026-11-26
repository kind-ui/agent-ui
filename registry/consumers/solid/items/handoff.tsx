import { Handoff } from "../components/ui/solid/handoff.js";

export default function HandoffItem() {
  return (
    <Handoff
      from={{ id: "support", name: "Support" }}
      to={{ kind: "person", name: "Dana" }}
      reason="Refunds need a person"
      status="accepted"
    />
  );
}
