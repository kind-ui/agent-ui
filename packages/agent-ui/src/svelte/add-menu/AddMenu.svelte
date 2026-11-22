<!--
  An icon button named "Add" that opens a menu of what can be added: items with an icon and a description, grouped
  under labels, and submenus. Any `children` replace the trigger and the content, inside UI SDK Menu.
-->
<script lang="ts">
  import type { MenuPartState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindMenu } from "../internal/menu/index.js";
  import AddMenuContent from "./AddMenuContent.svelte";
  import AddMenuTrigger from "./AddMenuTrigger.svelte";
  import type { AddMenuEntry } from "./index.js";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Root> & {
    items?: AddMenuEntry[];
    children?: Snippet;
  };

  let { open = $bindable(), children: content, ...props }: Props = $props();
</script>

<parts.Root bind:open {...props}>
  <!-- Part state can't be spread, so each key Menu takes is read by name. -->
  {#snippet children(menu: MenuPartState)}
    <KindMenu
      controller={menu.controller}
      presentation={menu.presentation}
      open={menu.open}
      onOpenChange={menu.onOpenChange}
      onAction={menu.onAction}
      onCheckedChange={menu.onCheckedChange}
      onValueChange={menu.onValueChange}
    >
      {#if content}{@render content()}{:else}<AddMenuTrigger /><AddMenuContent />{/if}
    </KindMenu>
  {/snippet}
</parts.Root>
