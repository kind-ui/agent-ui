import {
  type ChangeDetails,
  createFocusRecovery,
  createRovingFocus,
  definePrimitive,
  dispatch,
  type SlotDefinition,
} from "@ui-sdk/core";
import { formatFileSize } from "@ui-sdk/core/file-input";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
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
  item.error ? ATTACHMENT_ERRORS[item.error] : item.size === undefined ? "" : formatFileSize(item.size);

export type AttachmentsOptions = {
  /**
   * The chips, in order, keyed by `id`.
   * @default []
   */
  items?: readonly AttachmentItem[];
  /** Called with an item's `id` when someone removes it. While it's set, chips can be removed. */
  onRemove?: (id: string, details: ChangeDetails<"remove-press" | "imperative">) => void;
  /**
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type AttachmentsState = {
  items: readonly AttachmentItem[];
  /** The item holding the list's Tab stop. */
  focused: string | null;
  /** Whether `onRemove` is set. */
  canRemove: boolean;
  motion: MotionMode;
  /** Object URLs for image files, by item id, made once each item binds. */
  previews: Readonly<Record<string, string>>;
};

type ItemProps = { value: string };

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
  /** Plays an item's entrance when it's added, not when the list mounts with it. */
  enterItem: (el: HTMLElement, id: string) => void;
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
      root: AttachmentsSlot<BaseSlotProps>;
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

export const attachmentsPrimitive: AttachmentsPrimitive = definePrimitive({
  name: "kind-attachments",
  options: { items: "value", onRemove: "callback", motion: "string" },
  state: (options: AttachmentsOptions): AttachmentsState => ({
    ...presentation(options),
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
        return (at(order[index + 1]) ?? at(order[index - 1]))?.el;
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
    context.onOptions((options) => {
      const gone = revokeGone(options.items ?? NO_ITEMS);
      if (gone.length === 0) return;
      const previews = { ...store.get().previews };
      for (const id of gone) delete previews[id];
      store.set({ previews });
    });
    context.onDestroy(() => void revokeGone(NO_ITEMS));

    const mounted = new Set(store.get().items.map((item) => item.id));

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
      enterItem: (el, id) => {
        if (mounted.has(id)) return;
        mounted.add(id);
        void enter(el, "fade-up", { motion: store.get().motion });
      },
    };
  },
  slots: (slot) => ({
    root: slot({ role: "list", attrs: (state) => ({ "data-motion": state.motion }) }),
    item: slot<ItemProps, AttachmentState>({
      role: "listitem",
      props: { value: "string" },
      focus: "roving",
      attrs: (state, part) => {
        const item = state.items.find((entry) => entry.id === part.props.value);
        return {
          tabindex: part.api.roving.tabIndex(state, part),
          "data-error": item?.error,
          "data-image": item && isImage(item) ? "" : undefined,
          "aria-keyshortcuts": state.canRemove ? "Delete" : undefined,
        };
      },
      state: (state, { props, api }) => {
        const item = state.items.find((entry) => entry.id === props.value);
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
        part.api.enterItem(el, part.props.value);
        const unbindFocus = part.api.roving.bind(el, part);
        const unbindRecovery = part.api.recovery.bind(el, part);
        return () => {
          unbindFocus();
          unbindRecovery();
        };
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
