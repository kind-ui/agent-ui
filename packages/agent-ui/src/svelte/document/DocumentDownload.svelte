<!--
  Calls `onDownload` with its `value`, a download's `id`. Wraps a `KindToolbarButton` named "Download", or showing
  the download's `label` when there are several, unless you pass children.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { KindToolbarButton } from "../internal/toolbar/index.js";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Download> = $props();
</script>

{#snippet fallback({ label }: { label: string | undefined })}
  <KindToolbarButton aria-label={label ? `Download ${label}` : "Download"}
    >{#if label}<span data-document-download-label="">{label}</span>{/if}</KindToolbarButton
  >
{/snippet}

<parts.Download {...props} children={children ?? fallback} />
