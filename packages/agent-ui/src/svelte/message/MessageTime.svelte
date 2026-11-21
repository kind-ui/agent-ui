<!-- A `<time>` of `createdAt`: the time of day, with the date when it isn't today. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.Time> & { children?: never } = $props();
</script>

<parts.Time {...props}>
  {#snippet children({ label })}{label}{/snippet}
</parts.Time>
