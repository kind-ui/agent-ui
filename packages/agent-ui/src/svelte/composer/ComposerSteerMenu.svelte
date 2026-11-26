<!--
  Send, its menu of modes and Stop's neighbor while a turn runs and the composer has `onSteer`: Steer or Queue, and a
  chevron offering "Steer now" and "Queue for next turn". Put it beside `ComposerSubmit` and `ComposerStop`.
-->
<script lang="ts">
  import type { ComposerSteerMenuState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindMenu, KindMenuContent, KindMenuItem } from "../internal/menu/index.js";
  import ComposerSteer from "./ComposerSteer.svelte";
  import ComposerSteerMenuTrigger from "./ComposerSteerMenuTrigger.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.SteerMenu> & { children?: Snippet };

  let { children: content, ...props }: Props = $props();
</script>

<parts.SteerMenu {...props}>
  <!-- Part state can't be spread, so each key Menu takes is read by name. -->
  {#snippet children(menu: ComposerSteerMenuState)}
    <KindMenu controller={menu.controller} onOpenChange={menu.onOpenChange} onAction={menu.onAction}>
      {#if content}{@render content()}{:else}<ComposerSteer /><ComposerSteerMenuTrigger /><KindMenuContent
          align="end"
          side="top"
          sideOffset={6}
        >
          {#each menu.items as item (item.value)}
            <KindMenuItem value={item.value} label={item.label} shortcut={item.shortcut} disabled={item.disabled}
              >{item.label}</KindMenuItem
            >
          {/each}
        </KindMenuContent>{/if}
    </KindMenu>
  {/snippet}
</parts.SteerMenu>
