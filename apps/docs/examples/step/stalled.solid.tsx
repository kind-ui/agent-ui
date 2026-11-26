import { Status } from "@/components/ui/solid/status";
import { Step, StepIcon, StepMeta, StepTitle, StepTrigger } from "@/components/ui/solid/step";
import { ThinkingIndicator } from "@/components/ui/solid/thinking-indicator";

export default function StepStalledExample() {
  // The last update arrived three minutes ago.
  const lastActivityAt = new Date(Date.now() - 3 * 60_000).toISOString();

  return (
    <div class="flex w-full max-w-md flex-col items-start gap-4">
      <Step status="running" lastActivityAt={lastActivityAt} class="w-full">
        <StepTrigger>
          <StepIcon />
          <StepTitle>Searching the docs</StepTitle>
          <StepMeta>3 min</StepMeta>
        </StepTrigger>
      </Step>
      <Status status="running" label="Deploying to staging" lastActivityAt={lastActivityAt} />
      <ThinkingIndicator lastActivityAt={lastActivityAt} />
    </div>
  );
}
