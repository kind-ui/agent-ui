<!--
  An icon button named "Settings" that opens a menu of settings: toggles drawn as switches, which keep the menu open,
  and choices, each a submenu of options showing the current one. Any `children` replace the trigger and the content,
  inside UI SDK Menu.
-->
<script lang="ts">
  import type { MenuPartState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindMenu } from "../internal/menu/index.js";
  import type { SettingsMenuSetting } from "./index.js";
  import { parts } from "./parts.js";
  import SettingsMenuContent from "./SettingsMenuContent.svelte";
  import SettingsMenuTrigger from "./SettingsMenuTrigger.svelte";

  type Props = ComponentProps<typeof parts.Root> & {
    settings?: SettingsMenuSetting[];
    children?: Snippet;
  };

  let { open = $bindable(), values = $bindable(), children: content, ...props }: Props = $props();
</script>

<parts.Root bind:open bind:values {...props}>
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
      {#if content}{@render content()}{:else}<SettingsMenuTrigger /><SettingsMenuContent />{/if}
    </KindMenu>
  {/snippet}
</parts.Root>
