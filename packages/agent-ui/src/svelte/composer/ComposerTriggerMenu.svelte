<!-- Suggests `mentions` after `@` and `commands` after `/`; choosing one inserts a token. -->
<script lang="ts">
  import type { ComposerTriggerItem, ComposerTriggerMenuState } from "@kind-ui/agent-ui/core";
  import type { TriggerMenuContentState } from "@ui-sdk/svelte/trigger-menu";
  import type { ComponentProps } from "svelte";
  import {
    KindTriggerMenu,
    KindTriggerMenuContent,
    KindTriggerMenuEmpty,
    KindTriggerMenuItem,
    KindTriggerMenuList,
  } from "../internal/trigger-menu/index.js";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof KindTriggerMenuContent> = $props();

  // UI SDK Svelte connects a Trigger Menu to its Token Input's editor before the editor's element binds, so the
  // editor's `aria-autocomplete` and `aria-haspopup` would wait for its first change. Mounted once the editor is in
  // the page, the menu writes them at once, as React's does. It renders nothing while closed.
  let mounted = $state(false);
  $effect(() => {
    mounted = true;
  });
</script>

<parts.TriggerMenu>
  {#snippet children({ triggers }: ComposerTriggerMenuState)}
    {#if mounted}
      <KindTriggerMenu {triggers}>
        <KindTriggerMenuContent {...props}>
          <KindTriggerMenuEmpty>No matches</KindTriggerMenuEmpty>
          <KindTriggerMenuList>
            {#snippet children(state: TriggerMenuContentState)}
              {#each state.items as ComposerTriggerItem[] as item (item.value)}
                <KindTriggerMenuItem value={item.value} label={item.label}>
                  <span>{item.label}</span>{#if item.description}<span data-description="">{item.description}</span>{/if}
                </KindTriggerMenuItem>
              {/each}
            {/snippet}
          </KindTriggerMenuList>
        </KindTriggerMenuContent>
      </KindTriggerMenu>
    {/if}
  {/snippet}
</parts.TriggerMenu>
