<!-- The rows of a level: each group under its label, separated, and a submenu for each entry with `items`. -->
<script lang="ts">
  import type { AddMenuRow, AddMenuSection } from "@kind-ui/agent-ui/core";
  import {
    KindMenuGroup,
    KindMenuGroupLabel,
    KindMenuItem,
    KindMenuItemContent,
    KindMenuSeparator,
    KindMenuSub,
    KindMenuSubContent,
    KindMenuSubTrigger,
  } from "../internal/menu/index.js";
  import AddMenuRows from "./AddMenuRows.svelte";

  type Icon = string | import("svelte").Snippet | undefined;

  let { sections }: { sections: AddMenuSection[] } = $props();
</script>

{#snippet row(row: AddMenuRow)}
  {#if !row.sections}
    <KindMenuItem value={row.id} label={row.label} disabled={row.disabled}>
      <KindMenuItemContent icon={row.icon as Icon} label={row.label} description={row.description} />
    </KindMenuItem>
  {:else}
    <KindMenuSub>
      <KindMenuSubTrigger disabled={row.disabled}>
        <KindMenuItemContent icon={row.icon as Icon} label={row.label} description={row.description} />
        <span data-menu-chevron=""></span>
      </KindMenuSubTrigger>
      <KindMenuSubContent><AddMenuRows sections={row.sections} /></KindMenuSubContent>
    </KindMenuSub>
  {/if}
{/snippet}

{#each sections as section, index (section.label ?? "")}
  {#if index > 0}<KindMenuSeparator />{/if}
  {#if section.label === undefined}
    {#each section.rows as entry (entry.id)}{@render row(entry)}{/each}
  {:else}
    <KindMenuGroup>
      <KindMenuGroupLabel>{section.label}</KindMenuGroupLabel>
      {#each section.rows as entry (entry.id)}{@render row(entry)}{/each}
    </KindMenuGroup>
  {/if}
{/each}
