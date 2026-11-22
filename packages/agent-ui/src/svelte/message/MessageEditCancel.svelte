<!-- Ends the edit without saving, as Escape does. "Cancel", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.EditCancel> = $props();
</script>

{#snippet text()}Cancel{/snippet}

<parts.EditCancel {...props} children={children ?? text} />
