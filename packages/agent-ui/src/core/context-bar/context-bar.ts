import {
  type ChangeDetails,
  createFocusRecovery,
  createPopup,
  definePrimitive,
  dispatch,
  type Part,
  type PopupContentProps,
  type PopupContentState,
  type PopupState,
  type PopupTriggerProps,
  type PopupTriggerState,
  popupContent,
  popupState,
  popupTitle,
  popupTrigger,
  popupViewport,
  type SlotDefinition,
  selects,
} from "@ui-sdk/core";
import { type PopoverOpenChangeReason, popoverPreset } from "@ui-sdk/core/popover";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { ContextChip } from "../../types/index.js";
import { bindLeavingRow, createRowSlide, dropRow, type LeavingRow, leavingRows } from "../leaving.js";
import { createListFocus, type ListFocus } from "../list-focus.js";
import { memo } from "../memo.js";
import { enter, type MotionMode } from "../motion/index.js";
import { withAutoPresentation } from "../presentation.js";
import { fitChips } from "./fit.js";

/** `"remove-press"`: a chip's remove control, or Delete or Backspace on it. `"imperative"`: an `api` call, like an agent's. */
export type ContextBarRemoveReason = "remove-press" | "imperative";

/** `"sheet"` slides the list of the rest up from the bottom of the screen; `"auto"` does that on small touch screens. */
export type ContextBarPresentation = "auto" | "popover" | "sheet";

export type ContextBarOptions = {
  /**
   * The chips, in order, keyed by `id`.
   * @default []
   */
  chips?: readonly ContextChip[];
  /**
   * Names the bar and the list of the chips that don't fit.
   * @default "Context"
   */
  label?: string;
  /** Called with a chip's `id` when someone removes it. While it's set, chips can be removed. */
  onRemove?: (id: string, details: ChangeDetails<ContextBarRemoveReason>) => void;
  /**
   * Where focus goes when a focused chip leaves and no chip is left to take it, like the composer's editor. Without
   * it, focus is lost.
   */
  focusFallback?: () => HTMLElement | null | undefined;
  /** Whether the list of the chips that don't fit is open. Passing it controls it: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the list of the chips that don't fit is open at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the list of the chips that don't fit opens or closes, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<PopoverOpenChangeReason>) => void;
  /**
   * How the list of the chips that don't fit presents. `"auto"` is a bottom sheet on small touch screens and a popover
   * elsewhere.
   * @default "auto"
   */
  presentation?: ContextBarPresentation;
  /**
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type ContextBarState = PopupState & {
  /** The chips to render: every chip, plus each removed one while it fades out. */
  rows: LeavingRow<ContextChip>[];
  /** How many of the `rows` fit in the bar, measured; the rest go behind the "+N" button. */
  visibleCount: number;
  /** The ids of the rows past `visibleCount`, leaving ones included. */
  overflowed: string[];
  /** How many chips don't fit, leaving ones left out: the N of "+N". */
  overflowCount: number;
  /** The chip holding the bar's Tab stop. */
  focused: string | null;
  /** The chip holding the Tab stop in the list of the rest. */
  overflowFocused: string | null;
  /** The `label`, else "Context". */
  label: string;
  /** Whether `onRemove` is set. */
  canRemove: boolean;
  motion: MotionMode;
};

type ChipProps = { value: string };

/** What the `list` and `overflow-list` parts hand their render function: the rows to render in them. */
export type ContextBarListState = { rows: readonly LeavingRow<ContextChip>[] };

/** What a chip part shows. */
export type ContextBarChipState = { chip: ContextChip | undefined };

/** What the "+N" button shows. */
export type ContextBarOverflowState = PopupTriggerState & { count: number };

type Popup = ReturnType<typeof createPopup<ContextBarOptions, ContextBarState, typeof popoverPreset>>;

