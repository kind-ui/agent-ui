<!--
  A panel beside the page that a person resizes and collapses, and that turns into a modal drawer on a narrow
  screen. Write `SidebarPanel`, `SidebarHandle` and `SidebarInset` inside it in reading order, and a
  `SidebarTrigger` anywhere inside. The Resizable stays mounted on a narrow screen, so the page in the inset never
  mounts again; only the panel's content moves into the drawer.
-->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { KindResizable } from "../internal/resizable/index.js";
  import { parts } from "./parts.js";

  type RootProps = ComponentProps<typeof parts.Root>;
  type Props = { [K in keyof RootProps as K extends "children" ? never : K]: RootProps[K] } & {
    children?: Snippet;
  };

  let { open = $bindable(), children: content, ...props }: Props = $props();
</script>

<parts.Root bind:open {...props}>
  {#snippet children({ resizable }: Parameters<NonNullable<RootProps["children"]>>[0])}
    <KindResizable
      controller={resizable.controller}
      autoSaveId={resizable.autoSaveId}
      storage={resizable.storage}
      onLayoutCommit={resizable.onLayoutCommit}
    >
      {@render content?.()}
    </KindResizable>
  {/snippet}
</parts.Root>
