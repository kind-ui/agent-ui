<!--
  A table with a copy button. Name it with `aria-label`. Set `--kind-markdown-table-columns` to the column count
  so it scrolls sideways rather than squeezing its columns.
-->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import {
    KindScrollArea,
    KindScrollAreaContent,
    KindScrollAreaScrollbar,
    KindScrollAreaThumb,
    KindScrollAreaViewport,
  } from "../internal/scroll-area/index.js";
  import { parts } from "./parts.js";

  type Props = Omit<ComponentProps<typeof parts.Root>, "children"> & {
    /** The table's `thead` and `tbody`. */
    children?: Snippet;
  };

  let { children, ...props }: Props = $props();
</script>

<parts.Root {...props}>
  <parts.Header>
    <parts.Copy />
  </parts.Header>
  <KindScrollArea>
    <KindScrollAreaViewport>
      <KindScrollAreaContent>
        <parts.Table>{@render children?.()}</parts.Table>
      </KindScrollAreaContent>
    </KindScrollAreaViewport>
    <KindScrollAreaScrollbar orientation="horizontal">
      <KindScrollAreaThumb />
    </KindScrollAreaScrollbar>
  </KindScrollArea>
</parts.Root>
