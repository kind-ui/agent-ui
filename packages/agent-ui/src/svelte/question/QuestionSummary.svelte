<!-- "Answered" with each question and its answer, or "Skipped", unless you pass children. -->
<script lang="ts">
  import type { QuestionSummaryItem } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Summary> = $props();
</script>

{#snippet defaultSummary({ outcome, items }: { outcome: string; items: QuestionSummaryItem[] })}
  <span data-question-outcome=""><parts.SummaryIcon />{outcome}</span>
  {#if items.length > 0}
    <dl>
      {#each items as item (item.id)}
        <div>
          <dt>{item.prompt}</dt>
          <dd data-empty={item.answer === undefined ? "" : undefined}>{item.answer ?? "No answer"}</dd>
        </div>
      {/each}
    </dl>
  {/if}
{/snippet}

<parts.Summary {...props} children={children ?? defaultSummary} />
