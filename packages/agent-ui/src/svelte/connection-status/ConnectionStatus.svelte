<!--
  The connection as a pill over the top of a conversation: its mark, its words and Retry while `onRetry` is set.
  Put it inside the Conversation, beside the viewport. To arrange the parts yourself, use `ConnectionStatusRoot`.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ConnectionStatusRetry from "./ConnectionStatusRetry.svelte";
  import ConnectionStatusText from "./ConnectionStatusText.svelte";
  import { parts } from "./parts.js";

  type RootProps = ComponentProps<typeof parts.Root>;
  let props: { [K in keyof RootProps as K extends "children" ? never : K]: RootProps[K] } = $props();
</script>

<parts.Root {...props}><parts.Mark /><ConnectionStatusText /><ConnectionStatusRetry /></parts.Root>
