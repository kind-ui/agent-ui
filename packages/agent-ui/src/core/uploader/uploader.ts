import {
  announce,
  type ChangeDetails,
  createFocusRecovery,
  definePrimitive,
  dispatch,
  type Part,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { FileInputOptions, FileInputValueChangeReason, FileRejection } from "@ui-sdk/core/file-input";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { type FileIntake, forwardFileInputEvents } from "../file-input-events.js";
import { fileSize } from "../file-size.js";
import { bindLeavingRow, createRowSlide, dropRow, type LeavingRow, leavingRows } from "../leaving.js";
import { memo } from "../memo.js";
import { enter, type MotionMode } from "../motion/index.js";

export type UploadStatus = "queued" | "uploading" | "done" | "error" | "cancelled";

/** One file the host is uploading. */
export type UploadItem = {
  id: string;
  name: string;
  /** In bytes. */
  size: number;
  /** From 0 to 100. */
  progress: number;
  status: UploadStatus;
  /**
   * Shown in place of the size while `status` is `"error"`.
   * @default "Upload failed"
   */
  error?: string;
};

export type UploaderFilesDetails = ChangeDetails<FileInputValueChangeReason>;

export type UploaderOptions = {
  /**
   * The uploads, in order, keyed by `id`.
   * @default []
   */
  items?: readonly UploadItem[];
  /** Called with the files someone chooses, drops or pastes that pass `accept` and `maxSize`. */
  onFiles?: (files: File[], details: UploaderFilesDetails) => void;
  /** Called with the files `accept` or `maxSize` turns down, each with its `reasons`. */
  onReject?: (rejected: FileRejection[], details: UploaderFilesDetails) => void;
  /** Called with an item's `id` when it's cancelled. While it's set, queued and uploading items show Cancel. */
  onCancel?: (id: string, details: ChangeDetails<"cancel-press" | "imperative">) => void;
  /** Called with an item's `id` when it's retried. While it's set, failed items show Retry. */
  onRetry?: (id: string, details: ChangeDetails<"retry-press" | "imperative">) => void;
  /** The file types to accept, like the `accept` attribute. Without it, any file. */
  accept?: string;
  /** The largest file to accept, in bytes. Without it, any size. */
  maxSize?: number;
  /**
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type UploaderState = {
  items: readonly UploadItem[];
  /** The rows to render: every item, plus each removed one while it fades out. */
  rows: LeavingRow<UploadItem>[];
  canCancel: boolean;
  canRetry: boolean;
  accept: string | undefined;
  maxSize: number | undefined;
  motion: MotionMode;
};

/** Props for the File Input inside the root. */
export type UploaderRootState = {
  fileInput: Pick<FileInputOptions, "accept" | "maxSize" | "multiple" | "onValueChange" | "onReject">;
};

/** What the list hands its render function: the rows to render, each removed one included while it fades out. */
export type UploaderListState = { rows: LeavingRow<UploadItem>[] };

export type UploadItemState = {
  item: UploadItem | undefined;
  /** The error, else what the upload is doing and the file's size, for people. */
  detail: string;
};

type UploadAction = "cancel" | "retry";

type ItemProps = { value: string };

export type UploaderApi = {
  /** Cancels a queued or uploading item by its `id`, through `onCancel`. Offered while one can be cancelled. */
  readonly cancel: ((id: string, event?: Event) => void) | undefined;
  /** Retries a failed item by its `id`, through `onRetry`. Offered while one has failed. */
  readonly retry: ((id: string, event?: Event) => void) | undefined;
  /** Plays an item's entrance when it's added, and its exit once it's removed. */
  bindItem: (el: HTMLElement, id: string) => () => void;
  /** Hears File Input's events on web, and marks the end of the first frame. */
  bindRoot: (el: HTMLElement) => () => void;
  /** Moves the rows after a removed one into its place. */
  bindList: (el: HTMLElement) => () => void;
  /** Tracks an action button, so focus moves to a neighbor's when a cancelled item's button leaves. */
  bindAction: (el: HTMLElement, part: Part<UploaderState, UploaderApi, ItemProps>) => () => void;
  partState: { root: (state: UploaderState) => UploaderRootState };
};

type UploaderSlot<Props extends object, Public extends object = Record<never, never>> = SlotDefinition<
  UploaderState,
  UploaderApi,
  Props,
  Public
>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type UploaderPrimitive = ReturnType<
  typeof definePrimitive<
    UploaderOptions,
    UploaderState,
    UploaderApi,
    {
      root: UploaderSlot<BaseSlotProps, UploaderRootState>;
      list: UploaderSlot<BaseSlotProps, UploaderListState>;
      item: UploaderSlot<ItemProps & BaseSlotProps, UploadItemState>;
      action: UploaderSlot<ItemProps & BaseSlotProps>;
    }
  >
>;

const NO_ITEMS: readonly UploadItem[] = [];

const isActive = (item: UploadItem) => item.status === "queued" || item.status === "uploading";

/** What an upload row says under the name. */
export function uploadDetail(item: UploadItem): string {
  const size = fileSize(item.size);
  switch (item.status) {
    case "queued":
      return `Waiting · ${size}`;
    case "uploading":
      return `${Math.round(item.progress)}% · ${size}`;
    case "done":
      return `${size} · Uploaded`;
    case "error":
      return item.error ?? "Upload failed";
    case "cancelled":
      return "Cancelled";
  }
}

const ANNOUNCED: Partial<Record<UploadStatus, string>> = { done: "uploaded", error: "failed" };

const presentation = (options: UploaderOptions) => ({
  items: options.items ?? NO_ITEMS,
  canCancel: options.onCancel !== undefined,
  canRetry: options.onRetry !== undefined,
  accept: options.accept,
  maxSize: options.maxSize,
  motion: options.motion ?? "auto",
});

const itemOf = (state: UploaderState, id: string) => state.items.find((item) => item.id === id);
const rowOf = (state: UploaderState, id: string) => state.rows.find((row) => row.item.id === id);

/** Cancel while queued or uploading, Retry once failed, when the host offers it. A leaving row keeps its button. */
function actionOf(state: UploaderState, id: string): UploadAction | undefined {
  const item = rowOf(state, id)?.item;
  if (item && isActive(item) && state.canCancel) return "cancel";
  if (item?.status === "error" && state.canRetry) return "retry";
  return undefined;
}

export const uploaderPrimitive: UploaderPrimitive = definePrimitive({
  name: "kind-uploader",
  options: {
    items: "value",
    onFiles: "callback",
    onReject: "callback",
    onCancel: "callback",
    onRetry: "callback",
    accept: "string",
    maxSize: "number",
    motion: "string",
  },
  state: (options: UploaderOptions): UploaderState => ({
    ...presentation(options),
    rows: (options.items ?? NO_ITEMS).map((item) => ({ item, leaving: false })),
  }),
  sync: presentation,
  controlled: ["items"],
  api: (context): UploaderApi => {
    const { store } = context;

    let statuses = new Map(store.get().items.map((item) => [item.id, item.status]));
    // Focus recovery runs after a removed item has left `items`, so keep the order from before.
    let order = [...statuses.keys()];
    let previousOrder = order;
    // An item asked to cancel or retry takes no second request until the host changes its status.
    const requested = new Set<string>();
    let lastItems = store.get().items;
    context.onOptions((options) => {
      const items = options.items ?? NO_ITEMS;
      if (items === lastItems) return;
      lastItems = items;
      const next = new Map(items.map((item) => [item.id, item.status]));
      for (const item of items) {
        const outcome = ANNOUNCED[item.status];
        const before = statuses.get(item.id);
        if (outcome && before !== undefined && before !== item.status) {
          announce(`${item.name} ${outcome}`, { priority: "polite" });
        }
      }
      for (const id of requested) if (next.get(id) !== statuses.get(id)) requested.delete(id);
      statuses = next;
      previousOrder = order;
      order = [...next.keys()];
      setRows(leavingRows(store.get().rows, items, options.motion));
    });

    const intake: FileIntake = {
      accept: (files, reason, cancel) => {
        // The host's items hold the uploads, so File Input keeps none of its own.
        cancel();
        if (files.length > 0) void dispatch(context, "onFiles", files, { reason });
      },
      reject: (rejected, reason) => void dispatch(context, "onReject", rejected, { reason }),
    };

    const cancel = (id: string, event?: Event) => {
      const item = itemOf(store.get(), id);
      if (!item || !isActive(item) || requested.has(id)) return;
      requested.add(id);
      void dispatch(
        context,
        "onCancel",
        id,
        event ? { reason: "cancel-press", event } : { reason: "imperative" },
      );
    };
    const retry = (id: string, event?: Event) => {
      if (itemOf(store.get(), id)?.status !== "error" || requested.has(id)) return;
      requested.add(id);
      void dispatch(
        context,
        "onRetry",
        id,
        event ? { reason: "retry-press", event } : { reason: "imperative" },
      );
    };

    const root = memo(
      (accept: string | undefined, maxSize: number | undefined): UploaderRootState => ({
        fileInput: {
          multiple: true,
          ...(accept === undefined ? {} : { accept }),
          ...(maxSize === undefined ? {} : { maxSize }),
          onValueChange: (_files, details) => intake.accept(details.added, details.reason, details.cancel),
          onReject: (rejected, details) => intake.reject(rejected, details.reason),
        },
      }),
    );

    // Ids whose row has entered, forgotten once it's dropped, so an item added again enters again.
    const mounted = new Set(store.get().items.map((item) => item.id));
    // Web hosts can only set `items` once the element exists, so rows in the first frame count as mounted.
    let mounting = true;
    const elements = new Map<string, HTMLElement>();
    const slide = createRowSlide(elements, () => store.get().motion);
    // A leaving row with no element to play its exit is dropped at once.
    function setRows(next: LeavingRow<UploadItem>[]) {
      const rows = next.filter((row) => !row.leaving || elements.has(row.item.id));
      slide.measure(store.get().rows, rows);
      for (const id of mounted) if (!rows.some((row) => row.item.id === id)) mounted.delete(id);
      store.set({ rows });
    }

    const actions = new Map<string, HTMLElement>();
    const recovery = createFocusRecovery<ItemProps>({
      fallback: (lost) => {
        const ids = order.includes(lost.props.value) ? order : previousOrder;
        const index = ids.indexOf(lost.props.value);
        const after = ids.slice(index + 1);
        const before = ids.slice(0, Math.max(index, 0)).reverse();
        const neighbor = [...after, ...before].find(
          (id) => actions.get(id)?.isConnected && !rowOf(store.get(), id)?.leaving,
        );
        return neighbor === undefined ? undefined : actions.get(neighbor);
      },
    });

    return {
      get cancel() {
        const { canCancel, items } = store.get();
        return canCancel && items.some(isActive) ? cancel : undefined;
      },
      get retry() {
        const { canRetry, items } = store.get();
        return canRetry && items.some((item) => item.status === "error") ? retry : undefined;
      },
      bindItem: (el, id) => {
        const motion = () => ({ motion: store.get().motion });
        elements.set(id, el);
        if (!mounted.has(id)) {
          mounted.add(id);
          if (!mounting) void enter(el, "fade-up", motion());
        }
        const unbind = bindLeavingRow(el, {
          store,
          isLeaving: () => rowOf(store.get(), id)?.leaving ?? false,
          motion,
          join: () => () => {},
          drop: () => setRows(dropRow(store.get().rows, id)),
        });
        return () => {
          unbind();
          if (elements.get(id) !== el) return;
          elements.delete(id);
          if (rowOf(store.get(), id)?.leaving) setRows(store.get().rows);
        };
      },
      bindRoot: (el) => {
        const frame = requestAnimationFrame(() => {
          mounting = false;
        });
        const unforward = forwardFileInputEvents(el, intake);
        return () => {
          cancelAnimationFrame(frame);
          unforward();
        };
      },
      bindList: (el) => slide.bind(el),
      bindAction: (el, part) => {
        const id = part.props.value;
        actions.set(id, el);
        // A leaving row keeps its button, so the button hands focus to a neighbor's as its row starts leaving.
        let unbind: (() => void) | undefined;
        const follow = () => {
          const leaving = rowOf(store.get(), id)?.leaving ?? false;
          if (leaving && unbind) {
            unbind();
            unbind = undefined;
          } else if (!leaving && !unbind) {
            unbind = recovery.bind(el, part);
          }
        };
        follow();
        const unsubscribe = store.subscribe(follow);
        return () => {
          unsubscribe();
          unbind?.();
          if (actions.get(id) === el) actions.delete(id);
        };
      },
      partState: { root: (state) => root(state.accept, state.maxSize) },
    };
  },
  slots: (slot) => ({
    root: slot<BaseSlotProps, UploaderRootState>({
      role: "group",
      attrs: (state) => ({ "data-motion": state.motion }),
      state: (state, { api }) => api.partState.root(state),
      bind: (el, { api }) => api.bindRoot(el),
    }),
    // Stays mounted while empty, so the first upload plays its entrance like the rest.
    list: slot<BaseSlotProps, UploaderListState>({
      role: "list",
      attrs: (state) => ({ "data-empty": state.rows.length === 0 ? "" : undefined }),
      state: (state) => ({ rows: state.rows }),
      bind: (el, { api }) => api.bindList(el),
    }),
    item: slot<ItemProps, UploadItemState>({
      role: "listitem",
      props: { value: "string" },
      attrs: (state, { props }) => {
        const row = rowOf(state, props.value);
        return {
          "aria-hidden": row?.leaving ? "true" : undefined,
          "data-status": row?.item.status,
          "data-leaving": row?.leaving ? "" : undefined,
        };
      },
      state: (state, { props }) => {
        const item = rowOf(state, props.value)?.item;
        return { item, detail: item ? uploadDetail(item) : "" };
      },
      bind: (el, { api, props }) => api.bindItem(el, props.value),
    }),
    action: slot<ItemProps>({
      role: "button",
      focus: "native",
      props: { value: { kind: "string", from: "item" } },
      present: (state, { props }) => actionOf(state, props.value) !== undefined,
      press: ({ api, props, store }, event) => {
        // Retry turns into Cancel under the pointer, so a double click's second click must not cancel.
        if (event instanceof MouseEvent && event.detail > 1) return;
        const action = actionOf(store.get(), props.value);
        if (action) api[action]?.(props.value, event);
      },
      attrs: (state, { props }) => {
        const action = actionOf(state, props.value);
        const name = rowOf(state, props.value)?.item.name ?? "upload";
        return {
          type: "button",
          "aria-label": action === "retry" ? `Retry ${name}` : `Cancel ${name}`,
          "data-action": action,
          "data-kind-icon-button": "",
        };
      },
      bind: (el, part) => part.api.bindAction(el, part),
    }),
  }),
  agent: { actions: ["cancel", "retry"] },
});
