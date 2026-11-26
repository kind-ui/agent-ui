import { JobProgress } from "@/components/ui/job-progress";

export default function JobProgressExample() {
  return (
    <JobProgress
      label="Build docs"
      status="running"
      value={0.42}
      stage="Installing dependencies"
      stageIndex={2}
      stageCount={7}
      startedAt="2026-11-25T12:00:00Z"
      now="2026-11-25T12:02:00Z"
      etaSeconds={60}
      defaultOpen={false}
    >
      <pre>{"$ npm ci\nadded 491 packages in 40s"}</pre>
    </JobProgress>
  );
}
