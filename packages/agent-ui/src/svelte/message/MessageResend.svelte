<!-- Shown while `onResend` is set and the message wasn't sent. "Retry", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Resend> = $props();
</script>

{#snippet text({ label }: { label: string })}{label}{/snippet}

<parts.Resend {...props} children={children ?? text} />
