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
  } from "@/components/ui/svelte/chain-of-thought/index.js";

  const steps: (ChainOfThoughtStep & { detail: string })[] = [
    {
      id: "search",
      status: "complete",
      title: "Search flights to Lisbon",
      durationSeconds: 3,
      detail: "Found 14 flights on May 12.",
    },
    {
      id: "compare",
      status: "complete",
      title: "Compare fares",
      durationSeconds: 2,
      detail: "The cheapest is 312 € with one stop in Madrid.",
    },
    {
      id: "layovers",
      status: "running",
      title: "Check the layovers",
      detail: "Reading the connection times for the three cheapest fares.",
    },
  ];
</script>

<ChainOfThought label="Researching flights" status="running" {steps}>
  <ChainOfThoughtTrigger>
    <ChainOfThoughtIcon />
    <ChainOfThoughtTitle />
    <ChainOfThoughtMeta />
  </ChainOfThoughtTrigger>
  <ChainOfThoughtContent>
    <ChainOfThoughtList>
      {#each steps as step (step.id)}
        <ChainOfThoughtItem value={step.id}>
          <ChainOfThoughtItemTrigger />
          <ChainOfThoughtItemContent>
            <p>{step.detail}</p>
          </ChainOfThoughtItemContent>
        </ChainOfThoughtItem>
      {/each}
    </ChainOfThoughtList>
  </ChainOfThoughtContent>
</ChainOfThought>
