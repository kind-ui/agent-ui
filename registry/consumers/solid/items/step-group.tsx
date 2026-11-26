import { StepGroup } from "../components/ui/solid/step-group.js";

export default function StepGroupItem() {
  return (
    <StepGroup
      label="Read 3 files"
      items={[
        { id: "a", status: "complete" },
        { id: "b", status: "complete" },
        { id: "c", status: "complete" },
      ]}
      defaultOpen
    >
      <p>Read three files.</p>
    </StepGroup>
  );
}
