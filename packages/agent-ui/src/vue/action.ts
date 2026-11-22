import { type ActionState, actionPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNode } from "vue";
import { Markdown } from "./markdown.js";

// `$stable` tells Vue these slots never change, so a part that renders again doesn't render the parts inside it.
const stable = (slot: () => unknown) => ({ default: slot, $stable: true });

const parts = createParts(actionPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  content: "div",
  quote: "blockquote",
  result: "div",
});

// A part whose default slot falls back to content built from its state.
function withDefault<C extends Component>(
  part: C,
  name: string,
  fallback: (state: ActionState & { streaming: boolean }) => unknown,
) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const fill: Slot = ({ state }) => fallback(state) as VNode[];
      return () => h(part, attrs, { ...slots, default: slots.default ?? fill });
    },
  }) as unknown as C;
}

export const ActionTrigger = parts.Trigger;
export const ActionIcon = parts.Icon;
export const ActionContent = parts.Content;

/** The `label`, else "Action", unless you fill the default slot. */
export const ActionTitle = withDefault(parts.Title, "ActionTitle", (state) => state.title);

/** The `quote`, unless you fill the default slot. */
export const ActionQuote = withDefault(parts.Quote, "ActionQuote", (state) => state.quote);

/** The `result` as markdown, streaming while the action runs, unless you fill the default slot. */
export const ActionResult = withDefault(parts.Result, "ActionResult", (state) =>
  h(Markdown, { source: state.result, streaming: state.streaming }),
);

/**
 * An action run on selected text, as a step: its `label`, the `quote` it ran on and its `result` as streamed markdown.
 * A default slot replaces the default trigger and content.
 */
export const Action = withDefault(parts.Root, "Action", () => [
  h(
    ActionTrigger,
    null,
    stable(() => [h(ActionIcon), h(ActionTitle)]),
  ),
  h(
    ActionContent,
    null,
    stable(() => [h(ActionQuote), h(ActionResult)]),
  ),
]);
