<!-- The work in words, with code as `code`, unless you pass children. -->
<script lang="ts">
  import { codeSpans } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Title> = $props();
</script>

<parts.Title {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}{#each codeSpans(state.title) as piece, index}{#if index % 2}<code
          >{piece}</code
        >{:else}{piece}{/if}{/each}{/if}{/snippet}</parts.Title>
