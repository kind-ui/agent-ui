<!-- A `KindToolbar` with Copy and a Download for each of the `downloads`, unless you pass children. -->
<script lang="ts">
  import type { DocumentDownload as Download } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { KindToolbar } from "../internal/toolbar/index.js";
  import DocumentCopy from "./DocumentCopy.svelte";
  import DocumentDownload from "./DocumentDownload.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Toolbar> = $props();
</script>

{#snippet fallback({ downloads, canDownload }: { downloads: Download[]; canDownload: boolean })}
  <KindToolbar aria-label="Document actions">
    <DocumentCopy />
    {#if canDownload}
      {#if downloads.length > 1}
        {#each downloads as { id } (id)}
          <DocumentDownload value={id} />
        {/each}
      {:else}
        <DocumentDownload value={downloads[0]?.id} />
      {/if}
    {/if}
  </KindToolbar>
{/snippet}

<parts.Toolbar {...props} children={children ?? fallback} />
