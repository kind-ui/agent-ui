<!-- Keeps the change. "Keep", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.ChangeKeep> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.ChangeKeep {...props} children={children ?? fallback} />
