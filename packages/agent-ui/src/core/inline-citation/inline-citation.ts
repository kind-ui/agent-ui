import {
  type ChangeDetails,
  createPopup,
  definePrimitive,
  type PopupContentProps,
  type PopupContentState,
  type PopupPreset,
  type PopupState,
  type PopupTriggerProps,
  type PopupTriggerState,
  popupContent,
  popupState,
  popupTrigger,
  type SlotDefinition,
  selects,
} from "@ui-sdk/core";
import { type CarouselController, createCarouselController } from "@ui-sdk/core/carousel";
import type { PopoverOpenChangeReason } from "@ui-sdk/core/popover";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { Source } from "../../types/index.js";
import { hoverPopupPreset, withHover } from "../hover-popup.js";
import { memo } from "../memo.js";
import type { MotionMode } from "../motion/index.js";
import { type SourceEntry, sourceEntry } from "../sources/entry.js";
import { holdTransitions } from "../step/base.js";

/** Why the card opened or closed: UI SDK Popover's reasons, and `"trigger-focus"` for keyboard focus. */
export type InlineCitationOpenChangeReason = PopoverOpenChangeReason | "trigger-focus";

export type InlineCitationOptions = {
  /** The sources the citation points to, in the order the card pages through them. Defaults to none. */
  sources?: Source[];
  /** The marker's text, like `"1"`. Defaults to the first source's host name, with "+N" for the others. */
  label?: string;
  /** Whether the card is open. Passing it controls it: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the card is open at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the card opens or closes, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<InlineCitationOpenChangeReason>) => void;
  /**
   * How the card opens: at full motion it rises in; reduced motion only fades. `"auto"` follows
   * `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type InlineCitationState = PopupState & {
  /** The `sources` option. */
  sources: Source[];
  /** Each source as the card shows it, by id. */
  entries: Record<string, SourceEntry>;
  /** The marker's text: the `label`, else the first source's host name and "+N". */
  label: string;
  /** "Source: <title>", or "Sources: N" for more than one, which names the card. */
  summary: string;
  /** The marker's accessible name: its text, then the `summary`. */
  name: string;
  /** The source the card shows, from 1. */
  page: number;
  /** The `motion` option. */
  motion: MotionMode;
};

/** What the root hands its render function. */
export type InlineCitationRootState = {
  /** The sources' ids, one `InlineCitationItem` each. */
  ids: string[];
};

/** What the carousel part hands its render function: pass them to UI SDK's Carousel. */
export type InlineCitationCarouselState = {
  /** Pass it to the Carousel, so the citation's `next` and `previous` page it. */
  controller: CarouselController;
  /** Pass it to the Carousel, so the card opens again on the source it showed. */
  defaultPage: number;
  /** The sources' ids, one slide each. */
  ids: string[];
};

type Popup = ReturnType<typeof createPopup<InlineCitationOptions, InlineCitationState, PopupPreset>>;

export type InlineCitationApi = Omit<Popup, "open" | "close"> & {
  /** Opens the card. Offered only while it's closed. Returns whether the change was accepted. */
  readonly open: (() => boolean) | undefined;
  /** Closes the card. Offered only while it's open. Returns whether the change was accepted. */
  readonly close: (() => boolean) | undefined;
  /** Shows the next source. Offered while the card is open and a source follows. Returns whether it moved. */
  readonly next: (() => boolean) | undefined;
  /** Shows the previous source. Offered while the card is open and a source comes before. Returns whether it moved. */
  readonly previous: (() => boolean) | undefined;
  /** Hands the Carousel its props. Called by the carousel slot. */
  carouselState: (state: InlineCitationState) => InlineCitationCarouselState;
  /** Which source the card shows, like "1 of 3". Called by the index slot. */
  pageText: (state: InlineCitationState) => string;
  /** Reads the Carousel's page after a press or key inside it. Called by the carousel slot. */
  syncPage: () => void;
};

