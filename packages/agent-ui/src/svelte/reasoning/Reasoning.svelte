<!--
  The model's thinking as a step: "Thinking" while it runs, "Thought for N s" once done, and its `text` as streamed
  markdown. Any `children` replace the default trigger and content.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import ReasoningContent from "./ReasoningContent.svelte";
  import ReasoningTitle from "./ReasoningTitle.svelte";

  let { children: content, open = $bindable(), ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

<parts.Root {...props} bind:open
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<parts.Trigger
        ><parts.Icon
        /><ReasoningTitle
      /></parts.Trigger
      ><ReasoningContent
    />{/if}{/snippet}</parts.Root>
