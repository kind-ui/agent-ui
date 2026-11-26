<!-- "Retrying in 4 sec, attempt 2 of 5", counting down. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.RetryingText> & { children?: never } = $props();
</script>

<parts.RetryingText {...props}>
  {#snippet children({ text })}{text}{/snippet}
</parts.RetryingText>
