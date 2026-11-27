<!-- "Stopped", "Failed after 5 attempts" while `retry` is still set, or the `error` option's words. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.OutcomeText> & { children?: never } = $props();
</script>

<parts.OutcomeText {...props}>
  {#snippet children({ text })}{text}{/snippet}
</parts.OutcomeText>
