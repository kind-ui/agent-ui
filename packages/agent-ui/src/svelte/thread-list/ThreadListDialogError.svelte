<!-- "Couldn't delete. Try again." after a delete fails, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.DialogError> = $props();
</script>

{#snippet fallback()}Couldn't delete. Try again.{/snippet}

<parts.DialogError {...props} children={children ?? fallback} />
