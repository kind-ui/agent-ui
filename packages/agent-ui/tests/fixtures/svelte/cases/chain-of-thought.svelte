<script module lang="ts">
  export const variants = ["all", "reduced"];
</script>

<script lang="ts">
  import type { ChainOfThoughtStep } from "@kind-ui/agent-ui/core";
  import {
    ChainOfThought,
    ChainOfThoughtContent,
    ChainOfThoughtIcon,
    ChainOfThoughtItem,
    ChainOfThoughtItemContent,
    ChainOfThoughtItemTrigger,
    ChainOfThoughtList,
    ChainOfThoughtMeta,
    ChainOfThoughtTitle,
    ChainOfThoughtTrigger,
  } from "../../../../src/svelte/chain-of-thought/index.js";
  import { expose } from "../../shared/expose.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const initial: ChainOfThoughtStep[] = [
    { id: "plan", status: "complete", title: "Plan the search", durationSeconds: 2 },
    { id: "search", status: "running", title: "Search flights" },
    { id: "compare", status: "pending", title: "Compare fares" },
  ];

  const openStepsChanges: [string[], string][] = [];
  let steps: ChainOfThoughtStep[] = $state.raw(initial);

  expose({
    kindOpenStepsChanges: openStepsChanges,
    kindChain: {
      setStatus: (id: string, status: ChainOfThoughtStep["status"]) =>
        (steps = steps.map((step) => (step.id === id ? { ...step, status } : step))),
      setStatuses: (statuses: Record<string, ChainOfThoughtStep["status"]>) =>
        (steps = steps.map((step) => ({ ...step, status: statuses[step.id] ?? step.status }))),
      append: (step: ChainOfThoughtStep) => (steps = [...steps, step]),
      remove: (id: string) => (steps = steps.filter((step) => step.id !== id)),
    },
  });
</script>

<div class="flex w-[28rem] flex-col gap-4 p-6"
  ><ChainOfThought
    id="chain"
    label="Researching flights"
    status="running"
    durationSeconds={12}
    {steps}
    motion={variant === "reduced" ? "reduced" : undefined}
    onOpenStepsChange={(openSteps, details) => openStepsChanges.push([openSteps, details.reason])}
    ><ChainOfThoughtTrigger
      ><ChainOfThoughtIcon
      /><ChainOfThoughtTitle
      /><ChainOfThoughtMeta
    /></ChainOfThoughtTrigger
    ><ChainOfThoughtContent
      ><ChainOfThoughtList
        >{#each steps as step (step.id)}<ChainOfThoughtItem value={step.id}
            ><ChainOfThoughtItemTrigger
            /><ChainOfThoughtItemContent
              ><p
                >Details for {step.title}. Collapsed text: kumquat {step.id}.</p
            ></ChainOfThoughtItemContent
          ></ChainOfThoughtItem
        >{/each}</ChainOfThoughtList
    ></ChainOfThoughtContent
  ></ChainOfThought
  ><ChainOfThought id="plain" label="Planning the trip" status="complete" steps={initial.slice(0, 1)}
/></div>
