<!-- The regenerate menu's rows: "Try again", a separator, then the options, a submenu for each with `items`. -->
<script lang="ts">
  import type { MessageRegenerateContentState } from "@kind-ui/agent-ui/core";
  import type { Snippet } from "svelte";
  import {
    KindMenuItem,
    KindMenuItemContent,
    KindMenuSeparator,
    KindMenuSub,
    KindMenuSubContent,
    KindMenuSubTrigger,
  } from "../internal/menu/index.js";

  type Option = MessageRegenerateContentState["options"][number];

  let { tryAgain, options }: MessageRegenerateContentState = $props();

  const icon = (option: Option) => option.icon as string | Snippet | undefined;
</script>

{#snippet rows(list: Option[])}
  {#each list as option (option.id)}
    {#if option.items}
      <KindMenuSub>
        <KindMenuSubTrigger>
          <KindMenuItemContent icon={icon(option)} label={option.label} description={option.description} />
          <span data-menu-chevron=""></span>
        </KindMenuSubTrigger>
        <KindMenuSubContent>{@render rows(option.items)}</KindMenuSubContent>
      </KindMenuSub>
    {:else}
      <KindMenuItem value={option.id} label={option.label}>
        <KindMenuItemContent icon={icon(option)} label={option.label} description={option.description} />
      </KindMenuItem>
    {/if}
  {/each}
{/snippet}

{@render rows([tryAgain])}
<KindMenuSeparator />
{@render rows(options)}
