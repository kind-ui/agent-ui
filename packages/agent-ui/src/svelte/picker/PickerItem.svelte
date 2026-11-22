<!-- A row's content: its icon, marked label, description, `meta`, and its check or chevron. -->
<script lang="ts">
  import type { PickerItemState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindCommandItemIcon, KindCommandItemText } from "../internal/command/index.js";
  import PickerIcon from "./PickerIcon.svelte";
  import { type PickerParts, pickerConfig } from "./parts.js";

  type Props = ComponentProps<PickerParts["Item"]> & {
    children?: Snippet<[PickerItemState]>;
  };

  let { children: content, ...props }: Props = $props();
  const { parts, icon, trailing } = pickerConfig();
</script>

<parts.Item {...props}>
  {#snippet children(state: PickerItemState)}
    <!-- A row the list just dropped reads its state once more before Svelte removes it, and has none. -->
    {#if !state.row}{:else if content}{@render content(state)}{:else}{#if state.row.icon !== undefined && icon !== null}<KindCommandItemIcon
          >{#if icon}{@render icon(state.row)}{:else}<PickerIcon icon={state.row.icon} />{/if}</KindCommandItemIcon
        >{/if}<span data-picker-item-text=""
        ><KindCommandItemText>{state.row.label}</KindCommandItemText
        >{#if state.description.length}<span data-picker-description=""
            >{#each state.description as segment, index (index)}{#if segment.match}<mark>{segment.text}</mark
                >{:else}{segment.text}{/if}{/each}</span
          >{/if}</span
      >{#if state.row.meta}<span data-picker-meta="">{state.row.meta}</span>{/if}{@render trailing?.(
        state.row,
      )}<span data-picker-mark=""></span>{/if}
  {/snippet}
</parts.Item>
