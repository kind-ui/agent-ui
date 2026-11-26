<!-- The command, or the `label`, or "Run <command>?" while the approval waits, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Title> = $props();
</script>

{#snippet fallback({ spans }: { spans: readonly string[] })}{#each spans as piece, index}{#if index % 2}<code
        >{piece}</code
      >{:else}{piece}{/if}{/each}{/snippet}

<parts.Title {...props} children={children ?? fallback} />
