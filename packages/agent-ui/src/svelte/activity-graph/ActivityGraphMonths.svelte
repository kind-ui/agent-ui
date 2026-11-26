<!-- The months over their first week, hidden from assistive technology, which reads each day's date. -->
<script lang="ts">
  import type { ActivityGraphMonthsState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import ActivityGraphMonth from "./ActivityGraphMonth.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Months> = $props();
</script>

{#snippet fallback({ months }: ActivityGraphMonthsState)}{#each months as month (month.value)}<ActivityGraphMonth
      value={month.value}
    />{/each}{/snippet}

<parts.Months {...props} children={children ?? fallback} />