type ItemProps = { value: string };
type ItemPartProps = { value?: string };

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<InlineCitationState, InlineCitationApi, Props, Public>;

type InlineCitationSlots = {
  root: Slot<BaseSlotProps, InlineCitationRootState>;
  trigger: Slot<PopupTriggerProps & BaseSlotProps, PopupTriggerState & { label: string }>;
  content: Slot<PopupContentProps & BaseSlotProps, PopupContentState>;
  carousel: Slot<BaseSlotProps, InlineCitationCarouselState>;
  item: Slot<ItemProps & BaseSlotProps>;
  link: Slot<ItemPartProps & BaseSlotProps>;
  host: Slot<ItemPartProps & BaseSlotProps, { host: string }>;
  // Not `title`, which would name the citation in an agent's snapshot while one source shows.
  "source-title": Slot<ItemPartProps & BaseSlotProps, { title: string }>;
  snippet: Slot<ItemPartProps & BaseSlotProps, { snippet: string }>;
  index: Slot<BaseSlotProps, { text: string }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type InlineCitationPrimitive = ReturnType<
  typeof definePrimitive<InlineCitationOptions, InlineCitationState, InlineCitationApi, InlineCitationSlots>
>;

const noSources: Source[] = [];
const noEntry: SourceEntry = {
  title: "",
  url: undefined,
  host: "",
  snippet: "",
  favicon: undefined,
  initial: "",
};

const entries = memo(
  (sources: Source[]): Record<string, SourceEntry> =>
    Object.fromEntries(sources.map((source) => [source.id, sourceEntry(source)])),
);
const ids = memo((sources: Source[]) => sources.map((source) => source.id));
// Own keys only, so an item `value` like "constructor" doesn't find `Object`'s.
const entryAt = ({ entries }: InlineCitationState, key: string) =>
  Object.hasOwn(entries, key) ? (entries[key] as SourceEntry) : noEntry;

const markerText = (sources: Source[], byId: Record<string, SourceEntry>) => {
  const [first] = sources;
  if (!first) return "";
  const lead = byId[first.id]?.host || first.title;
  return sources.length > 1 ? `${lead} +${sources.length - 1}` : lead;
};

const presentation = ({ sources = noSources, label, motion = "auto" }: InlineCitationOptions) => {
  const byId = entries(sources);
  const text = label ?? markerText(sources, byId);
  const summary = sources.length === 1 ? `Source: ${sources[0]?.title}` : `Sources: ${sources.length}`;
  return {
    sources,
    entries: byId,
    label: text,
    summary,
    // Starts with the marker's text (WCAG 2.5.3), then its sources, since a marker like "1" says nothing on its own.
    name: text ? `${text}, ${summary}` : summary,
    motion,
  };
};

const fromItem = { value: { kind: "string", from: "item" } } as const;
/** An item's parts hear only about their own source. */
const own = selects<InlineCitationState, InlineCitationApi, ItemPartProps>({
  entries: ({ key }) => [key],
  sources: [],
});

export const inlineCitationPrimitive: InlineCitationPrimitive = definePrimitive<
  InlineCitationOptions,
  InlineCitationState,
  InlineCitationApi,
  InlineCitationSlots
>({
  name: "kind-inline-citation",
  options: {
    sources: "value",
    label: "string",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    motion: "string",
  },
  state: (options) => ({ ...popupState(options), ...presentation(options), page: 1 }),
  sync: (options) => ({
    ...presentation(options),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["open"],
  api: (context) => {
    const popup = createPopup(
      { ...context, options: () => withHover(context.options()) },
      { preset: hoverPopupPreset },
    );
    const { store } = context;
    const carousel = createCarouselController();
    const syncPage = () => {
      const page = carousel.getPage();
      if (page !== store.get().page) store.set({ page });
    };
    // The Carousel clamps its page when sources go, so "N of M" follows.
    context.onOptions((options) => {
      const count = Math.max(options.sources?.length ?? 0, 1);
      if (store.get().page > count) store.set({ page: count });
    });
    const carouselState = memo((ids: string[], defaultPage: number) => ({
      controller: carousel,
      defaultPage,
      ids,
    }));
    const paging = (move: () => boolean) => () => {
      const moved = move();
      syncPage();
      return moved;
    };
    return {
      ...popup,
      get open() {
        return store.get().open ? undefined : () => popup.setOpen(true);
      },
      get close() {
        return store.get().open ? () => popup.setOpen(false) : undefined;
      },
      get next() {
        const { open, page, sources } = store.get();
        return open && page < sources.length ? paging(() => carousel.next()) : undefined;
      },
      get previous() {
        const { open, page } = store.get();
        return open && page > 1 ? paging(() => carousel.previous()) : undefined;
      },
      carouselState: (state) => carouselState(ids(state.sources), state.page),
      pageText: (state) => `${state.page} of ${state.sources.length}`,
      syncPage,
    };
  },
  slots: (slot) => {
    const trigger = popupTrigger(slot);
    const content = popupContent(slot);
    return {
      root: slot<BaseSlotProps, InlineCitationRootState>({
        state: (state) => ({ ids: ids(state.sources) }),
        attrs: (state) => ({ "data-motion": state.motion }),
        bind: (el) => holdTransitions(el),
      }),
      trigger: slot<PopupTriggerProps & BaseSlotProps, PopupTriggerState & { label: string }>({
        ...trigger,
        state: (state, part) => ({
          ...(trigger.state?.(state, part) as PopupTriggerState),
          label: state.label,
        }),
        attrs: (state, part) => ({
          ...trigger.attrs?.(state, part),
          type: "button",
          "aria-label": state.name,
        }),
      }),
      content: slot<PopupContentProps & BaseSlotProps, PopupContentState>({
        ...content,
        attrs: (state, part) => ({ ...content.attrs?.(state, part), "aria-label": state.summary }),
      }),
      carousel: slot<BaseSlotProps, InlineCitationCarouselState>({
        present: (state) => state.sources.length > 1,
        state: (state, { api }) => api.carouselState(state),
        // UI SDK's Carousel changes its page on Previous, Next and the arrow keys before they bubble here.
        on: {
          click: (_event, { api }) => api.syncPage(),
          keydown: (_event, { api }) => api.syncPage(),
        },
      }),
      item: slot<ItemProps & BaseSlotProps>({ props: { value: "string" }, selects: own }),
      // An `a` without `href` when the URL isn't safe, which is text, not a link.
      link: slot<ItemPartProps & BaseSlotProps>({
        props: fromItem,
        selects: own,
        attrs: (state, { key }) => {
          const { url } = entryAt(state, key);
          return { href: url, target: url && "_blank", rel: url && "noreferrer" };
        },
      }),
      host: slot<ItemPartProps & BaseSlotProps, { host: string }>({
        props: fromItem,
        selects: own,
        present: (state, { key }) => entryAt(state, key).host !== "",
        state: (state, { key }) => ({ host: entryAt(state, key).host }),
      }),
      "source-title": slot<ItemPartProps & BaseSlotProps, { title: string }>({
        props: fromItem,
        selects: own,
        state: (state, { key }) => ({ title: entryAt(state, key).title }),
      }),
      snippet: slot<ItemPartProps & BaseSlotProps, { snippet: string }>({
        props: fromItem,
        selects: own,
        present: (state, { key }) => entryAt(state, key).snippet !== "",
        state: (state, { key }) => ({ snippet: entryAt(state, key).snippet }),
      }),
      index: slot<BaseSlotProps, { text: string }>({
        state: (state, { api }) => ({ text: api.pageText(state) }),
        attrs: () => ({ "aria-live": "off" }),
      }),
    };
  },
  agent: { actions: ["open", "close", "next", "previous"] },
});
