<!--
  The regenerate menu, given the menu props from the regenerate part's state. It keeps them in state of its own: a
  `@ui-sdk/svelte` part that tears down reads its props again, and a read of the part's state there made the Message
  miss its next status (it went `complete` but stayed drawn as `streaming`).
-->
<script lang="ts">
  import type { MenuPartState } from "@kind-ui/agent-ui/core";
  import { type Snippet, untrack } from "svelte";
  import { KindMenu } from "../internal/menu/index.js";

  let { menu: given, children }: { menu: MenuPartState; children: Snippet } = $props();

  let menu = $state.raw(untrack(() => given));
  $effect.pre(() => {
    menu = given;
  });
</script>

<KindMenu {...menu}>{@render children()}</KindMenu>
