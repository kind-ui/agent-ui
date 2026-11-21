<!-- The menu: UI SDK's `MenuContent` holding the rows unless you pass children. Props go to it. -->
<script lang="ts">
  import type { AddMenuContentState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindMenuContent } from "../internal/menu/index.js";
  import AddMenuRows from "./AddMenuRows.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof KindMenuContent> & {
    /** What the menu holds, from its rows: the rows by default. */
    children?: Snippet<[AddMenuContentState]>;
  };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Content>
  {#snippet children(state: AddMenuContentState)}
    <KindMenuContent align="start" sideOffset={6} {...props}>
      {#if content}{@render content(state)}{:else}<AddMenuRows sections={state.sections} />{/if}
    </KindMenuContent>
  {/snippet}
</parts.Content>
