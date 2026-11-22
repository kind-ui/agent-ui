<!-- UI SDK's `MenuContent` with Rename, Pin or Unpin, Share and Delete, each while its callback is set. -->
<script lang="ts">
  import type { ThreadListMenuContentState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindMenuContent, KindMenuItem } from "../internal/menu/index.js";
  import { parts } from "./parts.js";

  type ContentProps = ComponentProps<typeof KindMenuContent>;
  type Props = { [K in keyof ContentProps as K extends "children" ? never : K]: ContentProps[K] } & {
    /** The menu's items, a snippet of its thread and actions: a menu item for each action by default. */
    children?: Snippet<[ThreadListMenuContentState]>;
  };

  let { children: content, ...props }: Props = $props();
</script>

<parts.MenuContent>
  {#snippet children(state: ThreadListMenuContentState)}
    <!-- Hidden from agents, which use the Thread List's own actions. Kept mounted, so Menu never shows up beside it. -->
    <KindMenuContent
      align="end"
      sideOffset={4}
      finalFocus={state.finalFocus}
      keepMounted
      data-agent-hidden=""
      {...props}
    >
      {#if content}{@render content(state)}{:else}
        {#each state.actions as action (action.value)}
          <KindMenuItem value={action.value} data-destructive={action.value === "delete" ? "" : undefined}>
            <span data-thread-list-icon={action.value} aria-hidden="true"></span>{action.label}
          </KindMenuItem>
        {/each}
      {/if}
    </KindMenuContent>
  {/snippet}
</parts.MenuContent>
