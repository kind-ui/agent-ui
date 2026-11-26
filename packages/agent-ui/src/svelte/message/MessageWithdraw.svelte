<!-- Shown while `onWithdraw` is set and the message is queued. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Withdraw> = $props();
</script>

{#snippet text()}Withdraw{/snippet}

<parts.Withdraw {...props} children={children ?? text} />
