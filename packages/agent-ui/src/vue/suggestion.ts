import {
  type SuggestionItemState,
  type SuggestionRootState,
  suggestionPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h } from "vue";
import {
  KindCarousel,
  KindCarouselContent,
  KindCarouselItem,
  KindCarouselNext,
  KindCarouselPrevious,
  KindCarouselViewport,
} from "./internal/carousel.js";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onPick`, whose presence makes the chips pickable, is declared a function prop instead, which `@pick` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => suggestionPrimitive(options), suggestionPrimitive, {
    options: { ...suggestionPrimitive.options, onPick: "action" },
  }),
  "name",
  { value: suggestionPrimitive.name },
) as typeof suggestionPrimitive;

const parts = createParts(primitive, { root: "div", item: "button" });

// Lucide "chevron-left" and "chevron-right", see THIRD_PARTY_NOTICES.md.
const chevron = (d: string) => () =>
  h(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "aria-hidden": "true",
    },
    [h("path", { d, "stroke-linecap": "round", "stroke-linejoin": "round" })],
  );
const chevronLeft = chevron("m15 18-6-6 6-6");
const chevronRight = chevron("m9 18 6-6-6-6");

/**
 * A row of prompts a person can send in one press. It scrolls sideways when the prompts don't fit, with Previous and
 * Next beside it, or wraps onto more lines with `layout="wrap"`. Anything in its default slot replaces the row and its
 * buttons: `SuggestionItem`s inside the Carousel, or `SuggestionChip`s when it wraps.
 */
export const Suggestion = defineComponent({
  name: "Suggestion",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default: ({ state }: { state: SuggestionRootState }) =>
          state.layout === "wrap"
            ? (slots.default?.() ??
              state.suggestions.map((suggestion) =>
                h(SuggestionChip, { key: suggestion.id, value: suggestion.id }),
              ))
            : h(KindCarousel, { "aria-label": state.label, slidesPerPage: "auto", dragFree: true }, () =>
                slots.default
                  ? slots.default()
                  : [
                      h(SuggestionViewport, null, () =>
                        state.suggestions.map((suggestion) =>
                          h(SuggestionItem, { key: suggestion.id, value: suggestion.id }),
                        ),
                      ),
                      h(SuggestionControls),
                    ],
              ),
      });
  },
}) as unknown as typeof parts.Root;

/** The row that scrolls, holding the suggestions. */
export const SuggestionViewport = defineComponent({
  name: "SuggestionViewport",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(KindCarouselViewport, attrs, {
        ...slots,
        default: () => h(KindCarouselContent, null, () => slots.default?.()),
      });
  },
}) as unknown as typeof KindCarouselViewport;

/** A suggestion's button, whose `value` is its `id`. Reads its label and description unless you fill its slot. */
export const SuggestionChip = defineComponent({
  name: "SuggestionChip",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Item as Component, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: { state: SuggestionItemState }) => [
            h("span", { "data-suggestion-label": "" }, state.label),
            ...(state.description !== undefined
              ? [" ", h("span", { "data-suggestion-description": "" }, state.description)]
              : []),
          ]),
      });
  },
}) as unknown as typeof parts.Item;

/** A suggestion in the Carousel: a `SuggestionChip` in its slide. */
export const SuggestionItem = defineComponent({
  name: "SuggestionItem",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(KindCarouselItem, null, () => h(SuggestionChip as Component, attrs, slots));
  },
}) as unknown as typeof parts.Item;

/** Holds Previous and Next, unless you fill its slot, and hides them while every suggestion fits. */
export const SuggestionControls = defineComponent({
  name: "SuggestionControls",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        "div",
        { "data-suggestion-controls": "", ...attrs },
        slots.default?.() ?? [h(SuggestionPrevious), h(SuggestionNext)],
      );
  },
});

// Previous and Next are hidden from agents, which takes the Carousel out of their snapshot: an agent picks any
// suggestion by its id with the Suggestion's own `pick`, wherever it has scrolled.

/** Scrolls back to earlier suggestions. Put it in `SuggestionControls` to hide it while every suggestion fits. */
export const SuggestionPrevious = defineComponent({
  name: "SuggestionPrevious",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        KindCarouselPrevious,
        { "aria-label": "Previous suggestions", "data-agent-hidden": "", ...attrs },
        { ...slots, default: slots.default ?? chevronLeft },
      );
  },
}) as unknown as typeof KindCarouselPrevious;

/** Scrolls on to later suggestions. Put it in `SuggestionControls` to hide it while every suggestion fits. */
export const SuggestionNext = defineComponent({
  name: "SuggestionNext",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        KindCarouselNext,
        { "aria-label": "Next suggestions", "data-agent-hidden": "", ...attrs },
        { ...slots, default: slots.default ?? chevronRight },
      );
  },
}) as unknown as typeof KindCarouselNext;
