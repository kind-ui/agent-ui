<!-- The menu: UI SDK's `MenuContent` holding the rows unless you pass children. Props go to it. -->
<script lang="ts">
  import type { SettingsMenuContentState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindMenuContent } from "../internal/menu/index.js";
  import { parts } from "./parts.js";
  import SettingsMenuRows from "./SettingsMenuRows.svelte";

  type Props = ComponentProps<typeof KindMenuContent> & {
    /** What the menu holds, from its rows: the rows by default. */
    children?: Snippet<[SettingsMenuContentState]>;
  };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Content>
  {#snippet children(state: SettingsMenuContentState)}
    <KindMenuContent align="start" sideOffset={6} {...props}>
      {#if content}{@render content(state)}{:else}<SettingsMenuRows rows={state.rows} />{/if}
    </KindMenuContent>
  {/snippet}
</parts.Content>
