<!-- Saves the edit, as Enter does. "Save", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.EditSave> = $props();
</script>

{#snippet text()}Save{/snippet}

<parts.EditSave {...props} children={children ?? text} />
