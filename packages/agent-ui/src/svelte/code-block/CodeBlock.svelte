<!-- A code block with its language, a wrap toggle and a copy button. Name it with `aria-label`. -->
<script lang="ts">
  import type { CodeBlockState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import {
    KindScrollArea,
    KindScrollAreaContent,
    KindScrollAreaScrollbar,
    KindScrollAreaThumb,
    KindScrollAreaViewport,
  } from "../internal/scroll-area/index.js";
  import { parts } from "./parts.js";

  type Props = Omit<ComponentProps<typeof parts.Root>, "children"> & {
    /**
     * Shows the language, the wrap toggle and the copy button.
     * @default true
     */
    header?: boolean;
  };

  let { header = true, ...props }: Props = $props();
</script>

<parts.Root {...props}>
  {#if header}
    <parts.Header>
      <parts.Language>{#snippet children({ language }: CodeBlockState)}{language}{/snippet}</parts.Language>
      <parts.Wrap />
      <parts.Copy />
    </parts.Header>
  {/if}
  <KindScrollArea stickToEnd={props.streaming ?? false}>
    <KindScrollAreaViewport>
      <KindScrollAreaContent>
        <parts.Code>
          {#snippet children({ lines }: CodeBlockState)}<code
              >{#each lines as line}<span data-line=""
                  >{#each line as token}<span
                      data-font-style={token.fontStyle}
                      style:--kind-code-block-token={token.color}>{token.content}</span
                    >{/each}</span
                >{/each}</code
            >{/snippet}
        </parts.Code>
      </KindScrollAreaContent>
    </KindScrollAreaViewport>
    <KindScrollAreaScrollbar orientation="horizontal">
      <KindScrollAreaThumb />
    </KindScrollAreaScrollbar>
    <KindScrollAreaScrollbar orientation="vertical">
      <KindScrollAreaThumb />
    </KindScrollAreaScrollbar>
  </KindScrollArea>
</parts.Root>
