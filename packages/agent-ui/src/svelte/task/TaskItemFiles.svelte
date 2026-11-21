<!-- The item's `files`, each as code, unless you pass children. Rendered only while the item has files. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.ItemFiles> = $props();
</script>

<parts.ItemFiles {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<!-- A step can touch one file twice, so files are keyed by place. -->{#each state.files as file, index (index)}<code>{file}</code>{/each}{/if}{/snippet}</parts.ItemFiles>
