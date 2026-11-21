import { type StreamingTextState, streamingTextPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

const parts = createParts(streamingTextPrimitive, { root: "span", chunk: "span", caret: "span" });

/** Streamed plain text: each appended chunk fades in, and `caret` shows a caret after it. */
export const StreamingText = defineComponent({
  name: "StreamingText",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default: ({ state }: { state: StreamingTextState }) => [
          ...state.chunks.map((chunk) =>
            h(parts.Chunk, { key: chunk.id, value: chunk.id }, () => chunk.text),
          ),
          h(parts.Caret),
        ],
      });
  },
}) as unknown as typeof parts.Root;
