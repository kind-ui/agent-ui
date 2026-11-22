import { type ConversationSearchInputState, conversationSearchPrimitive } from "@kind-ui/agent-ui/core";
import { Input, InputGroup } from "@ui-sdk/vue/input";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h, type Slots, type VNodeChild } from "vue";

const parts = createParts(conversationSearchPrimitive, {
  root: "div",
  input: "div",
  count: "span",
  previous: "button",
  next: "button",
  close: "button",
});

// A part with default children, unless the host passes its own default slot.
const withDefault = <Part extends object>(
  name: string,
  part: Part,
  children: (scope: { state: never }) => VNodeChild,
): Part =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part, attrs, { ...slots, default: slots.default ?? children } as Slots);
    },
  }) as unknown as Part;

/** Moves to the previous match. Its icon is drawn in CSS; render it empty. */
export const ConversationSearchPrevious = parts.Previous;
/** Moves to the next match. Its icon is drawn in CSS; render it empty. */
export const ConversationSearchNext = parts.Next;
/** Closes the bar and moves focus back where it was. Its icon is drawn in CSS; render it empty. */
export const ConversationSearchClose = parts.Close;

/** "3 of 12", or "0 of 0" without a match, while there's a search, unless you fill the default slot. */
export const ConversationSearchCount = withDefault(
  "ConversationSearchCount",
  parts.Count,
  ({ state }: { state: { text: string } }) => state.text,
);

/** The search field with its count, unless you fill the default slot, which gets the state to pass UI SDK Input. */
export const ConversationSearchInput = withDefault(
  "ConversationSearchInput",
  parts.Input,
  ({ state }: { state: ConversationSearchInputState }) =>
    h(InputGroup, null, () => [
      h(Input, {
        type: "search",
        controller: state.controller,
        defaultValue: state.defaultValue,
        "aria-label": state.label,
        "aria-describedby": state.describedBy,
        placeholder: "Find…",
        "data-agent-hidden": "",
      }),
      h(ConversationSearchCount),
    ]),
);

/**
 * A find bar over a Conversation's messages: the field with its count, Previous, Next and Close, unless you fill the
 * default slot. Pass `conversation` the Conversation's controller and wire `@marks-change` to its `marks`.
 */
export const ConversationSearch = withDefault("ConversationSearch", parts.Root, () => [
  h(ConversationSearchInput),
  h(ConversationSearchPrevious),
  h(ConversationSearchNext),
  h(ConversationSearchClose),
]);
