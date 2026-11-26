<script module lang="ts">
  export const variants = ["all"];
</script>

<script lang="ts">
  import { Status } from "../../../../src/svelte/status/index.js";
  import {
    Step,
    StepContent,
    StepIcon,
    StepMeta,
    StepTitle,
    StepTrigger,
  } from "../../../../src/svelte/step/index.js";
  import { ThinkingIndicator } from "../../../../src/svelte/thinking-indicator/index.js";
  import { expose } from "../../shared/expose.js";
  import { stalled } from "../../shared/stalled.js";

  type Rows = Record<keyof typeof stalled, string>;

  let activity: Rows = $state.raw({
    running: stalled.running.lastActivityAt,
    stalled: stalled.stalled.lastActivityAt,
    status: stalled.status.lastActivityAt,
    indicator: stalled.indicator.lastActivityAt,
  });
  expose({
    kindStalled: {
      touch: (id: keyof Rows) => (activity = { ...activity, [id]: new Date().toISOString() }),
    },
  });
</script>

{#snippet step(id: "running" | "stalled")}
  <Step {id} status="running" autoOpen="never" lastActivityAt={activity[id]}>
    <StepTrigger>
      <StepIcon
      /><StepTitle>{stalled[id].title}</StepTitle
      ><StepMeta>{stalled[id].meta}</StepMeta>
    </StepTrigger
    ><StepContent>
      <p>Reading the API reference.</p>
    </StepContent>
  </Step>
{/snippet}

<div class="flex w-[28rem] flex-col items-start gap-6 p-6">
  <div class="w-full">{@render step("running")}</div
  ><div class="w-full">{@render step("stalled")}</div
  ><ThinkingIndicator id="indicator" lastActivityAt={activity.indicator}
  /><Status id="status" status="running" label={stalled.status.label} lastActivityAt={activity.status} />
</div>
