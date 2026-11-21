<!-- A data row's icon and text, the label over an optional description, as menus built on `menuBase` draw them. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { KindMenuItemIcon } from "./index.js";

  let {
    icon,
    label,
    description,
  }: {
    /** An image URL, or a snippet such as an inline `svg`. */
    icon?: string | Snippet | undefined;
    label: string;
    description?: string | undefined;
  } = $props();
</script>

{#if icon !== undefined}
  <KindMenuItemIcon>
    {#if typeof icon === "string"}<img src={icon} alt="" />{:else}{@render icon()}{/if}
  </KindMenuItemIcon>
{/if}<span data-menu-text=""
><span>{label}</span>{#if description}<span data-menu-description="">{description}</span>{/if}</span>
