<!-- "Stopped", or the `error` option's words. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: Omit<ComponentProps<typeof parts.OutcomeText>, "children"> = $props();
</script>

<parts.OutcomeText {...props}>
  {#snippet children({ text }: { text: string })}{text}{/snippet}
</parts.OutcomeText>
