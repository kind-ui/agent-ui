<script module lang="ts">
  export const variants = ["all", "reduced", "clock"];
</script>

<script lang="ts">
  import type { JobProgressOptions } from "@kind-ui/agent-ui/core";
  import { flushSync } from "svelte";
  import { JobProgress } from "../../../../src/svelte/job-progress/index.js";
  import { expose } from "../../shared/expose.js";
  import { clockJob, type JobHost, type JobId, jobHost, jobs, LOG } from "../../shared/job-progress.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, call } = jobHost();
  const onCancel = call("cancel");
  const onRetry = call("retry");
  const clock = clockJob();

  let patches: Partial<Record<JobId, Partial<JobProgressOptions>>> = $state.raw({});

  // Each call renders before it returns, so two calls in a row aren't batched into the second.
  const set: JobHost["set"] = (id, options) =>
    flushSync(() => (patches = { ...patches, [id]: { ...patches[id], ...options } }));
  expose({ kindHost: Object.assign(host, { set }) });
</script>

{#if variant === "clock"}<div class="w-[30rem] p-6"><JobProgress id="clock" {...clock} /></div
  >{:else}<div class="flex w-[30rem] flex-col gap-4 p-6"
    >{#each jobs as job (job.id)}<JobProgress
        id={job.id}
        {...job.options}
        {...patches[job.id]}
        motion={variant === "reduced" ? "reduced" : undefined}
        onCancel={job.cancel ? onCancel : undefined}
        onRetry={job.retry ? onRetry : undefined}
        >{#if job.log}<pre>{LOG.join("\n")}</pre>{/if}</JobProgress
      >{/each}</div
  >{/if}
