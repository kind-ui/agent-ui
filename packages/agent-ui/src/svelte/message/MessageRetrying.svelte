<!--
  Put it after the content, where the outcome goes. While `retry` is set: a running mark and "Retrying, attempt 2 of
  5, in 4 sec".
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.Retrying> & { children?: never } = $props();
</script>

<parts.Retrying {...props}>
  {#snippet children({ text })}<parts.RetryingIcon />{text}{/snippet}
</parts.Retrying>
