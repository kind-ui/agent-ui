import type { Source } from "@kind-ui/agent-ui";
import { sourcesPrimitive } from "@kind-ui/agent-ui/core";
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/vue/avatar";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNode } from "vue";

const parts = createParts(sourcesPrimitive, {
  root: "div",
  trigger: "button",
  content: "div",
  list: "ul",
  item: "li",
  link: "a",
  icon: "span",
  title: "span",
  host: "span",
  snippet: "p",
});

// Slot state is a proxy that answers reads, so fallbacks read each key they need.
type PartState = {
  label: string;
  sources: Source[];
  favicon: string | undefined;
  title: string;
  host: string;
  snippet: string;
};

// A part whose default slot falls back to content built from its state.
function withDefault<C extends Component>(part: C, name: string, fallback: (state: PartState) => unknown) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const fill: Slot = ({ state }) => fallback(state) as VNode[];
      return () => h(part, attrs, { ...slots, default: slots.default ?? fill });
    },
  }) as unknown as C;
}

export const SourcesContent = parts.Content;
export const SourcesLink = parts.Link;

/** Shows and hides the list. Reads the `label`, else "Used N sources", unless you fill the default slot. */
export const SourcesTrigger = withDefault(parts.Trigger, "SourcesTrigger", (state) => state.label);

/** A UI SDK Avatar of the source's `favicon`, showing a link glyph until it loads or without one. */
export const SourcesIcon = withDefault(parts.Icon, "SourcesIcon", (state) => {
  const favicon = state.favicon;
  return h(Avatar, null, () => [
    favicon ? h(AvatarImage, { src: favicon, alt: "" }) : null,
    h(AvatarFallback),
  ]);
});

/** The source's `title`, unless you fill the default slot. */
export const SourcesTitle = withDefault(parts.Title, "SourcesTitle", (state) => state.title);

/** The host name of the source's `url`, unless you fill the default slot. Rendered only with a safe `url`. */
export const SourcesHost = withDefault(parts.Host, "SourcesHost", (state) => state.host);

/** The source's `snippet`, unless you fill the default slot. Rendered only with a `snippet`. */
export const SourcesSnippet = withDefault(parts.Snippet, "SourcesSnippet", (state) => state.snippet);

/** The source whose `id` is `value`. Without a default slot, it shows a link to it and its snippet. */
export const SourcesItem = withDefault(parts.Item, "SourcesItem", () => [
  h(SourcesLink, null, () => [h(SourcesIcon), h(SourcesTitle), h(SourcesHost)]),
  h(SourcesSnippet),
]);

/** An item for each of the `sources`, unless you fill the default slot. */
export const SourcesList = withDefault(parts.List, "SourcesList", (state) =>
  state.sources.map((source) => h(SourcesItem, { key: source.id, value: source.id })),
);

/**
 * The sources a response used, as "Used N sources" that opens a list of links. A default slot replaces the default
 * trigger and content.
 */
export const Sources = withDefault(parts.Root, "Sources", () => [
  h(SourcesTrigger),
  h(SourcesContent, null, () => h(SourcesList)),
]);
