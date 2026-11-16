import {
  type ChangeDetails,
  createChange,
  definePrimitive,
  hiddenAttrs,
  openAttrs,
  type SlotDefinition,
  selects,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { Source } from "../../types/index.js";
import { sanitizeUrl } from "../markdown/index.js";
import { memo } from "../memo.js";
import { enter, type MotionMode } from "../motion/index.js";
import { bindStepPanel, holdTransitions } from "../step/base.js";

export type SourcesOpenChangeReason = "trigger-press" | "find-in-page" | "imperative";

export type SourcesOptions = {
  /** The sources, in order. Keep each one's `id` as the list grows. Defaults to none. */
  sources?: Source[];
  /** The trigger's text, which also names the list. Defaults to "Used N sources". */
  label?: string;
  /** Whether the list shows. Passing it controls it: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the list shows at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the list opens or closes, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<SourcesOpenChangeReason>) => void;
  /**
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

/** A source as the list shows it. */
export type SourceEntry = {
  title: string;
  /** The `url` when it's safe to link to (`http`, `https`, `mailto` or relative), else `undefined`. */
  url: string | undefined;
  /** The URL's host name without `www.`, or empty. */
  host: string;
  snippet: string;
  /** The `favicon` when it's a safe URL, else `undefined`. */
  favicon: string | undefined;
  /** The first letter of the host name, else of the title, which the icon shows until a `favicon` loads. */
  initial: string;
};

export type SourcesState = {
  /** The `sources` option. */
  sources: Source[];
  /** Each source as the list shows it, by id, so a source's update reaches only its own parts. */
  entries: Record<string, SourceEntry>;
  /** The `label`, else "Used N sources". */
  label: string;
  /** Whether the list shows. */
  open: boolean;
  /** Whether the list is closing and still shown while its exit plays. */
  exiting: boolean;
  motion: MotionMode;
};

export type SourcesApi = {
  /** Whether the list shows; the owner's `open` when controlled. */
  isOpen: () => boolean;
  /** Shows or hides the list. Returns whether the change was accepted. */
  setOpen: (open: boolean) => boolean;
  /** Shows the list. Offered while it's hidden. Returns whether the change was accepted. */
  readonly expand: (() => boolean) | undefined;
  /** Hides the list. Offered while it shows. Returns whether the change was accepted. */
  readonly collapse: (() => boolean) | undefined;
  /** Shows a hidden list and hides a shown one, as the trigger does. Returns whether the change was accepted. */
  toggle: (event?: Event) => boolean;
  /** Opens the list for find in page. Called by the content slot. */
  reveal: (event: Event) => void;
  /** Plays a source's entrance when it arrives after the first frame. Called by the item slot. */
  bindItem: (el: HTMLElement, id: string) => void;
  /** Starts counting sources as new after the first frame. Called by the root slot. */
  bindRoot: (el: HTMLElement) => () => void;
};

type ItemProps = { value: string };
type ItemPartProps = { value?: string };

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<SourcesState, SourcesApi, Props, Public>;
type ItemSlot<Public extends object = Record<never, never>> = Slot<ItemPartProps & BaseSlotProps, Public>;

type SourcesSlots = {
  root: Slot;
  trigger: Slot<BaseSlotProps, { label: string }>;
  content: Slot;
  list: Slot<BaseSlotProps, { sources: Source[] }>;
  item: Slot<ItemProps & BaseSlotProps>;
  link: ItemSlot;
  icon: ItemSlot<{ favicon: string | undefined; initial: string }>;
  title: ItemSlot<{ title: string }>;
  host: ItemSlot<{ host: string }>;
  snippet: ItemSlot<{ snippet: string }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type SourcesPrimitive = ReturnType<
  typeof definePrimitive<SourcesOptions, SourcesState, SourcesApi, SourcesSlots>
>;

const hostName = (url: string | undefined): string => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** A source as the list shows it: its URLs only when safe, and the host name and initial read from them. */
const sourceEntry = (source: Source): SourceEntry => {
  const url = (source.url && sanitizeUrl(source.url)) || undefined;
  const host = hostName(url);
  return {
    title: source.title,
    url,
    host,
    snippet: source.snippet ?? "",
    favicon: (source.favicon && sanitizeUrl(source.favicon)) || undefined,
    initial: [...(host || source.title.trim())][0]?.toUpperCase() ?? "?",
  };
};

const noSources: Source[] = [];
const noEntry: SourceEntry = {
  title: "",
  url: undefined,
  host: "",
  snippet: "",
  favicon: undefined,
  initial: "",
};
const fromItem = { value: { kind: "string", from: "item" } } as const;
// By source object, so a host that keeps its earlier sources renders only the parts of the ones it changed.
const shown = new WeakMap<Source, SourceEntry>();
const entryOf = (source: Source) => {
  const entry = shown.get(source) ?? sourceEntry(source);
  shown.set(source, entry);
  return entry;
};
const entries = memo((sources: Source[]) =>
  Object.fromEntries(sources.map((source) => [source.id, entryOf(source)])),
);

/** An item's parts hear only about their own source. */
const own = selects<SourcesState, SourcesApi, ItemPartProps>({
  entries: ({ key }) => [key],
  sources: [],
  label: [],
});

const presentation = ({ sources = noSources, label, motion = "auto" }: SourcesOptions) => ({
  sources,
  entries: entries(sources),
  label: label ?? `Used ${sources.length} ${sources.length === 1 ? "source" : "sources"}`,
  motion,
});

export const sourcesPrimitive: SourcesPrimitive = definePrimitive<
  SourcesOptions,
  SourcesState,
  SourcesApi,
  SourcesSlots
>({
  name: "kind-sources",
  options: {
    sources: "value",
    label: "string",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    motion: "string",
  },
  state: (options) => ({
    ...presentation(options),
    open: options.open ?? options.defaultOpen ?? false,
    exiting: false,
  }),
  sync: (options) => ({
    ...presentation(options),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["open"],
  api: (context) => {
    const { store } = context;
    const change = createChange(context);
    let wasOpen = store.get().open;
    store.subscribe(() => {
      const { open } = store.get();
      if (open === wasOpen) return;
      wasOpen = open;
      if (!open) store.set({ exiting: true });
    });
    // Web hosts can only set `sources` once the element exists, so sources in the first frame count as known and
    // don't play the entrance.
    let mounting = true;
    const known = new Set(store.get().sources.map((source) => source.id));
    const setOpen = (open: boolean, reason: SourcesOpenChangeReason = "imperative", event?: Event) =>
      change("open", open, event ? { reason, event } : { reason });
    return {
      isOpen: () => store.get().open,
      setOpen: (open) => setOpen(open),
      get expand() {
        return store.get().open ? undefined : () => setOpen(true);
      },
      get collapse() {
        return store.get().open ? () => setOpen(false) : undefined;
      },
      toggle: (event) => setOpen(!store.get().open, "trigger-press", event),
      reveal: (event) => void setOpen(true, "find-in-page", event),
      bindItem: (el, id) => {
        if (known.has(id)) return;
        known.add(id);
        if (!mounting) void enter(el, "fade-up", { motion: store.get().motion });
      },
      bindRoot: (el) => {
        const release = holdTransitions(el);
        const frame = requestAnimationFrame(() => {
          mounting = false;
        });
        return () => {
          release();
          cancelAnimationFrame(frame);
        };
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "region",
      attrs: (state, part) => ({
        "aria-labelledby": `${part.id}-trigger`,
        "data-sources-part": "root",
        ...openAttrs(state.open),
      }),
      bind: (el, { api }) => api.bindRoot(el),
    }),
    // Step's trigger and content styles and motion, through `data-step-part`.
    trigger: slot<BaseSlotProps, { label: string }>({
      role: "button",
      focus: "native",
      press: ({ api }, event) => api.toggle(event),
      state: (state) => ({ label: state.label }),
      attrs: (state, part) => ({
        id: `${part.id}-trigger`,
        type: "button",
        "aria-expanded": String(state.open),
        "aria-controls": `${part.id}-content`,
        "data-sources-part": "trigger",
        "data-step-part": "trigger",
        "data-motion": state.motion,
        ...openAttrs(state.open),
      }),
    }),
    content: slot({
      attrs: (state, part) => ({
        id: `${part.id}-content`,
        "data-sources-part": "content",
        "data-step-part": "content",
        "data-motion": state.motion,
        ...openAttrs(state.open),
        ...hiddenAttrs(state.open || state.exiting, true),
      }),
      bind: (el, { api, id, store }) =>
        bindStepPanel(el, {
          isOpen: () => store.get().open,
          isExiting: () => store.get().exiting,
          motion: () => store.get().motion,
          reveal: api.reveal,
          trigger: () => el.ownerDocument.getElementById(`${id}-trigger`) ?? undefined,
          subscribe: store.subscribe,
          exited: () => store.set({ exiting: false }),
        }),
    }),
    list: slot<BaseSlotProps, { sources: Source[] }>({
      role: "list",
      state: (state) => ({ sources: state.sources }),
      attrs: () => ({ "data-sources-part": "list" }),
    }),
    item: slot<ItemProps & BaseSlotProps>({
      role: "listitem",
      props: { value: "string" },
      selects: own,
      attrs: () => ({ "data-sources-part": "item" }),
      bind: (el, { api, key }) => {
        api.bindItem(el, key);
        return holdTransitions(el);
      },
    }),
    // An `a` without `href` when the URL isn't safe, which is text, not a link.
    link: slot<ItemPartProps & BaseSlotProps>({
      props: fromItem,
      selects: own,
      attrs: (state, { key }) => {
        const { url } = state.entries[key] ?? noEntry;
        return {
          href: url,
          target: url && "_blank",
          rel: url && "noreferrer",
          "data-sources-part": "link",
        };
      },
    }),
    icon: slot<ItemPartProps & BaseSlotProps, { favicon: string | undefined; initial: string }>({
      props: fromItem,
      selects: own,
      state: (state, { key }) => {
        const { favicon, initial } = state.entries[key] ?? noEntry;
        return { favicon, initial };
      },
      attrs: () => ({ "aria-hidden": "true", "data-sources-part": "icon" }),
    }),
    title: slot<ItemPartProps & BaseSlotProps, { title: string }>({
      props: fromItem,
      selects: own,
      state: (state, { key }) => ({ title: (state.entries[key] ?? noEntry).title }),
      attrs: () => ({ "data-sources-part": "title" }),
    }),
    host: slot<ItemPartProps & BaseSlotProps, { host: string }>({
      props: fromItem,
      selects: own,
      present: (state, { key }) => (state.entries[key] ?? noEntry).host !== "",
      state: (state, { key }) => ({ host: (state.entries[key] ?? noEntry).host }),
      attrs: () => ({ "data-sources-part": "host" }),
    }),
    snippet: slot<ItemPartProps & BaseSlotProps, { snippet: string }>({
      props: fromItem,
      selects: own,
      present: (state, { key }) => (state.entries[key] ?? noEntry).snippet !== "",
      state: (state, { key }) => ({ snippet: (state.entries[key] ?? noEntry).snippet }),
      attrs: () => ({ "data-sources-part": "snippet" }),
    }),
  }),
  agent: { actions: ["expand", "collapse"] },
});
