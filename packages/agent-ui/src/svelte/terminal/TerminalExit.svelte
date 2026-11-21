<!-- "exit N" once there's an exit code, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Exit> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.Exit {...props} children={children ?? fallback} />
