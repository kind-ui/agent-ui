<!--
  Wraps the toolbar button that regenerates. While the message has `regenerateOptions`, the button opens a menu of
  them instead, rendered through UI SDK's `MenuTrigger`, so it keeps its place in the toolbar's arrow-key order.
-->
<script lang="ts">
  import { MenuTrigger } from "@ui-sdk/svelte/menu";
  import type { ComponentProps, Snippet } from "svelte";
  import MessageRegenerateContent from "./MessageRegenerateContent.svelte";
  import MessageRegenerateMenu from "./MessageRegenerateMenu.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Regenerate> & {
    /**
     * The `KindToolbarButton` that regenerates, or opens the menu while there are `regenerateOptions`. Spread the
     * props it's handed onto it: `{#snippet children(props)}<KindToolbarButton {...props} aria-label="Regenerate" />{/snippet}`.
     */
    children?: Snippet<[Record<string, unknown>]>;
    /** The menu, while there are `regenerateOptions`: `<MessageRegenerateContent />` by default. */
    menuContent?: Snippet;
  };

  let { children: button, menuContent, ...props }: Props = $props();
</script>

<parts.Regenerate {...props}>
  {#snippet children({ menu })}
    {#if menu && button}
      <MessageRegenerateMenu {menu}>
        <parts.RegenerateTrigger>
          <MenuTrigger>
            {#snippet render({ props: trigger }: { props: Record<string, unknown> })}{@render button(trigger)}{/snippet}
          </MenuTrigger>
        </parts.RegenerateTrigger
        >{#if menuContent}{@render menuContent()}{:else}<MessageRegenerateContent />{/if}
      </MessageRegenerateMenu>
    {:else}
      {@render button?.({})}
    {/if}
  {/snippet}
</parts.Regenerate>
