<!-- UI SDK Menu, shared by every row, holding a `ThreadListMenuContent` unless you pass children. -->
<script lang="ts">
  import type { MenuPartState } from "@kind-ui/agent-ui/core";
  import type { Snippet } from "svelte";
  import { KindMenu } from "../internal/menu/index.js";
  import { parts } from "./parts.js";
  import ThreadListMenuContent from "./ThreadListMenuContent.svelte";

  let { children: content }: { children?: Snippet } = $props();
</script>

<parts.Menu>
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
      {#if content}{@render content()}{:else}<ThreadListMenuContent />{/if}
    </KindMenu>
  {/snippet}
</parts.Menu>
