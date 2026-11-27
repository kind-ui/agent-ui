<!--
  A data row's icon and text, the label over an optional description, then its trailing `meta`, as menus built on
  `menuBase` draw them.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { KindMenuItemIcon } from "./index.js";

  let {
    icon,
    label,
    description,
    meta,
    metaLabel,
  }: {
    /** An image URL, or a snippet such as an inline `svg`. */
    icon?: string | Snippet | undefined;
    label: string;
    description?: string | undefined;
    /** Trailing text, like a model's cost. */
    meta?: string | undefined;
    /** What screen readers hear in place of `meta`. */
    metaLabel?: string | undefined;
  } = $props();
</script>

{#if icon !== undefined}
  <KindMenuItemIcon>
    {#if typeof icon === "string"}<img src={icon} alt="" />{:else}{@render icon()}{/if}
  </KindMenuItemIcon>
{/if}<span data-menu-text=""
><span>{label}</span>{#if description}<span data-menu-description="">{description}</span>{/if}</span
>{#if meta}<span data-menu-meta="" aria-hidden={metaLabel ? "true" : undefined}>{meta}</span
  >{/if}{#if meta && metaLabel}<span data-menu-meta-label="">{metaLabel}</span>{/if}
