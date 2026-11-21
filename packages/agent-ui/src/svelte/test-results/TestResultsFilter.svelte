<!-- Holds the counts beside the trigger: a `TestResultsCount` for passed, failed and skipped, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import TestResultsCount from "./TestResultsCount.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Filter> = $props();
</script>

{#snippet fallback()}
  <TestResultsCount value="pass" />
  <TestResultsCount value="fail" />
  <TestResultsCount value="skip" />
{/snippet}

<parts.Filter {...props} children={children ?? fallback} />
