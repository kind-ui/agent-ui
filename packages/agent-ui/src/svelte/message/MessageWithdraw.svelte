<!-- Shown while `onWithdraw` is set and the message is queued or steering. "Withdraw", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Withdraw> = $props();
</script>

{#snippet text({ label }: { label: string })}{label}{/snippet}

<parts.Withdraw {...props} children={children ?? text} />
