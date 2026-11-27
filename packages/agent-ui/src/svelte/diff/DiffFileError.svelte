<!-- "Couldn't undo `auth.ts`", with its backticks as `code`, unless you pass children. -->
<script lang="ts">
  import { codeSpans } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.FileError> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{#each codeSpans(text) as piece, index}{#if index % 2}<code
        >{piece}</code
      >{:else}{piece}{/if}{/each}{/snippet}

<parts.FileError {...props} children={children ?? fallback} />
