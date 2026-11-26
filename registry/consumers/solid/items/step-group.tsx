import { StepGroup } from "../components/ui/solid/step-group.js";

export default function StepGroupItem() {
  return (
    <StepGroup label="Read 2 files" status="complete" defaultOpen>
      <p>Read two files.</p>
    </StepGroup>
  );
}
