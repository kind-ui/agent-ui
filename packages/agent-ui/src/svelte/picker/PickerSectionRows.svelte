<!-- A group of rows under its label, or the footer. -->
<script lang="ts">
  import type { PickerRow, PickerSection } from "@kind-ui/agent-ui/core";
  import type { Snippet } from "svelte";
  import { KindCommandGroup, KindCommandGroupLabel, KindCommandSeparator } from "../internal/command/index.js";
  import PickerRowItem from "./PickerRowItem.svelte";

  let {
    section,
    separated = false,
    children,
  }: {
    section: PickerSection;
    /** Whether a separator comes before it, as before the footer. */
    separated?: boolean;
    /** Renders each row: a `PickerRowItem` by default. */
    children?: Snippet<[PickerRow]>;
  } = $props();
</script>

{#if separated}<KindCommandSeparator />{/if}
<KindCommandGroup>
  {#if section.label}<KindCommandGroupLabel>{section.label}</KindCommandGroupLabel>{/if}
  <!-- Keyed by its label too, as React's are: a footer row's label can hold the search. -->
  {#each section.rows as row (`${row.option.value}\u0000${row.option.label}`)}
    {#if children}{@render children(row)}{:else}<PickerRowItem {row} />{/if}
  {/each}
</KindCommandGroup>
