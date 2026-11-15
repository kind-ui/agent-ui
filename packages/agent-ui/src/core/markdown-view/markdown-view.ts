import { definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { Highlight } from "../code-block/code-block.js";
import { createMarkdownEngine, type MarkdownBlock, type MarkdownEngine } from "../markdown/index.js";

export type MarkdownOptions = {
  /** The markdown so far. Appending re-parses only the blocks that aren't final. */
  source?: string;
  /** Whether `source` is still growing: the last block is repaired and blocks only become final as more follow. Defaults to `false`. */
  streaming?: boolean;
  /** Passed to every code block. */
  highlight?: Highlight;
  /** Parses `source`. Read once, when the view mounts. Defaults to a new `createMarkdownEngine()`; pass one to read its `stats()`. */
  engine?: MarkdownEngine;
};

export type MarkdownState = {
  /** The `engine` option, or the view's own. */
  engine: MarkdownEngine;
  blocks: MarkdownBlock[];
  streaming: boolean;
  highlight: Highlight | undefined;
};

type MarkdownPublic = Pick<MarkdownState, "blocks" | "streaming" | "highlight">;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type MarkdownViewPrimitive = ReturnType<
  typeof definePrimitive<
    MarkdownOptions,
    MarkdownState,
    Record<never, never>,
    { root: SlotDefinition<MarkdownState, Record<never, never>, BaseSlotProps, MarkdownPublic> }
  >
>;

export const markdownViewPrimitive: MarkdownViewPrimitive = definePrimitive({
  name: "kind-markdown",
  options: { source: "string", streaming: "boolean", highlight: "value", engine: "value" },
  state: (options: MarkdownOptions): MarkdownState => {
    const engine = options.engine ?? createMarkdownEngine();
    return {
      engine,
      blocks: engine.set(options.source ?? "", options.streaming ?? false),
      streaming: options.streaming ?? false,
      highlight: options.highlight,
    };
  },
  sync: (options: MarkdownOptions) => ({
    streaming: options.streaming ?? false,
    highlight: options.highlight,
  }),
  api: (context) => {
    const { engine } = context.store.get();
    let { source = "", streaming = false } = context.options();
    context.onOptions((options) => {
      const next = { source: options.source ?? "", streaming: options.streaming ?? false };
      if (next.source === source && next.streaming === streaming) return;
      ({ source, streaming } = next);
      context.store.set({ blocks: engine.set(source, streaming) });
    });
    return {};
  },
  slots: (slot) => ({
    root: slot<BaseSlotProps, MarkdownPublic>({
      state: (state) => ({ blocks: state.blocks, streaming: state.streaming, highlight: state.highlight }),
      attrs: (state) => ({ "data-streaming": state.streaming ? "" : undefined }),
    }),
  }),
});
