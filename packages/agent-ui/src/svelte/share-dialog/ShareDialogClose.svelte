<!-- Closes the dialog and returns focus to the trigger. "Done", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Close> = $props();
</script>

{#snippet fallback()}
  Done
{/snippet}

<parts.Close {...props} children={children ?? fallback} />
