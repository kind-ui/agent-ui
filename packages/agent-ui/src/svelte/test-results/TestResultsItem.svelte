<!--
  A row's name and its status mark, unless you pass children. Its `value` is the suite's id or the test's
  `suiteId/testId`. The duration is drawn after them.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Item> = $props();
</script>

{#snippet fallback({ name }: { name: string })}<span data-test-results-name="">{name}</span>{" "}<parts.ItemStatus
  />{/snippet}

<parts.Item {...props} children={children ?? fallback} />
