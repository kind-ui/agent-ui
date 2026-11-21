<!-- The regenerate menu: UI SDK's `MenuContent` holding the rows unless you pass children. Props go to it. -->
<script lang="ts">
  import type { MessageRegenerateContentState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindMenuContent } from "../internal/menu/index.js";
  import MessageRegenerateRows from "./MessageRegenerateRows.svelte";
  import { parts } from "./parts.js";

  type Props = Omit<ComponentProps<typeof KindMenuContent>, "children"> & {
    /** What the menu holds, given its rows: the rows by default. */
    children?: Snippet<[MessageRegenerateContentState]>;
  };

  let { children: custom, ...props }: Props = $props();
</script>

<parts.RegenerateContent>
  {#snippet children(state: MessageRegenerateContentState)}
    <!--
      Hidden from agents, which use the Message's own `regenerate`. Kept in the page while closed, as on web, so the
      mark keeps Menu out of the snapshot while only its trigger would show.
    -->
    <KindMenuContent align="start" sideOffset={6} keepMounted data-agent-hidden="" {...props}>
      {#if custom}{@render custom(state)}{:else}<MessageRegenerateRows tryAgain={state.tryAgain} options={state.options} />{/if}
    </KindMenuContent>
  {/snippet}
</parts.RegenerateContent>
