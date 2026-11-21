import { Plan } from "../components/ui/solid/plan.js";

export default function PlanItem() {
  return (
    <Plan
      label="Migration plan"
      items={[{ id: "audit", status: "complete", title: "Audit the current schema" }]}
      defaultOpen
    />
  );
}
