<!-- Closes the dialog. Reads "Cancel" unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.DialogCancel> = $props();
</script>

{#snippet fallback()}Cancel{/snippet}

<parts.DialogCancel {...props} children={children ?? fallback} />
