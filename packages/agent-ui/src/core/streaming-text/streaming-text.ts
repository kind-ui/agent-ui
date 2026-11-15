import { definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { enter, type MotionMode, resolvedMotion } from "../motion/index.js";
import { streamingTextDiff } from "./diff.js";

export type StreamingTextOptions = {
  /** The text so far. Text that extends the last fades its new part in; any other text replaces it at once. */
  text?: string;
  /** Shows a caret after the text, while it streams. Defaults to `false`. */
  caret?: boolean;
  /** Defaults to `"auto"`, which follows `prefers-reduced-motion`. Reduced and `"none"` append at once. */
  motion?: MotionMode;
};

/** A run of text that arrived at once. `id` keys its element. */
export type StreamingTextChunk = { id: number; text: string };

export type StreamingTextState = {
  text: string;
  chunks: readonly StreamingTextChunk[];
  caret: boolean;
  motion: MotionMode;
};

export type StreamingTextApi = {
  /** Fades a chunk in when it was appended, never one that mounted with the text or replaced it. */
  enterChunk: (el: HTMLElement, id: number) => void;
};

type ChunkProps = { value: number };

type StreamingTextSlot<Props extends object, Public extends object = Record<never, never>> = SlotDefinition<
  StreamingTextState,
  StreamingTextApi,
  Props,
  Public
>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type StreamingTextPrimitive = ReturnType<
  typeof definePrimitive<
    StreamingTextOptions,
    StreamingTextState,
    StreamingTextApi,
    {
      root: StreamingTextSlot<BaseSlotProps, { chunks: readonly StreamingTextChunk[] }>;
      chunk: StreamingTextSlot<ChunkProps & BaseSlotProps>;
      caret: StreamingTextSlot<BaseSlotProps>;
    }
  >
>;

const presentation = (options: StreamingTextOptions) => ({
  caret: options.caret ?? false,
  motion: options.motion ?? "auto",
});

export const streamingTextPrimitive: StreamingTextPrimitive = definePrimitive({
  name: "kind-streaming-text",
  options: { text: "string", caret: "boolean", motion: "string" },
  state: (options: StreamingTextOptions): StreamingTextState => {
    const text = options.text ?? "";
    return { ...presentation(options), text, chunks: text ? [{ id: 0, text }] : [] };
  },
  // `text` reaches state through the diff in `api`, which needs the text before it.
  sync: presentation,
  api: (context): StreamingTextApi => {
    const { store } = context;
    let nextId = 1;
    const appended = new Set<number>();

    context.onOptions((options) => {
      const text = options.text ?? "";
      const { text: previous, chunks } = store.get();
      if (text === previous) return;
      const id = nextId++;
      const diff = streamingTextDiff(previous, text);
      if (diff.kind === "append") {
        appended.add(id);
        store.set({ text, chunks: [...chunks, { id, text: diff.appended }] });
      } else {
        appended.clear();
        store.set({ text, chunks: text ? [{ id, text }] : [] });
      }
    });

    return {
      enterChunk: (el, id) => {
        if (!appended.delete(id)) return;
        const { motion } = store.get();
        if (resolvedMotion(motion) === "full") void enter(el, "fade", { motion });
      },
    };
  },
  slots: (slot) => ({
    root: slot<BaseSlotProps, { chunks: readonly StreamingTextChunk[] }>({
      attrs: (state) => ({ "data-motion": state.motion }),
      state: (state) => ({ chunks: state.chunks }),
    }),
    chunk: slot<ChunkProps>({
      props: { value: "number" },
      bind: (el, { api, props }) => api.enterChunk(el, props.value),
    }),
    caret: slot({
      present: (state) => state.caret,
      attrs: (state) => ({ "aria-hidden": "true", "data-motion": state.motion }),
    }),
  }),
  agent: { actions: [] },
});
