<!-- "Next run 9:00 AM", a countdown within the hour, or "Paused", unless you pass a `children` snippet. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Next> = $props();
</script>

{#snippet words({ text }: { text: string })}{text}{/snippet}

<parts.Next {...props} children={children ?? words} />
