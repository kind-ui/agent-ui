import { markdownTablePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";
import {
  KindScrollArea,
  KindScrollAreaContent,
  KindScrollAreaScrollbar,
  KindScrollAreaThumb,
  KindScrollAreaViewport,
} from "./internal/scroll-area.js";

const parts = createParts(markdownTablePrimitive, {
  root: "div",
  header: "div",
  copy: "button",
  table: "table",
});

/**
 * A table with a copy button; its default slot holds the `thead` and `tbody`. Name it with `aria-label`. Set
 * `--kind-markdown-table-columns` to the column count so it scrolls sideways rather than squeezing its columns.
 */
export const MarkdownTable = defineComponent({
  name: "MarkdownTable",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default: () => [
          h(parts.Header, null, () => h(parts.Copy)),
          h(KindScrollArea, null, () => [
            h(KindScrollAreaViewport, null, () =>
              h(KindScrollAreaContent, null, () => h(parts.Table, null, () => slots.default?.())),
            ),
            h(KindScrollAreaScrollbar, { orientation: "horizontal" }, () => h(KindScrollAreaThumb)),
          ]),
        ],
      });
  },
});
