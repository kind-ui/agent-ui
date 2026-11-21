<!--
  A button that shows the chosen model and its icon, and opens a searchable list of models grouped by provider, with
  footer `actions`. Any `children` replace the trigger and the list.
-->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { PickerFooterAction } from "../picker/index.js";
  import PickerContent from "../picker/PickerContent.svelte";
  import PickerTrigger from "../picker/PickerTrigger.svelte";
  import { setPickerConfig } from "../picker/parts.js";
  import type { ModelSelectorModel } from "./index.js";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Root> & {
    models?: ModelSelectorModel[];
    actions?: PickerFooterAction[];
    children?: Snippet;
  };

  let { value = $bindable(), open = $bindable(), children, ...props }: Props = $props();
  setPickerConfig({ parts });
</script>

<parts.Root bind:value bind:open {...props}>
  {#if children}{@render children()}{:else}<PickerTrigger /><PickerContent />{/if}
</parts.Root>
