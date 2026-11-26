import type { SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { definePrimitive } from "../define-primitive.js";
import { enter, type MotionMode, resolvedMotion } from "../motion/index.js";
import { streamingTextDiff } from "./diff.js";

export type StreamingTextOptions = {
  /**
   * The whole text so far: text that extends the last fades its new part in, and any other text replaces it at once.
   * @default ""
   */
  text?: string;
  /**
   * Shows a caret after the text, for while it streams.
   * @default false
   */
  caret?: boolean;
  /**
   * Whether new text fades in: `"auto"` follows `prefers-reduced-motion`, and `"reduced"` or `"none"` append it at once.
   * @default "auto"
   */
  motion?: MotionMode;
};

/** A run of text: one still fading in, or everything before those, folded into one. `id` keys its element. */
export type StreamingTextChunk = { id: number; text: string };

export type StreamingTextState = {
  text: string;
  chunks: readonly StreamingTextChunk[];
  caret: boolean;
  motion: MotionMode;
};

export type StreamingTextApi = {
  /** Fades a chunk in when it was appended at full motion, never one that mounted with the text or replaced it. */
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
    // Chunks still fading in. Every chunk before the first of them folds into one, so parts stay few.
    const fading = new Set<number>();
    // A part can bind twice (React StrictMode); its entrance plays once.
    const entering = new Set<number>();
    const settled = (chunks: readonly StreamingTextChunk[]) => {
      const end = chunks.findIndex((chunk) => fading.has(chunk.id));
      const count = end === -1 ? chunks.length : end;
      if (count < 2) return chunks;
      const [first] = chunks as [StreamingTextChunk];
      const text = chunks
        .slice(0, count)
        .map((chunk) => chunk.text)
        .join("");
      return [{ id: first.id, text }, ...chunks.slice(count)];
    };

    context.onOptions((options) => {
      const text = options.text ?? "";
      const { text: previous, chunks, motion } = store.get();
      if (text === previous) return;
      const id = nextId++;
      const diff = streamingTextDiff(previous, text);
      if (diff.kind === "append") {
        if (resolvedMotion(motion) === "full") fading.add(id);
        store.set({ text, chunks: [...settled(chunks), { id, text: diff.appended }] });
      } else {
        fading.clear();
        entering.clear();
        store.set({ text, chunks: text ? [{ id, text }] : [] });
      }
    });

    return {
      enterChunk: (el, id) => {
        if (!fading.has(id) || entering.has(id)) return;
        entering.add(id);
        void enter(el, "fade", { motion: store.get().motion }).then(() => {
          fading.delete(id);
          entering.delete(id);
        });
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
