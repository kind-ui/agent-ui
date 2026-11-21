<!--
  An action run on selected text, as a step: its `label`, the `quote` it ran on and its `result` as streamed markdown.
  Any `children` replace the default trigger and content.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ActionQuote from "./ActionQuote.svelte";
  import ActionResult from "./ActionResult.svelte";
  import ActionTitle from "./ActionTitle.svelte";
  import { parts } from "./parts.js";

  let { children, open = $bindable(), ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}
  <parts.Trigger>
    <parts.Icon
    /><ActionTitle />
  </parts.Trigger
  ><parts.Content>
    <ActionQuote
    /><ActionResult />
  </parts.Content>
{/snippet}

<parts.Root {...props} bind:open children={children ?? fallback} />
