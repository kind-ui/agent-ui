import type { JobProgressOptions, MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, For, flush, onSettled } from "solid-js";
import { JobProgress } from "../../../../src/solid/job-progress.js";
import { expose } from "../../shared/expose.js";
import {
  clockJob,
  type JobFixture,
  type JobHost,
  type JobId,
  jobHost,
  jobs,
  LOG,
} from "../../shared/job-progress.js";

const { host, call } = jobHost();
const onCancel = call("cancel");
const onRetry = call("retry");

type Patches = Partial<Record<JobId, Partial<JobProgressOptions>>>;

// Each option by name, since a spread of a changing object would build the default parts again.
function Job(props: {
  job: JobFixture;
  patch: Partial<JobProgressOptions> | undefined;
  motion?: MotionMode;
}) {
  const o = () => ({ ...props.job.options, ...props.patch });
  return (
    <JobProgress
      id={props.job.id}
      label={o().label}
      status={o().status}
      value={o().value}
      stage={o().stage}
      stageIndex={o().stageIndex}
      stageCount={o().stageCount}
      startedAt={o().startedAt}
      etaSeconds={o().etaSeconds}
      now={o().now}
      durationSeconds={o().durationSeconds}
      motion={props.motion}
      onCancel={props.job.cancel ? onCancel : undefined}
      onRetry={props.job.retry ? onRetry : undefined}
    >
      {props.job.log ? <pre>{LOG.join("\n")}</pre> : undefined}
    </JobProgress>
  );
}

function Page(props: { motion?: MotionMode }) {
  const [patches, setPatches] = createSignal<Patches>({});
  onSettled(() => {
    // Each call renders before it returns, so two calls in a row aren't batched into the second.
    const set: JobHost["set"] = (id, options) => {
      setPatches((all) => ({ ...all, [id]: { ...all[id], ...options } }));
      flush();
    };
    expose({ kindHost: Object.assign(host, { set }) });
  });
  return (
    <div class="flex w-[30rem] flex-col gap-4 p-6">
      <For each={jobs}>{(job) => <Job job={job} patch={patches()[job.id]} motion={props.motion} />}</For>
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  clock: () => (
    <div class="w-[30rem] p-6">
      <JobProgress id="clock" {...clockJob()} />
    </div>
  ),
};
