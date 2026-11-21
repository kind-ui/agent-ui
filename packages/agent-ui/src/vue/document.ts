import {
  type DocumentDownload as DocumentDownloadEntry,
  documentPrimitive,
  type Highlight,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type Slots, type VNode } from "vue";
import { CodeBlock } from "./code-block.js";
import {
  KindScrollArea,
  KindScrollAreaContent,
  KindScrollAreaScrollbar,
  KindScrollAreaThumb,
  KindScrollAreaViewport,
} from "./internal/scroll-area.js";
import { KindToolbar, KindToolbarButton } from "./internal/toolbar.js";
import { Markdown } from "./markdown.js";

const parts = createParts(documentPrimitive, {
  root: "div",
  header: "div",
  title: "span",
  meta: "span",
  toolbar: "div",
  copy: "span",
  download: "span",
  body: "div",
  content: "div",
  expand: "button",
});

// A part whose default slot falls back to content built from its state.
function withDefault<C extends Component, State>(part: C, name: string, fallback: (state: State) => unknown) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const fill: Slot = ({ state }) => fallback(state) as VNode[];
      return () => h(part, attrs, { ...slots, default: slots.default ?? fill } as Slots);
    },
  }) as unknown as C;
}

/** Holds the title, the meta line and the toolbar. */
export const DocumentHeader = parts.Header;

/** The `label`, unless you fill the default slot. */
export const DocumentTitle = withDefault(
  parts.Title,
  "DocumentTitle",
  (state: { label: string }) => state.label,
);

/** What the document is and its size, like "Markdown · 2.4 kB", unless you fill the default slot. */
export const DocumentMeta = withDefault(parts.Meta, "DocumentMeta", (state: { meta: string }) => state.meta);

/** Copies the `content`. Wraps a `KindToolbarButton` named "Copy", unless you fill the default slot. */
export const DocumentCopy = withDefault(parts.Copy, "DocumentCopy", () =>
  h(KindToolbarButton, { "aria-label": "Copy" }),
);

/**
 * Calls `onDownload` with its `value`, a download's `id`. Wraps a `KindToolbarButton` named "Download", or showing
 * the download's `label` when there are several, unless you fill the default slot.
 */
export const DocumentDownload = withDefault(
  parts.Download,
  "DocumentDownload",
  (state: { label: string | undefined }) => {
    const label = state.label;
    return h(
      KindToolbarButton,
      { "aria-label": label ? `Download ${label}` : "Download" },
      label ? () => h("span", { "data-document-download-label": "" }, label) : undefined,
    );
  },
);

/** A `KindToolbar` with Copy and a Download for each of the `downloads`, unless you fill the default slot. */
export const DocumentToolbar = withDefault(
  parts.Toolbar,
  "DocumentToolbar",
  (state: { downloads: DocumentDownloadEntry[]; canDownload: boolean }) => {
    const { downloads, canDownload } = state;
    return h(KindToolbar, { "aria-label": "Document actions" }, () => [
      h(DocumentCopy),
      canDownload &&
        (downloads.length > 1
          ? downloads.map(({ id }) => h(DocumentDownload, { key: id, value: id }))
          : h(DocumentDownload, { value: downloads[0]?.id })),
    ]);
  },
);

type ContentState = {
  format: "markdown" | "code" | "text";
  content: string;
  language: string | undefined;
  highlight: Highlight | undefined;
  streaming: boolean;
};

/**
 * The `content` as its `format` says: Markdown, a Code Block without its header, or wrapped plain text, unless you
 * fill the default slot.
 */
export const DocumentContent = withDefault(parts.Content, "DocumentContent", (state: ContentState) => {
  const { format, content, language, highlight, streaming } = state;
  if (format === "markdown") return h(Markdown, { source: content, streaming, highlight });
  if (format === "code")
    return h(CodeBlock, { header: false, code: content, language, streaming, highlight });
  return h("pre", content);
});

/** "Show more", or "Show less" while expanded. Rendered only while the content overflows the preview. */
export const DocumentExpand = withDefault(
  parts.Expand,
  "DocumentExpand",
  (state: { label: string }) => state.label,
);

const scrollContent = () => [
  h(KindScrollAreaViewport, null, () => h(KindScrollAreaContent, null, () => h(DocumentContent))),
  h(KindScrollAreaScrollbar, null, () => h(KindScrollAreaThumb)),
];

/** The preview: a `KindScrollArea` holding the content, followed by Show more, unless you fill the default slot. */
export const DocumentBody = withDefault(parts.Body, "DocumentBody", (state: { streaming: boolean }) => [
  h(KindScrollArea, { stickToEnd: state.streaming }, scrollContent),
  h(DocumentExpand),
]);

const defaultParts = () => [
  h(DocumentHeader, null, () => [h(DocumentTitle), h(DocumentMeta), h(DocumentToolbar)]),
  h(DocumentBody),
];

/**
 * A document as a card: its title, kind and size, Copy and Download, and a preview that expands. A filled default
 * slot replaces the default header and body.
 */
export const Document = withDefault(parts.Root, "Document", defaultParts);
