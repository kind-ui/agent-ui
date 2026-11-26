<!--
  Send and its menu while a turn runs, shown once there's text when the composer has `onSteer`: Steer or Queue, and
  a chevron offering Steer now, Queue for later and Stop and send, each with its keys. Put it beside `ComposerStop`.
-->
<script lang="ts">
  import type { ComposerSendMenuState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindMenu, KindMenuContent, KindMenuItem, KindMenuSeparator } from "../internal/menu/index.js";
  import ComposerSendMenuTrigger from "./ComposerSendMenuTrigger.svelte";
  import ComposerSteer from "./ComposerSteer.svelte";
  import { parts } from "./parts.js";

  type PartProps = ComponentProps<typeof parts.SendMenu>;
  // `Omit` would turn the known props into the index signature's `unknown`.
  type Props = { [K in keyof PartProps as K extends "children" ? never : K]: PartProps[K] } & {
    children?: Snippet;
  };

  let { children: content, ...props }: Props = $props();
</script>

<parts.SendMenu {...props}>
  <!-- Part state can't be spread, so each key Menu takes is read by name. -->
  {#snippet children(menu: ComposerSendMenuState)}
    <KindMenu controller={menu.controller} open={menu.open} onOpenChange={menu.onOpenChange} onAction={menu.onAction}>
      {#if content}{@render content()}{:else}<ComposerSteer /><ComposerSendMenuTrigger /><KindMenuContent
          align="end"
          side="top"
          sideOffset={8}
          data-composer-send-menu=""
          >{#each menu.items as item (item.value)}{#if item.value === "stop-and-send"}<KindMenuSeparator
              />{/if}<KindMenuItem value={item.value} label={item.label} data-current={item.checked ? "" : undefined}
              ><span data-composer-check="" aria-hidden="true"></span><span data-composer-send-text=""
                ><span data-composer-send-label="">{item.label}</span><span data-composer-send-description=""
                  >{item.description}</span
                ></span
              >{#if item.shortcut}<kbd data-composer-send-keys="">{item.shortcut}</kbd>{/if}</KindMenuItem
            >{/each}</KindMenuContent
        >{/if}
    </KindMenu>
  {/snippet}
</parts.SendMenu>
