<!-- UI SDK's Toggle group, holding the thumbs unless you pass children. One Tab stop, with arrow keys between. -->
<script lang="ts">
  import { ToggleGroup } from "@ui-sdk/svelte/toggle";
  import type { ComponentProps, Snippet } from "svelte";
  import FeedbackDown from "./FeedbackDown.svelte";
  import FeedbackUp from "./FeedbackUp.svelte";
  import { parts } from "./parts.js";

  let {
    children: custom,
    ...props
  }: ComponentProps<typeof parts.Thumbs> & { children?: Snippet } = $props();
</script>

<parts.Thumbs {...props}>
  {#snippet children(group)}
    <!-- Hidden from agents, which use the Feedback's own `rate`. Part state is a proxy that can't be spread. -->
    <ToggleGroup
      controller={group.controller}
      defaultValue={group.defaultValue}
      aria-label={group["aria-label"]}
      data-agent-hidden=""
    >
      {#if custom}{@render custom()}{:else}<FeedbackUp /><FeedbackDown />{/if}
    </ToggleGroup>
  {/snippet}
</parts.Thumbs>
