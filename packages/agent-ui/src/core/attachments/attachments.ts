import {
  type ChangeDetails,
  createFocusRecovery,
  createRovingFocus,
  definePrimitive,
  dispatch,
  type Part,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { fileSize } from "../file-size.js";
import { bindLeavingRow, createRowSlide, dropRow, type LeavingRow, leavingRows } from "../leaving.js";
import { enter, type MotionMode } from "../motion/index.js";

/** One attachment. `file` or `url` gives an image its preview; `error` shows in place of its size. */
export type AttachmentItem = {
  id: string;
  name: string;
  /** In bytes. */
  size?: number;
  mediaType?: string;
  url?: string;
  file?: File;
  error?: "type" | "size";
};

export const ATTACHMENT_ERRORS = { type: "File type not accepted", size: "File is too large" } as const;

/** What a chip says under the name: its error, else its size. */
export const attachmentDetail = (item: AttachmentItem): string =>
  item.error ? ATTACHMENT_ERRORS[item.error] : item.size === undefined ? "" : fileSize(item.size);

export type AttachmentsOptions = {
  /**
   * The chips, in order, keyed by `id`.
   * @default []
   */
  items?: readonly AttachmentItem[];
  /** Called with an item's `id` when someone removes it. While it's set, chips can be removed. */
  onRemove?: (id: string, details: ChangeDetails<"remove-press" | "imperative">) => void;
  /**
   * Where focus goes when a focused chip leaves and no chip is left to take it, like the composer's editor. Without
   * it, focus is lost.
   */
  focusFallback?: () => HTMLElement | null | undefined;
  /**
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type AttachmentsState = {
  items: readonly AttachmentItem[];
  /** The chips to render: every item, plus each removed one while it fades out. */
  rows: LeavingRow<AttachmentItem>[];
  /** The item holding the list's Tab stop. */
  focused: string | null;
  /** Whether `onRemove` is set. */
  canRemove: boolean;
  motion: MotionMode;
  /** Object URLs for image files, by item id, made once each item binds. */
  previews: Readonly<Record<string, string>>;
};

type ItemProps = { value: string };

/** What the root hands its render function: the chips to render, each removed one included while it fades out. */
export type AttachmentsRootState = { rows: LeavingRow<AttachmentItem>[] };

export type AttachmentState = {
  item: AttachmentItem | undefined;
  /** An image's preview URL. */
  preview: string | undefined;
  /** The error, else the size, for people. */
  detail: string;
};

export type AttachmentsApi = {
  /** Removes an item by its `id`, through `onRemove`. Offered only while `onRemove` is set. */
  readonly remove: ((id: string, event?: Event) => void) | undefined;
  roving: ReturnType<typeof createRovingFocus<AttachmentsState, ItemProps>>;
  recovery: ReturnType<typeof createFocusRecovery<ItemProps>>;
  /** A host `url`, else the object URL made for an image file once its item bound. */
  previewOf: (item: AttachmentItem) => string | undefined;
  /** Makes an image file's object URL in the browser, so the server and hydration render the icon. */
  bindPreview: (id: string) => void;
  /** Plays an item's entrance when it's added, joins it to focus, and plays its exit once it's removed. */
  bindItem: (el: HTMLElement, part: Part<AttachmentsState, AttachmentsApi, ItemProps>) => () => void;
  /** Moves the chips after a removed one into its place. */
  bindRoot: (el: HTMLElement) => () => void;
};

type AttachmentsSlot<Props extends object, Public extends object = Record<never, never>> = SlotDefinition<
  AttachmentsState,
  AttachmentsApi,
  Props,
  Public
>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type AttachmentsPrimitive = ReturnType<
  typeof definePrimitive<
    AttachmentsOptions,
    AttachmentsState,
    AttachmentsApi,
    {
      root: AttachmentsSlot<BaseSlotProps, AttachmentsRootState>;
      item: AttachmentsSlot<ItemProps & BaseSlotProps, AttachmentState>;
      remove: AttachmentsSlot<ItemProps & BaseSlotProps>;
    }
  >
>;

const NO_ITEMS: readonly AttachmentItem[] = [];

const presentation = (options: AttachmentsOptions) => ({
  items: options.items ?? NO_ITEMS,
  canRemove: options.onRemove !== undefined,
  motion: options.motion ?? "auto",
});

const isImage = (item: AttachmentItem) => item.mediaType?.startsWith("image/") ?? false;

const rowOf = (state: AttachmentsState, id: string) => state.rows.find((row) => row.item.id === id);

export const attachmentsPrimitive: AttachmentsPrimitive = definePrimitive({
  name: "kind-attachments",
  options: { items: "value", onRemove: "callback", focusFallback: "value", motion: "string" },
  state: (options: AttachmentsOptions): AttachmentsState => ({
    ...presentation(options),
    rows: (options.items ?? NO_ITEMS).map((item) => ({ item, leaving: false })),
    focused: null,
    previews: {},
  }),
  sync: presentation,
  controlled: ["items"],
  api: (context): AttachmentsApi => {
    const { store } = context;
    // Recovery runs after the removed item has left `roving.items()`, so keep the order from before.
    let current: string[] = [];
    let previous: string[] = [];
    const roving = createRovingFocus<AttachmentsState, ItemProps>(context, {
      slot: "item",
      key: "focused",
      orientation: () => "horizontal",
      onItemsChange: () => {
        previous = current;
        current = roving.items().map((item) => item.key);
      },
    });
    const recovery = createFocusRecovery<ItemProps>({
      fallback: (lost) => {
        const order = current.includes(lost.key) ? current : previous;
        const index = order.indexOf(lost.key);
        const items = roving.items();
        const at = (key: string | undefined) => items.find((item) => item.key === key);
        return (at(order[index + 1]) ?? at(order[index - 1]))?.el ?? context.options().focusFallback?.();
      },
    });

    const made = new Map<string, { file: File; url: string }>();
    const revokeGone = (items: readonly AttachmentItem[]) => {
      const gone = [...made].filter(
        ([id, { file }]) => !items.some((item) => item.id === id && item.file === file),
      );
      for (const [id, { url }] of gone) {
        URL.revokeObjectURL(url);
        made.delete(id);
      }
      return gone.map(([id]) => id);
    };
    // Ids whose chip has entered, forgotten once it's dropped, so an item added again enters again.
    const mounted = new Set(store.get().items.map((item) => item.id));
    const elements = new Map<string, HTMLElement>();
    const slide = createRowSlide(elements, () => store.get().motion);

    // A leaving chip keeps its preview until it's dropped. One with no element to play its exit is dropped at once.
    const setRows = (next: LeavingRow<AttachmentItem>[]) => {
      const rows = next.filter((row) => !row.leaving || elements.has(row.item.id));
      slide.measure(store.get().rows, rows);
      for (const id of mounted) if (!rows.some((row) => row.item.id === id)) mounted.delete(id);
      const gone = revokeGone(rows.map((row) => row.item));
      if (gone.length === 0) return store.set({ rows });
      const previews = { ...store.get().previews };
      for (const id of gone) delete previews[id];
      store.set({ rows, previews });
    };
    let lastItems = store.get().items;
    context.onOptions((options) => {
      const items = options.items ?? NO_ITEMS;
      if (items === lastItems) return;
      lastItems = items;
      setRows(leavingRows(store.get().rows, items, options.motion));
    });
    context.onDestroy(() => void revokeGone(NO_ITEMS));

    const remove = (id: string, event?: Event) =>
      void dispatch(
        context,
        "onRemove",
        id,
        event ? { reason: "remove-press", event } : { reason: "imperative" },
      );

    return {
      get remove() {
        return store.get().canRemove ? remove : undefined;
      },
      roving,
      recovery,
      previewOf: (item) => (isImage(item) ? (item.url ?? store.get().previews[item.id]) : undefined),
      bindPreview: (id) => {
        const item = store.get().items.find((entry) => entry.id === id);
        if (!item?.file || item.url !== undefined || !isImage(item) || made.get(id)?.file === item.file)
          return;
        const url = URL.createObjectURL(item.file);
        made.set(id, { file: item.file, url });
        store.set({ previews: { ...store.get().previews, [id]: url } });
      },
      bindItem: (el, part) => {
        const id = part.props.value;
        const motion = () => ({ motion: store.get().motion });
        elements.set(id, el);
        if (!mounted.has(id)) {
          mounted.add(id);
          void enter(el, "fade-up", motion());
        }
        const unbind = bindLeavingRow(el, {
          store,
          isLeaving: () => rowOf(store.get(), id)?.leaving ?? false,
          motion,
          join: () => {
            const unbindFocus = roving.bind(el, part);
            const unbindRecovery = recovery.bind(el, part);
            return () => {
              unbindFocus();
              unbindRecovery();
            };
          },
          drop: () => setRows(dropRow(store.get().rows, id)),
        });
        return () => {
          unbind();
          if (elements.get(id) !== el) return;
          elements.delete(id);
          if (rowOf(store.get(), id)?.leaving) setRows(store.get().rows);
        };
      },
      bindRoot: (el) => slide.bind(el),
    };
  },
  slots: (slot) => ({
    root: slot<BaseSlotProps, AttachmentsRootState>({
      role: "list",
      attrs: (state) => ({ "data-motion": state.motion }),
      state: (state) => ({ rows: state.rows }),
      bind: (el, { api }) => api.bindRoot(el),
    }),
    item: slot<ItemProps, AttachmentState>({
      role: "listitem",
      props: { value: "string" },
      focus: "roving",
      attrs: (state, part) => {
        const row = rowOf(state, part.props.value);
        const item = row?.item;
        return {
          tabindex: part.api.roving.tabIndex(state, part),
          "aria-hidden": row?.leaving ? "true" : undefined,
          "data-leaving": row?.leaving ? "" : undefined,
          "data-error": item?.error,
          "data-image": item && isImage(item) ? "" : undefined,
          "aria-keyshortcuts": state.canRemove ? "Delete" : undefined,
        };
      },
      state: (state, { props, api }) => {
        const item = rowOf(state, props.value)?.item;
        return {
          item,
          preview: item && api.previewOf(item),
          detail: item ? attachmentDetail(item) : "",
        };
      },
      on: {
        keydown: (event, { el, api, props }) => {
          const key = event as KeyboardEvent;
          if ((key.key === "Delete" || key.key === "Backspace") && api.remove) {
            key.preventDefault();
            api.remove(props.value, key);
          } else if (el) {
            api.roving.keydown(key, el);
          }
        },
      },
      bind: (el, part) => {
        part.api.bindPreview(part.props.value);
        return part.api.bindItem(el, part);
      },
    }),
    // Pointer only, like Token Input's remove part: keyboard users press Delete on the item.
    remove: slot<ItemProps>({
      props: { value: { kind: "string", from: "item" } },
      present: (state) => state.canRemove,
      press: ({ api, props }, event) => api.remove?.(props.value, event),
      attrs: () => ({ "aria-hidden": "true" }),
    }),
  }),
  agent: { actions: ["remove"] },
});
