<!--
  A button that shows the chosen item and opens a searchable list of them, with groups, two-line rows, pages and
  footer actions. Any `children` replace the trigger and the list.
-->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { PickerChoice, PickerFooterAction } from "./index.js";
  import PickerContent from "./PickerContent.svelte";
  import PickerTrigger from "./PickerTrigger.svelte";
  import { parts, setPickerConfig } from "./parts.js";

  type Props = ComponentProps<typeof parts.Root> & {
    items?: PickerChoice[];
    actions?: PickerFooterAction[];
    children?: Snippet;
  };

  let { value = $bindable(), open = $bindable(), children, ...props }: Props = $props();
  setPickerConfig({ parts });
</script>

<parts.Root bind:value bind:open {...props}>
  {#if children}{@render children()}{:else}<PickerTrigger /><PickerContent />{/if}
</parts.Root>
