import { JobProgress } from "../components/ui/solid/job-progress.js";

export default function JobProgressItem() {
  return (
    <JobProgress label="Build docs" status="running" value={0.42} stage="Installing dependencies" defaultOpen>
      <pre>$ npm ci</pre>
    </JobProgress>
  );
}
