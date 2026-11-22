<!-- A row: UI SDK's `CommandItem` with the row's props, holding its `PickerItem` unless you pass children. -->
<script lang="ts">
  import type { PickerRow } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindCommandItem } from "../internal/command/index.js";
  import PickerItem from "./PickerItem.svelte";

  type Props = ComponentProps<typeof KindCommandItem> & {
    row: PickerRow;
    /** The row's content: a `PickerItem` by default. */
    children?: Snippet;
  };

  let { row, children, ...props }: Props = $props();
</script>

<KindCommandItem {...props} {...row.option}>
  {#if children}{@render children()}{:else}<PickerItem value={row.option.value} />{/if}
</KindCommandItem>
