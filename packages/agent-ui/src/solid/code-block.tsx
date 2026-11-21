import { codeBlockPrimitive, type Token } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show } from "solid-js";
import {
  KindScrollArea,
  KindScrollAreaContent,
  KindScrollAreaScrollbar,
  KindScrollAreaThumb,
  KindScrollAreaViewport,
} from "./internal/scroll-area.js";

const parts = createParts(codeBlockPrimitive, {
  root: "div",
  header: "div",
  language: "span",
  wrap: "button",
  copy: "button",
  code: "pre",
});

const tokenStyle = (token: Token): JSX.CSSProperties | undefined =>
  token.color ? { "--kind-code-block-token": token.color } : undefined;

export type CodeBlockProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  /**
   * Shows the language, the wrap toggle and the copy button.
   * @default true
   */
  header?: boolean;
};

/** A code block with its language, a wrap toggle and a copy button. Name it with `aria-label`. */
export function CodeBlock(props: CodeBlockProps) {
  return (
    <parts.Root {...omit(props, "header")}>
      <Show when={props.header !== false}>
        <parts.Header>
          <parts.Language>{(state) => state.language}</parts.Language>
          <parts.Wrap />
          <parts.Copy />
        </parts.Header>
      </Show>
      <KindScrollArea stickToEnd={props.streaming ?? false}>
        <KindScrollAreaViewport>
          <KindScrollAreaContent>
            <parts.Code>
              {(state) => (
                <code>
                  {/* Keyed by place, so a streamed chunk updates the last line in place. */}
                  <For each={state.lines} keyed={false}>
                    {(line) => (
                      <span data-line="">
                        <For each={line()} keyed={false}>
                          {(token) => (
                            <span data-font-style={token().fontStyle} style={tokenStyle(token())}>
                              {token().content}
                            </span>
                          )}
                        </For>
                      </span>
                    )}
                  </For>
                </code>
              )}
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
  );
}
