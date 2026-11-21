<!-- Opens the list. Shows the chosen item's icon and label, or the `label` while none is chosen, unless you pass children. -->
<script lang="ts">
  import type { PickerTriggerState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import PickerIcon from "./PickerIcon.svelte";
  import { type PickerParts, pickerConfig } from "./parts.js";

  type Props = ComponentProps<PickerParts["Trigger"]> & {
    children?: Snippet<[PickerTriggerState]>;
  };

  let { children: content, ...props }: Props = $props();
  const { parts } = pickerConfig();
</script>

<parts.Trigger {...props}>
  {#snippet children(state: PickerTriggerState)}
    {#if content}{@render content(state)}{:else}
      {#if state.icon !== undefined}<span data-picker-icon=""><PickerIcon icon={state.icon} /></span>{/if}
      <span data-picker-text="">{state.text}</span>
      <span data-picker-chevron=""></span>
    {/if}
  {/snippet}
</parts.Trigger>
