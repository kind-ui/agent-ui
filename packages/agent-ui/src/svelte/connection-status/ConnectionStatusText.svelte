<!-- The state's words, or the countdown while reconnecting, unless you pass a `children` snippet. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Text> = $props();
</script>

{#snippet words({ text }: { text: string })}{text}{/snippet}

<parts.Text {...props} children={children ?? words} />
