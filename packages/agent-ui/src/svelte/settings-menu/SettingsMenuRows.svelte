<!--
  The rows: a switch for each toggle, and for each choice a submenu showing its value, or while `inline` a section of
  the menu, holding its options under their group labels and any actions after them. A separator follows an inline
  section. Model Control draws its rows with it too.
-->
<script lang="ts">
  import type { SettingsMenuRow } from "@kind-ui/agent-ui/core";
  import { MenuItemIndicator } from "@ui-sdk/svelte/menu";
  import {
    KindMenuCheckboxItem,
    KindMenuGroup,
    KindMenuGroupLabel,
    KindMenuItem,
    KindMenuItemContent,
    KindMenuItemIndicator,
    KindMenuRadioGroup,
    KindMenuRadioItem,
    KindMenuSeparator,
    KindMenuSub,
    KindMenuSubContent,
    KindMenuSubTrigger,
  } from "../internal/menu/index.js";

  type ChoiceRow = Extract<SettingsMenuRow, { type: "choice" }>;
  type Icon = string | import("svelte").Snippet | undefined;

  let { rows }: { rows: SettingsMenuRow[] } = $props();

  // The primitive owns each value: a Svelte component keeps a change to a prop that isn't bound, so each is bound
  // to a setter that keeps nothing, and the new value arrives with the rows.
  const keep = () => {};
</script>

<!-- A choice's options in one radio group, under their group labels, then its actions. -->
{#snippet choices(row: ChoiceRow)}
  <KindMenuRadioGroup name={row.id} bind:value={() => row.value ?? null, keep}>
    {#each row.groups as group, index (index)}
      {#if group.label === undefined}
        {@render radios(group.options)}
      {:else}
        <!-- A labelled group sits inside the one radio group, which UI SDK keys by the setting's `id`. -->
        <KindMenuGroup>
          <KindMenuGroupLabel>{group.label}</KindMenuGroupLabel
          >{@render radios(group.options)}
        </KindMenuGroup>
      {/if}
    {/each}
  </KindMenuRadioGroup
  >{#if row.actions.length && !row.inline}<KindMenuSeparator />{/if}{#each row.actions as action (action.value)}
    <KindMenuItem value={action.value} label={action.label} data-menu-inset={row.inline ? "" : undefined}>
      <KindMenuItemContent icon={action.icon as Icon} label={action.label} />
    </KindMenuItem>
  {/each}{#if row.note}<KindMenuSeparator
    /><!-- Each row's name says its cost in words, so the note is for the eye. --><span
      data-menu-note=""
      aria-hidden="true">{row.note}</span
    >{/if}
{/snippet}

{#snippet radios(options: ChoiceRow["groups"][number]["options"])}
  {#each options as option (option.value)}
    <KindMenuRadioItem value={option.value} label={option.label} disabled={option.disabled ?? false}>
      <KindMenuItemIndicator keepMounted><span data-menu-check="" aria-hidden="true"></span></KindMenuItemIndicator
      ><KindMenuItemContent
        icon={option.icon as Icon}
        label={option.label}
        meta={option.meta}
        metaLabel={option.metaLabel}
      />
    </KindMenuRadioItem>
  {/each}
{/snippet}

{#each rows as row, index (row.id)}
  {#if row.type === "toggle"}
    <KindMenuCheckboxItem value={row.id} label={row.label} bind:checked={() => row.checked, keep}>
      <KindMenuItemContent icon={row.icon as Icon} label={row.label} description={row.description}
      /><MenuItemIndicator keepMounted data-menu-switch="" aria-hidden="true"><span data-menu-switch-thumb=""></span></MenuItemIndicator>
    </KindMenuCheckboxItem>
  {:else if row.inline}
    {@render choices(row)}{#if index < rows.length - 1}<KindMenuSeparator />{/if}
  {:else}
    <KindMenuSub>
      <KindMenuSubTrigger>
        <KindMenuItemContent icon={row.icon as Icon} label={row.label}
        /><span data-settings-menu-value=""
          >{#each row.options as option (option.value)}<span data-current={option.value === row.value ? "" : undefined}
              >{option.label}</span
            >{/each}</span
        ><span data-menu-chevron=""></span>
      </KindMenuSubTrigger
      ><KindMenuSubContent>{@render choices(row)}</KindMenuSubContent>
    </KindMenuSub>
  {/if}
{/each}
