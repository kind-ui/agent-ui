<!-- Opens the dialog. Shows the `label` and the `shortcut`'s keys, unless you pass children. -->
<script lang="ts">
  import type { PickerTriggerState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import PickerTrigger from "../picker/PickerTrigger.svelte";
  import ThreadSearchShortcut from "./ThreadSearchShortcut.svelte";

  type Props = ComponentProps<typeof PickerTrigger>;

  let { children: content, ...props }: Props = $props();
</script>

<PickerTrigger {...props}>
  {#snippet children(state: PickerTriggerState)}
    {#if content}{@render content(state)}{:else}<span data-picker-text="">{state.text}</span><ThreadSearchShortcut />{/if}
  {/snippet}
</PickerTrigger>
