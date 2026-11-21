import { codeBlockPrimitive, type Token } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";
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

const tokenStyle = (token: Token) => (token.color ? { "--kind-code-block-token": token.color } : undefined);

const code = () =>
  h(parts.Code, null, {
    default: ({ state }: { state: { lines: Token[][] } }) =>
      h(
        "code",
        state.lines.map((line, index) =>
          h(
            "span",
            { key: index, "data-line": "" },
            line.map((token, at) =>
              h(
                "span",
                { key: at, "data-font-style": token.fontStyle, style: tokenStyle(token) },
                token.content,
              ),
            ),
          ),
        ),
      ),
  });

const scrollContent = () => [
  h(KindScrollAreaViewport, null, () => h(KindScrollAreaContent, null, code)),
  h(KindScrollAreaScrollbar, { orientation: "horizontal" }, () => h(KindScrollAreaThumb)),
  h(KindScrollAreaScrollbar, { orientation: "vertical" }, () => h(KindScrollAreaThumb)),
];

/** A code block with its language, a wrap toggle and a copy button. Name it with `aria-label`. */
export const CodeBlock = defineComponent({
  name: "CodeBlock",
  inheritAttrs: false,
  props: {
    /** Shows the language, the wrap toggle and the copy button. */
    header: { type: Boolean, default: true },
    streaming: { type: Boolean, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        parts.Root,
        { ...attrs, streaming: props.streaming },
        {
          ...slots,
          default: () => [
            props.header &&
              h(parts.Header, null, () => [
                h(parts.Language, null, {
                  default: ({ state }: { state: { language: string | undefined } }) => state.language,
                }),
                h(parts.Wrap),
                h(parts.Copy),
              ]),
            h(KindScrollArea, { stickToEnd: props.streaming ?? false }, scrollContent),
          ],
        },
      );
  },
});
