import {
  type ActionDetails,
  announce,
  type ChangeDetails,
  createChange,
  definePrimitive,
  dispatch,
  openAttrs,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { actionSource } from "../action-source.js";
import { createCopy } from "../clipboard.js";
import type { Highlight } from "../code-block/index.js";
import type { MotionMode } from "../motion/index.js";
import { createPendingAction } from "../pending.js";
import { holdTransitions } from "../step/base.js";

/** How a document's `content` shows: through Markdown, through Code Block, or as wrapped plain text. */
export type DocumentFormat = "markdown" | "code" | "text";

/** A format the host can download the document as, like `{ id: "md", label: "Markdown" }`. */
export type DocumentDownload = { id: string; label: string };

/** What expanded or collapsed the preview: Show more, or a call to the api or an agent. */
export type DocumentOpenChangeReason = "trigger-press" | "imperative";

export type DocumentOptions = {
  /**
   * The document's title, which also names it.
   * @default "Document"
   */
  label?: string;
  /**
   * The document's source: markdown, code or plain text, as `format` says.
   * @default ""
   */
  content?: string;
  /**
   * How `content` shows: `"markdown"` through Markdown, `"code"` through Code Block, `"text"` as wrapped plain text.
   * @default "markdown"
   */
  format?: DocumentFormat;
  /** The code's language, like `"ts"`, shown beside the title and passed to `highlight`. For `"code"`. */
  language?: string;
  /** Resolves colored tokens for code, as Code Block's `highlight` does. */
  highlight?: Highlight;
  /**
   * Whether `content` is still arriving. The preview grows up to its collapsed height, then follows the end.
   * @default false
   */
  streaming?: boolean;
  /**
   * The formats `onDownload` offers. With more than one, each has its own button; with one or none, one Download.
   * @default []
   */
  downloads?: DocumentDownload[];
  /**
   * Called with the chosen download's `id`, or `undefined` without `downloads`. Shows Download while set. The host
   * builds and saves the file; return a promise to keep Download pending until it settles.
   */
  onDownload?: (formatId: string | undefined, details: ActionDetails) => unknown;
  /** Called before `content` is copied. Cancel it to copy something else yourself. */
  onCopy?: (content: string, details: ChangeDetails<"copy-press" | "imperative">) => void;
  /** Whether the preview shows in full rather than up to `--kind-document-max-height`. Passing it controls it. */
  open?: boolean;
  /**
   * Whether the preview shows in full at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the preview expands or collapses, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<DocumentOpenChangeReason>) => void;
  /**
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type DocumentState = {
  /** The `label`, else "Document". */
  label: string;
  /** The `content` option, `""` without one. */
  content: string;
  /** The `format` option, `"markdown"` without one. */
  format: DocumentFormat;
  /** The `language` option, for `"code"`. */
  language: string | undefined;
  /** The `highlight` option. */
  highlight: Highlight | undefined;
  /** The `streaming` option. */
  streaming: boolean;
  /** What the document is and its size, like "Markdown · 2.4 kB" or "ts · 512 bytes". */
  meta: string;
  downloads: DocumentDownload[];
  /** Whether `onDownload` is set. */
  canDownload: boolean;
  /** Whether a promise `onDownload` returned is still pending. Agents wait on it. */
  pending: boolean;
  /** Whether the preview shows in full. */
  open: boolean;
  /** Whether the content is taller than the collapsed preview. */
  overflowing: boolean;
  /** Whether Copy wrote `content`, for two seconds after it did. */
  copied: boolean;
  /** The `motion` option, `"auto"` without one. */
  motion: MotionMode;
};

export type DocumentApi = {
  /** Whether the preview shows in full; the owner's `open` when controlled. */
  isOpen: () => boolean;
  /** Shows the preview in full or collapses it. Returns whether the change was accepted. */
  setOpen: (open: boolean) => boolean;
  /** Shows the preview in full. Offered while it's collapsed and overflowing. */
  readonly expand: (() => boolean) | undefined;
  /** Collapses the preview. Offered while it shows in full and overflows when collapsed. */
  readonly collapse: (() => boolean) | undefined;
  /** Expands a collapsed preview and collapses an expanded one, as Show more does. */
  toggle: (event?: Event) => boolean;
  /** Copies `content` and resolves with whether it worked. */
  copy: (event?: Event) => Promise<boolean>;
  /**
   * Calls `onDownload` with a format's `id`, the first one's when left out. Offered while `onDownload` is set and no
   * download is pending; refuses an `id` that isn't in `downloads`.
   */
  readonly download: ((formatId?: string, event?: Event) => void) | undefined;
  /** The `downloads`, for agents. */
  getDownloads: () => DocumentDownload[];
  /** Measures the content against the collapsed height. Called by the content slot. */
  bindContent: (el: HTMLElement) => () => void;
};

type DownloadProps = { value?: string };

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<DocumentState, DocumentApi, Props, Public>;

/** What the content part renders from. */
export type DocumentContentState = Pick<
  DocumentState,
  "format" | "content" | "language" | "highlight" | "streaming"
>;

type DocumentSlots = {
  root: Slot;
  header: Slot;
  title: Slot<BaseSlotProps, { label: string }>;
  meta: Slot<BaseSlotProps, { meta: string }>;
  toolbar: Slot<BaseSlotProps, { downloads: DocumentDownload[]; canDownload: boolean }>;
  copy: Slot;
  download: Slot<DownloadProps & BaseSlotProps, { label: string | undefined }>;
  body: Slot<BaseSlotProps, { streaming: boolean }>;
  content: Slot<BaseSlotProps, DocumentContentState>;
  expand: Slot<BaseSlotProps, { label: string }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type DocumentPrimitive = ReturnType<
  typeof definePrimitive<DocumentOptions, DocumentState, DocumentApi, DocumentSlots>
>;

const FORMAT_NAMES: Record<DocumentFormat, string> = { markdown: "Markdown", code: "Code", text: "Text" };

const BYTES = new Intl.NumberFormat("en", { style: "unit", unit: "byte", unitDisplay: "long" });
const KILOBYTES = new Intl.NumberFormat("en", { style: "unit", unit: "kilobyte", maximumFractionDigits: 1 });
const MEGABYTES = new Intl.NumberFormat("en", { style: "unit", unit: "megabyte", maximumFractionDigits: 1 });

/** The UTF-8 size of `text`, like "512 bytes" or "2.4 kB", counted without encoding it. */
export const documentSize = (text: string): string => {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.codePointAt(i) as number;
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
    if (code >= 0x10000) i++;
  }
  if (bytes < 1000) return BYTES.format(bytes);
  // Past 999.9 kB, which would round to "1,000 kB".
  if (bytes < 999_950) return KILOBYTES.format(bytes / 1000);
  return MEGABYTES.format(bytes / 1_000_000);
};

const noDownloads: DocumentDownload[] = [];

const presentation = (options: DocumentOptions) => {
  const format = options.format ?? "markdown";
  const content = options.content ?? "";
  const kind = (format === "code" && options.language) || FORMAT_NAMES[format];
  return {
    label: options.label || "Document",
    content,
    format,
    language: options.language,
    highlight: options.highlight,
    streaming: options.streaming ?? false,
    meta: `${kind} · ${documentSize(content)}`,
    downloads: options.downloads ?? noDownloads,
    canDownload: options.onDownload !== undefined,
    motion: options.motion ?? "auto",
  };
};

const downloadLabel = (downloads: DocumentDownload[], value: string | undefined) =>
  downloads.length > 1 ? downloads.find(({ id }) => id === value)?.label : undefined;

export const documentPrimitive: DocumentPrimitive = definePrimitive<
  DocumentOptions,
  DocumentState,
  DocumentApi,
  DocumentSlots
>({
  name: "kind-document",
  options: {
    label: "string",
    content: "string",
    format: "string",
    language: "string",
    highlight: "value",
    streaming: "boolean",
    downloads: "value",
    onDownload: "action",
    onCopy: "callback",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    motion: "string",
  },
  state: (options) => ({
    ...presentation(options),
    open: options.open ?? options.defaultOpen ?? false,
    overflowing: false,
    pending: false,
    copied: false,
  }),
  sync: (options) => ({
    ...presentation(options),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["open"],
  api: (context) => {
    const { store } = context;
    const change = createChange(context);
    const copy = createCopy(context);
    const pendingDownload = createPendingAction(context, { state: "pending" });
    const setOpen = (open: boolean, event?: Event) =>
      change("open", open, event ? { reason: "trigger-press", event } : { reason: "imperative" });
    const download = (formatId?: string, event?: Event) => {
      const { onDownload } = context.options();
      const { downloads } = store.get();
      const id = formatId ?? downloads[0]?.id;
      if (!onDownload || (id !== undefined && !downloads.some((each) => each.id === id))) return;
      const details = { source: actionSource(event, "download-press") };
      void pendingDownload
        .run(() => onDownload(id, details))
        ?.then((outcome) => {
          if (outcome === "failed") announce("Download failed", { priority: "polite" });
        });
    };
    return {
      isOpen: () => store.get().open,
      setOpen: (open) => setOpen(open),
      get expand() {
        const { open, overflowing } = store.get();
        return overflowing && !open ? () => setOpen(true) : undefined;
      },
      get collapse() {
        const { open, overflowing } = store.get();
        return overflowing && open ? () => setOpen(false) : undefined;
      },
      toggle: (event) => setOpen(!store.get().open, event),
      copy: async (event) => {
        const { content } = store.get();
        if (
          dispatch(
            context,
            "onCopy",
            content,
            event ? { reason: "copy-press", event } : { reason: "imperative" },
          )
        )
          return false;
        return copy(content);
      },
      get download() {
        const { canDownload, pending } = store.get();
        return canDownload && !pending ? download : undefined;
      },
      getDownloads: () => store.get().downloads,
      bindContent: (el) => {
        // `document.css` registers `--kind-document-max-height` as a `<length>`, so it reads in pixels.
        const measure = () => {
          const height = el.offsetHeight;
          const limit = Number.parseFloat(
            getComputedStyle(el).getPropertyValue("--kind-document-max-height"),
          );
          context.element("body")?.style.setProperty("--kind-document-content-height", `${height}px`);
          const overflowing = height > limit + 1;
          if (overflowing !== store.get().overflowing) store.set({ overflowing });
        };
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "region",
      attrs: (state, part) => ({
        "aria-labelledby": `${part.id}-title`,
        "data-format": state.format,
        ...openAttrs(state.open),
      }),
      bind: holdTransitions,
    }),
    header: slot({}),
    title: slot<BaseSlotProps, { label: string }>({
      state: (state) => ({ label: state.label }),
      attrs: (_state, part) => ({ id: `${part.id}-title` }),
    }),
    meta: slot<BaseSlotProps, { meta: string }>({
      state: (state) => ({ meta: state.meta }),
    }),
    toolbar: slot<BaseSlotProps, { downloads: DocumentDownload[]; canDownload: boolean }>({
      state: (state) => ({ downloads: state.downloads, canDownload: state.canDownload }),
    }),
    // Copy and Download wrap UI SDK toolbar buttons and hear their clicks bubble up (spec §2, composing UI SDK).
    copy: slot({
      attrs: (state) => ({ "data-copied": state.copied ? "" : undefined }),
      on: { click: (event, { api }) => void api.copy(event) },
    }),
    download: slot<DownloadProps & BaseSlotProps, { label: string | undefined }>({
      props: { value: "string" },
      present: (state) => state.canDownload,
      state: (state, { props }) => ({ label: downloadLabel(state.downloads, props.value) }),
      attrs: (state) => ({
        "data-pending": state.pending ? "" : undefined,
      }),
      on: { click: (event, { api, props }) => api.download?.(props.value, event) },
    }),
    body: slot<BaseSlotProps, { streaming: boolean }>({
      state: (state) => ({ streaming: state.streaming }),
      attrs: (state, part) => ({
        id: `${part.id}-body`,
        "data-motion": state.motion,
        "data-streaming": state.streaming ? "" : undefined,
        "data-overflowing": state.overflowing ? "" : undefined,
        ...openAttrs(state.open),
      }),
    }),
    content: slot<BaseSlotProps, DocumentContentState>({
      state: ({ format, content, language, highlight, streaming }) => ({
        format,
        content,
        language,
        highlight,
        streaming,
      }),
      attrs: (state) => ({ "data-format": state.format }),
      bind: (el, { api }) => api.bindContent(el),
    }),
    expand: slot<BaseSlotProps, { label: string }>({
      role: "button",
      focus: "native",
      present: (state) => state.overflowing,
      press: ({ api }, event) => api.toggle(event),
      state: (state) => ({ label: state.open ? "Show less" : "Show more" }),
      attrs: (state, part) => ({
        type: "button",
        "data-kind-button": "secondary",
        "data-kind-size": "sm",
        "aria-expanded": String(state.open),
        "aria-controls": `${part.id}-body`,
        ...openAttrs(state.open),
      }),
    }),
  }),
  agent: {
    actions: ["copy", "download", "expand", "collapse"],
    items: (api: DocumentApi) => api.getDownloads().map(({ id, label }) => ({ value: id, label })),
    closed: true,
  },
});
