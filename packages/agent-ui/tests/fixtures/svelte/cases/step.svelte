<script module lang="ts">
  export const variants = ["list", "reduced", "none"];
</script>

<script lang="ts">
  import type { StepStatus } from "@kind-ui/agent-ui";
  import {
    Step,
    StepChildren,
    StepContent,
    StepIcon,
    StepList,
    StepListItem,
    StepMeta,
    StepTitle,
    StepTrigger,
  } from "../../../../src/svelte/step/index.js";
  import { expose } from "../../shared/expose.js";

  type Row = { id: string; title: string; status: StepStatus; meta?: string; body: string; duration?: number };

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  let rows: Row[] = $state.raw([
    {
      id: "plan",
      title: "Plan the answer",
      status: "complete",
      meta: "2s",
      body: "Split the question into three lookups.",
    },
    {
      id: "search",
      title: "Search the web",
      status: "running",
      meta: "3s",
      duration: 3,
      body: "Querying three sources for recent releases.",
    },
    { id: "approve", title: "Run deploy script", status: "awaiting-input", body: "Waiting for approval." },
    { id: "fetch", title: "Fetch changelog", status: "error", meta: "1s", body: "Request failed with 503." },
    { id: "draft", title: "Draft the summary", status: "pending", body: "Collapsed text: kumquat." },
    { id: "old", title: "Old attempt", status: "cancelled", body: "Stopped by the user." },
  ]);
  let status: StepStatus = $state("pending");

  expose({
    kindSteps: {
      setStatus: (id: string, next: StepStatus) =>
        (rows = rows.map((row) => (row.id === id ? { ...row, status: next } : row))),
      remove: (id: string) => (rows = rows.filter((row) => row.id !== id)),
    },
    kindStep: { setStatus: (next: StepStatus) => (status = next) },
  });
</script>

{#if variant === "list"}
  <StepList aria-label="Agent steps" class="w-96 p-4">
    {#each rows as row (row.id)}
      <Step status={row.status} durationSeconds={row.duration} kind="tool">
        <StepListItem value={row.id}>
          {#snippet render({ props }: { props: Record<string, unknown> })}
            <StepTrigger {...props}>
              <StepIcon
              /><StepTitle>{row.title}</StepTitle
              >{#if row.meta}<StepMeta>{row.meta}</StepMeta>{/if}
            </StepTrigger>
          {/snippet}
        </StepListItem
        ><StepContent>
          <p>{row.body}</p>
        </StepContent
        ><StepChildren />
      </Step>
    {/each}
  </StepList>
{:else}
  <Step motion={variant === "reduced" ? "reduced" : "none"} {status}>
    <StepTrigger>
      <StepIcon
      /><StepTitle>{variant === "reduced" ? "Reduced" : "Instant"}</StepTitle>
    </StepTrigger
    ><StepContent>
      <p>Step details.</p>
    </StepContent>
  </Step>
{/if}
