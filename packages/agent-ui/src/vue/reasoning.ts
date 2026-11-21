import { reasoningPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNodeChild } from "vue";
import { Markdown } from "./markdown.js";

const parts = createParts(reasoningPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  content: "div",
});

// A part whose default slot falls back to `fallback`, as React's default `children` do.
const withDefault = <State, Part extends Component = Component>(
  part: Part,
  name: string,
  fallback: (scope: { state: State }) => VNodeChild,
): Part =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part as Component, attrs, { ...slots, default: slots.default ?? (fallback as Slot) });
    },
  }) as unknown as Part;

export const ReasoningTrigger = parts.Trigger;
export const ReasoningIcon = parts.Icon;

/** "Thinking", "Thought for N s" or the `label`, unless you fill the slot. */
export const ReasoningTitle = withDefault<{ title: string }>(
  parts.Title,
  "ReasoningTitle",
  ({ state }) => state.title,
);

/** The `text` as markdown, streaming while the step runs, unless you fill the slot. */
export const ReasoningContent = withDefault<{ text: string; streaming: boolean }>(
  parts.Content,
  "ReasoningContent",
  ({ state }) => h(Markdown, { source: state.text, streaming: state.streaming }),
);

const defaultParts = () => [
  h(ReasoningTrigger, null, () => [h(ReasoningIcon), h(ReasoningTitle)]),
  h(ReasoningContent),
];

/**
 * The model's thinking as a step: "Thinking" while it runs, "Thought for N s" once done, and its `text` as streamed
 * markdown. A default slot replaces the default trigger and content.
 */
export const Reasoning = withDefault(parts.Root, "Reasoning", defaultParts);
