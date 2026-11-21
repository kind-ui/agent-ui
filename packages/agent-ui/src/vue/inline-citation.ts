import {
  type InlineCitationCarouselState,
  type InlineCitationRootState,
  inlineCitationPrimitive,
} from "@kind-ui/agent-ui/core";
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/vue/avatar";
import {
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Carousel as CarouselRoot,
  CarouselViewport,
} from "@ui-sdk/vue/carousel";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slots, type VNode } from "vue";

// Every part is a `span`, so a citation is valid inside a paragraph.
const parts = createParts(inlineCitationPrimitive, {
  root: "span",
  trigger: "button",
  content: "span",
  carousel: "span",
  item: "span",
  link: "a",
  icon: "span",
  host: "span",
  "source-title": "span",
  snippet: "span",
  index: "span",
});

type Scope<State> = { state: State };

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

// Renders a Carousel part as a `span`.
const asSpan = {
  render: ({ props, children }: { props: Record<string, unknown>; children: Component }) => [
    h("span", props, [h(children)]),
  ],
};

// A part whose default slot falls back to `fallback` when the caller fills none.
function withDefault<C extends Component>(part: C, name: string, fallback: (scope: never) => unknown): C {
  const Part = defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part, attrs, { ...slots, default: slots.default ?? fallback } as Slots);
    },
  });
  return Part as unknown as C;
}

/** The marker, which opens the card. Reads the `label` unless you fill its slot. */
export const InlineCitationTrigger = withDefault(
  parts.Trigger,
  "InlineCitationTrigger",
  ({ state }: Scope<{ label: string }>) => state.label,
);

/** The card. Leaves focus on the marker when it opens. */
export const InlineCitationContent = defineComponent({
  name: "InlineCitationContent",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        parts.Content,
        "initialFocus" in attrs || "initial-focus" in attrs ? attrs : { initialFocus: "none", ...attrs },
        slots,
      );
  },
}) as unknown as typeof parts.Content;

/** Links to the source's `url` in a new tab; an `a` without `href`, which is text, when the URL isn't safe. */
export const InlineCitationLink = parts.Link;

/** A UI SDK Avatar of the source's `favicon`, showing a link glyph until it loads or without one. */
export const InlineCitationIcon = withDefault(
  parts.Icon,
  "InlineCitationIcon",
  ({ state }: Scope<{ favicon: string | undefined }>) =>
    h(Avatar, null, () => [
      state.favicon ? h(AvatarImage, { src: state.favicon, alt: "" }) : null,
      h(AvatarFallback),
    ]),
);

/** The host name of the source's `url`, unless you fill its slot. Rendered only with a safe `url`. */
export const InlineCitationHost = withDefault(
  parts.Host,
  "InlineCitationHost",
  ({ state }: Scope<{ host: string }>) => state.host,
);

/** The source's `title`, unless you fill its slot. */
export const InlineCitationSourceTitle = withDefault(
  parts.SourceTitle,
  "InlineCitationSourceTitle",
  ({ state }: Scope<{ title: string }>) => state.title,
);

/** The source's `snippet`, unless you fill its slot. Rendered only with a `snippet`. */
export const InlineCitationSnippet = withDefault(
  parts.Snippet,
  "InlineCitationSnippet",
  ({ state }: Scope<{ snippet: string }>) => state.snippet,
);

/** Which source the card shows, like "1 of 3", unless you fill its slot. */
export const InlineCitationIndex = withDefault(
  parts.Index,
  "InlineCitationIndex",
  ({ state }: Scope<{ text: string }>) => state.text,
);

/**
 * The source whose `id` is `value`. Without a default slot, it shows its icon, title and host name, a link when its
 * `url` is safe, then its snippet.
 */
export const InlineCitationItem = withDefault(parts.Item, "InlineCitationItem", () => [
  h(InlineCitationLink, null, () => [
    h(InlineCitationIcon),
    h(InlineCitationSourceTitle),
    h(InlineCitationHost),
  ]),
  h(InlineCitationSnippet),
]);

// Previous and Next are hidden from agents, which takes the Carousel out of their snapshot: an agent pages with the
// citation's own `next` and `previous`.

/** Shows the previous source. */
export const InlineCitationPrevious = defineComponent({
  name: "InlineCitationPrevious",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        CarouselPrevious,
        { "aria-label": "Previous source", "data-agent-hidden": "", "data-kind-icon-button": "", ...attrs },
        { ...slots, default: slots.default ?? chevronLeft },
      );
  },
}) as unknown as typeof CarouselPrevious;

/** Shows the next source. */
export const InlineCitationNext = defineComponent({
  name: "InlineCitationNext",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        CarouselNext,
        { "aria-label": "Next source", "data-agent-hidden": "", "data-kind-icon-button": "", ...attrs },
        { ...slots, default: slots.default ?? chevronRight },
      );
  },
}) as unknown as typeof CarouselNext;

/**
 * UI SDK's Carousel, a slide per source with Previous, the page and Next below. Rendered only for more than one
 * source. A default slot replaces the slides and controls, inside the Carousel.
 */
export const InlineCitationCarousel = defineComponent({
  name: "InlineCitationCarousel",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Carousel, attrs, {
        ...slots,
        default: ({ state }: Scope<InlineCitationCarouselState>) =>
          h(
            CarouselRoot,
            {
              controller: state.controller,
              defaultPage: state.defaultPage,
              drag: false,
              "aria-label": "Sources",
            },
            {
              ...asSpan,
              default: (): VNode[] =>
                (slots.default?.() as VNode[] | undefined) ?? [
                  h(CarouselViewport, null, {
                    ...asSpan,
                    default: () =>
                      h(CarouselContent, null, {
                        ...asSpan,
                        default: () =>
                          state.ids.map((id) =>
                            h(
                              CarouselItem,
                              { key: id },
                              { ...asSpan, default: () => h(InlineCitationItem, { value: id }) },
                            ),
                          ),
                      }),
                  }),
                  h("span", { "data-inline-citation-controls": "" }, [
                    h(InlineCitationPrevious),
                    h(InlineCitationIndex),
                    h(InlineCitationNext),
                  ]),
                ],
            },
          ),
      });
  },
}) as unknown as typeof parts.Carousel;

/**
 * A marker in running text for the sources a sentence came from, with a card that opens on hover, keyboard focus and
 * press. More than one source pages in the card. Anything in its default slot replaces the marker and the card.
 */
export const InlineCitation = defineComponent({
  name: "InlineCitation",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: Scope<InlineCitationRootState>) => {
            const ids = state.ids;
            return [
              h(InlineCitationTrigger),
              h(InlineCitationContent, null, () =>
                ids.length > 1
                  ? h(InlineCitationCarousel)
                  : ids[0]
                    ? h(InlineCitationItem, { value: ids[0] })
                    : null,
              ),
            ];
          }),
      });
  },
}) as unknown as typeof parts.Root;
