import type { JobProgressOptions, MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { JobProgress } from "../../../../src/react/job-progress.js";
import { clockJob, type JobHost, type JobId, jobHost, jobs, LOG } from "../../shared/job-progress.js";

const { host, call } = jobHost();
const onCancel = call("cancel");
const onRetry = call("retry");

function Page({ motion }: { motion?: MotionMode }) {
  const [patches, setPatches] = useState<Partial<Record<JobId, Partial<JobProgressOptions>>>>({});
  useEffect(() => {
    // Each call renders before it returns, so two calls in a row aren't batched into the second.
    const set: JobHost["set"] = (id, options) =>
      flushSync(() => setPatches((all) => ({ ...all, [id]: { ...all[id], ...options } })));
    Object.assign(window, { kindHost: Object.assign(host, { set }) });
  }, []);
  return (
    <div className="flex w-[30rem] flex-col gap-4 p-6">
      {jobs.map((job) => (
        <JobProgress
          key={job.id}
          id={job.id}
          {...job.options}
          {...patches[job.id]}
          motion={motion}
          onCancel={job.cancel ? onCancel : undefined}
          onRetry={job.retry ? onRetry : undefined}
        >
          {job.log ? <pre>{LOG.join("\n")}</pre> : undefined}
        </JobProgress>
      ))}
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  clock: () => (
    <div className="w-[30rem] p-6">
      <JobProgress id="clock" {...clockJob()} />
    </div>
  ),
};