export type ContextBarApi = Omit<Popup, "open" | "close"> & {
  /**
   * Removes a chip by its `id`, through `onRemove`. Returns `false` for an unknown chip or a canceled removal. Offered
   * only while `onRemove` is set.
   */
  readonly remove: ((id: string) => boolean) | undefined;
  /** Opens the list of the chips that don't fit. Offered only while some don't and it's closed. */
  readonly open: (() => boolean) | undefined;
  /** Closes the list of the chips that don't fit. Offered only while it's open. */
  readonly close: (() => boolean) | undefined;
  /** The `chips` the host passed, leaving ones left out. */
  getChips: () => readonly ContextChip[];
  /** The bar's chips: one Tab stop, the arrow keys between them, and focus that moves on when one leaves. */
  chipFocus: ListFocus<ContextBarState, ChipProps>;
  /** The same for the list of the rest. */
  overflowFocus: ListFocus<ContextBarState, ChipProps>;
  /** Moves focus to the last chip in the bar when the "+N" button leaves while focused. */
  overflowRecovery: ReturnType<typeof createFocusRecovery>;
  /** Removes a chip from a press or a key. */
  pressRemove: (id: string, event?: Event) => void;
  /** Hands the `list` and `overflow-list` parts their rows. */
  listState: (state: ContextBarState) => ContextBarListState;
  overflowState: (state: ContextBarState) => ContextBarListState;
  /** Measures the bar and its chips, so `visibleCount` follows their widths. Bound by the root. */
  bindRoot: (el: HTMLElement) => () => void;
  /** Moves the chips after a removed one into its place. Bound by the list. */
  bindList: (el: HTMLElement) => () => void;
  /** Measures a chip, plays its entrance when it's added, joins it to focus and plays its exit once it's removed. */
  bindChip: (el: HTMLElement, part: Part<ContextBarState, ContextBarApi, ChipProps>) => () => void;
  /** Joins a row of the list of the rest to focus and plays its exit once it's removed. */
  bindItem: (el: HTMLElement, part: Part<ContextBarState, ContextBarApi, ChipProps>) => () => void;
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<ContextBarState, ContextBarApi, Props, Public>;

type ContextBarSlots = {
  root: Slot;
  list: Slot<BaseSlotProps, ContextBarListState>;
  chip: Slot<ChipProps & BaseSlotProps, ContextBarChipState>;
  remove: Slot<ChipProps & BaseSlotProps>;
  "item-remove": Slot<ChipProps & BaseSlotProps>;
  overflow: Slot<PopupTriggerProps & BaseSlotProps, ContextBarOverflowState>;
  content: Slot<PopupContentProps & BaseSlotProps, PopupContentState>;
  viewport: Slot;
  title: Slot<BaseSlotProps, { label: string }>;
  "overflow-list": Slot<BaseSlotProps, ContextBarListState>;
  item: Slot<ChipProps & BaseSlotProps, ContextBarChipState>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ContextBarPrimitive = ReturnType<
  typeof definePrimitive<ContextBarOptions, ContextBarState, ContextBarApi, ContextBarSlots>
>;

/** The first row of the list of the rest, which takes focus as it opens. */
export const CONTEXT_BAR_FIRST_ITEM = '[data-context-bar-part="item"]';

const NO_CHIPS: readonly ContextChip[] = [];

const presentation = (options: ContextBarOptions) => ({
  label: options.label || "Context",
  canRemove: typeof options.onRemove === "function",
  motion: options.motion ?? "auto",
});

const rowOf = (state: ContextBarState, id: string) => state.rows.find((row) => row.item.id === id);

const sameIds = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

// A row hears only about its own chip, so adding one among many reaches only that one, and the chips around a change.
const ownRow = {
  values: ({ key }: { key: string }) => [key],
  moved: (
    before: readonly LeavingRow<ContextChip>[],
    after: readonly LeavingRow<ContextChip>[],
    notify: (name: string) => void,
  ) => {
    const was = new Map(before.map((row) => [row.item.id, row]));
    for (const row of after) {
      const old = was.get(row.item.id);
      if (old?.item !== row.item || old.leaving !== row.leaving) notify(row.item.id);
      was.delete(row.item.id);
    }
    for (const id of was.keys()) notify(id);
  },
};

// What no row reads.
const unread = {
  open: [],
  mounted: [],
  trigger: [],
  payload: [],
  titled: [],
  described: [],
  modal: [],
  presentation: [],
  visibleCount: [],
  overflowCount: [],
  label: [],
} as const;

const ownChip = selects<ContextBarState, ContextBarApi, ChipProps>({
  ...unread,
  rows: ownRow,
  overflowed: ({ key }) => [key],
  focused: ({ key }) => [key],
  overflowFocused: [],
});

const ownItem = selects<ContextBarState, ContextBarApi, ChipProps>({
  ...unread,
  rows: ownRow,
  overflowed: ({ key }) => [key],
  focused: [],
  overflowFocused: ({ key }) => [key],
});

// A remove control reads only `canRemove`.
const ownRemove = selects<ContextBarState, ContextBarApi, ChipProps>({
  ...unread,
  rows: [],
  overflowed: [],
  focused: [],
  overflowFocused: [],
});

const removeSlot = (row: "chip" | "item") => ({
  selects: ownRemove,
  props: { value: { kind: "string" as const, from: row } },
  present: (state: ContextBarState) => state.canRemove,
  press: ({ api, props }: { api: ContextBarApi; props: ChipProps }, event?: Event) =>
    api.pressRemove(props.value, event),
  attrs: () => ({ "aria-hidden": "true", "data-context-bar-part": "remove" }),
});

const removeKey = (event: Event) => {
  const { key } = event as KeyboardEvent;
  return key === "Delete" || key === "Backspace";
};

export const contextBarPrimitive: ContextBarPrimitive = definePrimitive<
  ContextBarOptions,
  ContextBarState,
  ContextBarApi,
  ContextBarSlots
>({
  name: "kind-context-bar",
  options: {
    chips: "value",
    label: "string",
    onRemove: "callback",
    focusFallback: "value",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    presentation: "string",
    motion: "string",
  },
  state: (options) => {
    const shown = presentation(options);
    return {
      ...popupState(options),
      ...shown,
      rows: (options.chips ?? NO_CHIPS).map((item) => ({ item, leaving: false })),
      // Every chip, until the bar is measured in the browser.
      visibleCount: options.chips?.length ?? 0,
      overflowed: [],
      overflowCount: 0,
      focused: null,
      overflowFocused: null,
    };
  },
  sync: (options) => ({
    ...presentation(options),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["open"],
  api: (context) => {
    const { store } = context;
    const popup = createPopup<ContextBarOptions, ContextBarState, typeof popoverPreset>(
      { ...context, options: () => withAutoPresentation(context.options()) },
      { preset: popoverPreset, trigger: "overflow" },
    );

    const isShown = (item: { key: string }) => !store.get().overflowed.includes(item.key);
    const lastShown = () => {
      const { rows, visibleCount } = store.get();
      const row = rows.slice(0, visibleCount).findLast((row) => !row.leaving && elements.has(row.item.id));
      return row && elements.get(row.item.id);
    };
    const chipFocus = createListFocus<ContextBarState, ChipProps>(context, {
      slot: "chip",
      orientation: () => "horizontal",
      focusable: isShown,
      fallback: () => context.element("overflow") ?? context.options().focusFallback?.(),
    });
    const overflowFocus = createListFocus<ContextBarState, ChipProps>(context, {
      slot: "item",
      key: "overflowFocused",
      fallback: () => lastShown() ?? context.options().focusFallback?.(),
    });
    const overflowRecovery = createFocusRecovery({
      fallback: () => lastShown() ?? context.options().focusFallback?.(),
    });

    // Widths come from the observer's entries, so fitting the chips after a change reads no layout.
    let root: HTMLElement | undefined;
    let available: number | undefined;
    let gap = 0;
    let reserve = 0;
    const widths = new Map<string, number>();
    const ids = new WeakMap<Element, string>();
    let sizes: ResizeObserver | undefined;
    const observe = (el: HTMLElement) => {
      sizes ??= new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === root) {
            available = entry.contentBoxSize[0]?.inlineSize ?? 0;
            const style = getComputedStyle(root);
            gap = Number.parseFloat(style.columnGap) || 0;
            reserve = Number.parseFloat(style.getPropertyValue("--kind-context-bar-more-width")) || 0;
          } else {
            const id = ids.get(entry.target);
            if (id !== undefined) widths.set(id, entry.borderBoxSize[0]?.inlineSize ?? 0);
          }
        }
        show(store.get().rows);
      });
      sizes.observe(el);
    };
    context.onDestroy(() => sizes?.disconnect());

    const show = (rows: LeavingRow<ContextChip>[]) => {
      const state = store.get();
      const visibleCount =
        available === undefined
          ? rows.length
          : fitChips(
              rows.map((row) => widths.get(row.item.id)),
              available,
              gap,
              reserve,
            );
      const rest = rows.slice(visibleCount);
      const overflowed = rest.map((row) => row.item.id);
      const overflowCount = rest.filter((row) => !row.leaving).length;
      if (rows === state.rows && visibleCount === state.visibleCount) return;
      store.set({
        rows,
        visibleCount,
        overflowed: sameIds(overflowed, state.overflowed) ? state.overflowed : overflowed,
        overflowCount,
      });
    };

    // Ids whose chip has entered, forgotten once it's dropped, so a chip added again enters again.
    const mounted = new Set(store.get().rows.map((row) => row.item.id));
    const elements = new Map<string, HTMLElement>();
    const items = new Map<string, HTMLElement>();
    let closing = 0;
    context.onDestroy(() => cancelAnimationFrame(closing));
    const slide = createRowSlide(elements, () => store.get().motion);
    // A leaving row with no element to play its exit is dropped at once.
    const setRows = (next: LeavingRow<ContextChip>[]) => {
      const rows = next.filter((row) => !row.leaving || elements.has(row.item.id) || items.has(row.item.id));
      slide.measure(store.get().rows, rows);
      for (const id of mounted) if (!rows.some((row) => row.item.id === id)) mounted.delete(id);
      show(rows);
    };
    let lastChips = context.options().chips ?? NO_CHIPS;
    context.onOptions((options) => {
      const chips = options.chips ?? NO_CHIPS;
      if (chips === lastChips) return;
      lastChips = chips;
      setRows(leavingRows(store.get().rows, chips, options.motion));
    });

    const remove = (id: string, event?: Event) =>
      store.get().rows.some((row) => !row.leaving && row.item.id === id) &&
      !dispatch(
        context,
        "onRemove",
        id,
        event ? { reason: "remove-press", event } : { reason: "imperative" },
      );

    const bindRow = (
      el: HTMLElement,
      part: Part<ContextBarState, ContextBarApi, ChipProps>,
      rows: Map<string, HTMLElement>,
      focus: ListFocus<ContextBarState, ChipProps>,
    ) => {
      const id = part.props.value;
      rows.set(id, el);
      const unbind = bindLeavingRow(el, {
        store,
        isLeaving: () => rowOf(store.get(), id)?.leaving ?? false,
        motion: () => ({ motion: store.get().motion }),
        join: () => {
          const unbindFocus = focus.roving.bind(el, part);
          const unbindRecovery = focus.recovery.bind(el, part);
          return () => {
            unbindFocus();
            unbindRecovery();
          };
        },
        drop: () => setRows(dropRow(store.get().rows, id)),
      });
      return () => {
        unbind();
        if (rows.get(id) !== el) return;
        rows.delete(id);
        if (rowOf(store.get(), id)?.leaving) setRows(store.get().rows);
      };
    };

    const listState = memo((rows: LeavingRow<ContextChip>[]) => ({ rows }));
    const overflowState = memo((rows: LeavingRow<ContextChip>[], visibleCount: number) => ({
      rows: rows.slice(visibleCount),
    }));

    return {
      ...popup,
      get remove() {
        return store.get().canRemove ? (id: string) => remove(id) : undefined;
      },
      get open() {
        const { open, overflowCount } = store.get();
        return open || overflowCount === 0 ? undefined : () => popup.setOpen(true);
      },
      get close() {
        return store.get().open ? () => popup.setOpen(false) : undefined;
      },
      getChips: () => context.options().chips ?? NO_CHIPS,
      chipFocus,
      overflowFocus,
      overflowRecovery,
      pressRemove: (id, event) => {
        if (store.get().canRemove) remove(id, event);
      },
      listState: (state) => listState(state.rows),
      overflowState: (state) => overflowState(state.rows, state.visibleCount),
      bindRoot: (el) => {
        root = el;
        observe(el);
        return () => {
          sizes?.unobserve(el);
          root = undefined;
          available = undefined;
        };
      },
      bindList: (el) => slide.bind(el),
      bindChip: (el, part) => {
        const id = part.props.value;
        ids.set(el, id);
        observe(el);
        if (!mounted.has(id)) {
          mounted.add(id);
          void enter(el, "fade-up", { motion: store.get().motion });
        }
        const unbind = bindRow(el, part, elements, chipFocus);
        return () => {
          sizes?.unobserve(el);
          if (elements.get(id) === el) widths.delete(id);
          unbind();
        };
      },
      bindItem: (el, part) => {
        const unbind = bindRow(el, part, items, overflowFocus);
        return () => {
          unbind();
          // The list closes once its last row has gone, in the next frame, once focus recovery has moved that row's
          // focus to the bar: closing with focus inside would send it to the "+N" button, which has left too.
          if (items.size > 0 || closing) return;
          closing = requestAnimationFrame(() => {
            closing = 0;
            const { open, overflowCount } = store.get();
            if (open && overflowCount === 0 && items.size === 0)
              popup.setOpen(false, { reason: "imperative" });
          });
        };
      },
    };
  },
  slots: (slot) => {
    const trigger = popupTrigger(slot);
    const content = popupContent(slot);
    const title = popupTitle(slot);
    const rowAttrs = (state: ContextBarState, row: LeavingRow<ContextChip> | undefined) => ({
      "data-kind": row?.item.kind,
      "data-leaving": row?.leaving ? "" : undefined,
      "aria-keyshortcuts": state.canRemove ? "Delete" : undefined,
    });
    return {
      root: slot({
        role: "group",
        attrs: (state) => ({
          "aria-label": state.label,
          "data-context-bar-part": "root",
          "data-overflowing": state.overflowCount > 0 ? "" : undefined,
          "data-open": state.open ? "" : undefined,
          "data-motion": state.motion,
        }),
        bind: (el, { api }) => api.bindRoot(el),
      }),
      list: slot<BaseSlotProps, ContextBarListState>({
        role: "list",
        state: (state, { api }) => api.listState(state),
        attrs: () => ({ "data-context-bar-part": "list" }),
        bind: (el, { api }) => api.bindList(el),
      }),
      chip: slot<ChipProps, ContextBarChipState>({
        role: "listitem",
        props: { value: "string" },
        focus: "roving",
        selects: ownChip,
        state: (state, { props }) => ({ chip: rowOf(state, props.value)?.item }),
        attrs: (state, part) => {
          const row = rowOf(state, part.props.value);
          const overflowed = state.overflowed.includes(part.props.value);
          return {
            ...rowAttrs(state, row),
            tabindex: part.api.chipFocus.roving.tabIndex(state, part),
            // A chip that doesn't fit stays in the row, unseen, so its width stays measured.
            "aria-hidden": row?.leaving || overflowed ? "true" : undefined,
            inert: overflowed ? "" : undefined,
            "data-overflow": overflowed ? "" : undefined,
            "data-context-bar-part": "chip",
          };
        },
        on: {
          keydown: (event, { el, api, props }) => {
            if (removeKey(event) && api.remove) {
              event.preventDefault();
              api.pressRemove(props.value, event);
            } else if (el) api.chipFocus.roving.keydown(event as KeyboardEvent, el);
          },
        },
        bind: (el, part) => part.api.bindChip(el, part),
      }),
      // Pointer only, like Attachments': keyboard users press Delete on the chip.
      remove: slot<ChipProps>(removeSlot("chip")),
      overflow: slot<PopupTriggerProps & BaseSlotProps, ContextBarOverflowState>({
        ...trigger,
        present: (state) => state.overflowCount > 0,
        state: (state, part) => ({
          ...(trigger.state?.(state, part) as PopupTriggerState),
          count: state.overflowCount,
        }),
        attrs: (state, part) => ({
          ...trigger.attrs?.(state, part),
          type: "button",
          "aria-label": `${state.overflowCount} more`,
          "data-context-bar-part": "overflow",
        }),
        bind: (el, part) => {
          const unbindTrigger = trigger.bind?.(el, part);
          const unbindRecovery = part.api.overflowRecovery.bind(el, part);
          return () => {
            unbindTrigger?.();
            unbindRecovery();
          };
        },
      }),
      content: slot<PopupContentProps & BaseSlotProps, PopupContentState>({
        ...content,
        attrs: (state, part) => ({
          ...content.attrs?.(state, part),
          "data-context-bar-part": "content",
          "data-motion": state.motion,
        }),
      }),
      // The full-screen element the content sits in while it presents as a sheet: render it around the content then.
      viewport: popupViewport(slot),
      title: slot<BaseSlotProps, { label: string }>({
        ...title,
        state: (state) => ({ label: state.label }),
        attrs: (state, part) => ({ ...title.attrs?.(state, part), "data-context-bar-part": "title" }),
      }),
      "overflow-list": slot<BaseSlotProps, ContextBarListState>({
        role: "list",
        state: (state, { api }) => api.overflowState(state),
        attrs: (state) => ({ "aria-label": state.label, "data-context-bar-part": "overflow-list" }),
      }),
      item: slot<ChipProps, ContextBarChipState>({
        role: "listitem",
        props: { value: "string" },
        focus: "roving",
        selects: ownItem,
        state: (state, { props }) => ({ chip: rowOf(state, props.value)?.item }),
        attrs: (state, part) => {
          const row = rowOf(state, part.props.value);
          return {
            ...rowAttrs(state, row),
            tabindex: part.api.overflowFocus.roving.tabIndex(state, part),
            "aria-hidden": row?.leaving ? "true" : undefined,
            "data-context-bar-part": "item",
          };
        },
        on: {
          keydown: (event, { el, api, props }) => {
            if (removeKey(event) && api.remove) {
              event.preventDefault();
              api.pressRemove(props.value, event);
            } else if (el) api.overflowFocus.roving.keydown(event as KeyboardEvent, el);
          },
        },
        bind: (el, part) => part.api.bindItem(el, part),
      }),
      "item-remove": slot<ChipProps>(removeSlot("item")),
    };
  },
  agent: {
    actions: ["remove", "open", "close"],
    items: (api: ContextBarApi) => api.getChips().map(({ id, label }) => ({ value: id, label })),
    closed: true,
  },
});
