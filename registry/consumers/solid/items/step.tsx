import { Step, StepContent, StepIcon, StepTitle, StepTrigger } from "../components/ui/solid/step.js";

export default function StepItem() {
  return (
    <Step status="complete">
      <StepTrigger>
        <StepIcon />
        <StepTitle>Read the logs</StepTitle>
      </StepTrigger>
      <StepContent>
        <p>Three timeouts.</p>
      </StepContent>
    </Step>
  );
}
