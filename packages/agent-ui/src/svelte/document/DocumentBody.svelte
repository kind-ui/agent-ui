<!-- The preview: a `KindScrollArea` holding the content, followed by Show more, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import {
    KindScrollArea,
    KindScrollAreaContent,
    KindScrollAreaScrollbar,
    KindScrollAreaThumb,
    KindScrollAreaViewport,
  } from "../internal/scroll-area/index.js";
  import DocumentContent from "./DocumentContent.svelte";
  import DocumentExpand from "./DocumentExpand.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Body> = $props();
</script>

{#snippet fallback({ streaming }: { streaming: boolean })}
  <KindScrollArea stickToEnd={streaming}>
    <KindScrollAreaViewport>
      <KindScrollAreaContent>
        <DocumentContent />
      </KindScrollAreaContent>
    </KindScrollAreaViewport>
    <KindScrollAreaScrollbar>
      <KindScrollAreaThumb />
    </KindScrollAreaScrollbar>
  </KindScrollArea>
  <DocumentExpand />
{/snippet}

<parts.Body {...props} children={children ?? fallback} />
