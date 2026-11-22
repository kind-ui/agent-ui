<!-- A group's heading, by its row key. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.Heading> = $props();
</script>

<parts.Heading {...props}>
  <parts.HeadingCell value={props.value}>
    {#snippet children({ label }: { label: string })}{label}{/snippet}
  </parts.HeadingCell>
</parts.Heading>
