<!-- A code block with its language, a wrap toggle and a copy button. Name it with `aria-label`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import {
    KindScrollArea,
    KindScrollAreaContent,
    KindScrollAreaScrollbar,
    KindScrollAreaThumb,
    KindScrollAreaViewport,
  } from "../internal/scroll-area/index.js";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Root> & {
    /**
     * Shows the language, the wrap toggle and the copy button.
     * @default true
     */
    header?: boolean;
  };

  let { header = true, wrap = $bindable(), ...props }: Props = $props();
</script>

<parts.Root {...props} bind:wrap>
  {#if header}
    <parts.Header>
      <parts.Language>{#snippet children({ language })}{language}{/snippet}</parts.Language>
      <parts.Wrap />
      <parts.Copy />
    </parts.Header>
  {/if}
  <KindScrollArea stickToEnd={props.streaming ?? false}>
    <KindScrollAreaViewport>
      <KindScrollAreaContent>
        <parts.Code>
          {#snippet children({ lines })}<code
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
