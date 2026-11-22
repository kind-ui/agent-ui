<!-- Shown while `onContinue` is set and the message stopped. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Continue> = $props();
</script>

{#snippet text()}Continue{/snippet}

<parts.Continue {...props} children={children ?? text} />
