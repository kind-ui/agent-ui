<!-- A group's heading, by its row key, with its count when grouped by status. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.Heading> = $props();
</script>

<parts.Heading {...props}>
  <parts.HeadingCell value={props.value}>
    {#snippet children({ label, count }: { label: string; count: string })}{label}{#if count}{" "}<span
          data-thread-list-count="">{count}</span
        >{/if}{/snippet}
  </parts.HeadingCell>
</parts.Heading>
