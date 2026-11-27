<!-- A line under the list, like what a model's cost means, unless you pass children. Rendered only with one. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { type PickerParts, pickerConfig } from "./parts.js";

  let { children, ...props }: ComponentProps<PickerParts["Note"]> = $props();
  const { parts } = pickerConfig();
</script>

{#snippet note(state: { note: string })}{state.note}{/snippet}

<parts.Note {...props} children={children ?? note} />
