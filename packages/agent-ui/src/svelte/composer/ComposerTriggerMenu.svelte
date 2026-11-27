<!-- Suggests `mentions` after `@` and `commands` after `/`; choosing one inserts a token. -->
<script lang="ts">
  import type { ComposerTriggerItem } from "@kind-ui/agent-ui/core";
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
</script>

<parts.TriggerMenu>
  {#snippet children({ triggers })}
    <KindTriggerMenu {triggers}>
      <KindTriggerMenuContent {...props}>
        <KindTriggerMenuEmpty>No matches</KindTriggerMenuEmpty
        ><KindTriggerMenuList>
          {#snippet children(state)}
            {#each state.items as ComposerTriggerItem[] as item (item.value)}
              <KindTriggerMenuItem value={item.value} label={item.label}>
                <span>{item.label}</span>{#if item.description}<span data-description="">{item.description}</span>{/if}
              </KindTriggerMenuItem>
            {/each}
          {/snippet}
        </KindTriggerMenuList>
      </KindTriggerMenuContent>
    </KindTriggerMenu>
  {/snippet}
</parts.TriggerMenu>
