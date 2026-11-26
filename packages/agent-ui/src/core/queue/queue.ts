import {
  announce,
  type ChangeDetails,
  type ChangeSource,
  createReorder,
  definePrimitive,
  dispatch,
  hiddenAttrs,
  openAttrs,
  type Reorder,
  type ReorderDraft,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { QueueItem } from "../../types/index.js";
import { actionSource } from "../action-source.js";
import { bindLeavingRow, dropRow, type LeavingRow, leavingRows } from "../leaving.js";
import { createListFocus, type ListFocus } from "../list-focus.js";
import { memo } from "../memo.js";
import { cancel, enter, exit, layout, type MotionMode, resolvedMotion } from "../motion/index.js";
import { createPendingAction } from "../pending.js";
import { bindStepPanel } from "../step/base.js";
import { bindTextSource, insertText } from "../text-target.js";
import { WORDS } from "../words.js";

/** The section an item shows in: Queued while `pending`, Completed once `complete`. */
export type QueueSection = QueueItem["status"];

export type QueueReorderReason = "drag" | "move-key" | "imperative";

/** Send now's and Edit's details: what caused it and who. `"take-back"` is Alt+Up in the composer it's docked in. */
export type QueueItemActionDetails = {
  reason: "send-press" | "edit-press" | "take-back" | "imperative";
  event?: Event;
  source: ChangeSource;
};

export type QueueOptions = {
  /**
   * The items, in order, keyed by `id`. Pending items show under Queued and complete ones under Completed.
   * @default []
   */
  items?: readonly QueueItem[];
  /**
   * Names the queue for assistive technology and agents.
   * @default "Queue"
   */
  label?: string;
  /**
   * Called when someone moves a pending item, with its `id` and, in `details.index`, the index it moves to in
   * `items`. Move it there: the queue shows your next `items`. While it's set, pending items can be reordered.
   */
  onReorder?: (id: string, details: ChangeDetails<QueueReorderReason> & { index: number }) => void;
  /**
   * The sections open at first.
   * @default ["pending"]
   */
  defaultOpenSections?: QueueSection[];
  /**
   * Called with an item's `id` when someone removes it. While it's set, items can be removed. An item is asked for
   * once: a host that keeps it, say after a failed removal, passes a new object for it to allow another try.
   */
  onRemove?: (id: string, details: ChangeDetails<"remove-press" | "imperative">) => void;
  /**
   * Called with a queued item's `id` when someone sends it now: into the running turn, or as the next message. While
   * it's set, queued items show Send now. Return a promise to lock sending until it settles; a resolved send stays
   * locked until the host removes or changes the item.
   */
  onSend?: (id: string, details: QueueItemActionDetails) => unknown;
  /**
   * Called with a queued item's `id` when someone edits it: remove it from `items`. Once the call resolves, its title
   * goes back into the Composer the Queue is docked in, on its own line. While it's set, queued items show Edit, and
   * Alt+Up in that Composer's empty editor takes back the last one.
   */
  onEdit?: (id: string, details: QueueItemActionDetails) => unknown;
  /**
   * Why Send now can't run right now, like "Available after you answer the pending request". While it's set, Send
   * now is disabled and says this.
   */
  sendDisabledReason?: string;
  /**
   * `"auto"` follows `prefers-reduced-motion`. A removed item fades out before the items after it move up; under
   * `"none"` it leaves at once.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type QueueState = {
  label: string;
  /** The `items` option. */
  items: readonly QueueItem[];
  /** The rows to render: every item, plus each removed one while it fades out. */
  rows: LeavingRow<QueueItem>[];
  rowsById: Record<string, LeavingRow<QueueItem>>;
  /** The pending items' ids, in order: the order a person moves items in. */
  order: string[];
  /** The item being moved and the order it's in now, until the host's next `items` arrive. */
  moving: ReorderDraft | null;
  /** The item holding the queue's Tab stop. */
  focused: string | null;
  openSections: QueueSection[];
  /** Sections closing and still shown while their exit plays. */
  exitingSections: QueueSection[];
  /** Whether `onReorder` is set. */
  canReorder: boolean;
  /** Whether `onRemove` is set. */
  canRemove: boolean;
  /** Whether `onSend` is set. */
  canSend: boolean;
  /** Whether `onEdit` is set. */
  canEdit: boolean;
  sendDisabledReason: string | undefined;
  /** The item being sent, from Send now until the host removes or changes it, or the send fails. */
  sending: string | null;
  /** Whether a send is in flight. */
  sendPending: boolean;
  /** Whether the Queue sits inside a Composer, docked to its top edge. */
  docked: boolean;
  /** Whether the Composer it's docked in has a turn running. */
  running: boolean;
  /** Whether the docked Queue is collapsing after its last queued item left; it stays shown until it ends. */
  closing: boolean;
  motion: MotionMode;
};

type ItemProps = { value: string };
/** A part inside an item or a section, which takes its `value`. */
type InnerProps = { value?: string };

export type QueueSectionState = { title: string; count: number; open: boolean };

export type QueueApi = ListFocus<QueueState, ItemProps> & {
  /**
   * Moves a pending item among the pending ones, so that as many pending items come before it as come before
   * `index` in `items`, through `onReorder`, whose `details.index` is where that puts it in `items`. Returns whether
   * it moved; an index outside `items` is refused. Offered only while `onReorder` is set and two or more items are
   * pending.
   */
  readonly reorder: ((id: string, index: number) => boolean) | undefined;
  /**
   * Removes an item by its `id`, through `onRemove`. Returns whether it was asked; an item already asked isn't asked
   * again until the host passes a new object for it. Offered only while `onRemove` is set and there are items.
   */
  readonly remove: ((id: string, event?: Event) => boolean) | undefined;
  /**
   * Sends a queued item now, through `onSend`. Returns whether it was asked; an unknown or completed item is refused.
   * Offered only while `onSend` is set, an item is queued, no `sendDisabledReason` is set, and no send is in flight or
   * awaiting the host.
   */
  readonly send: ((id: string, event?: Event) => boolean) | undefined;
  /**
   * Edits a queued item, through `onEdit`, giving its title back to the Composer it's docked in. Returns whether it
   * was asked; an unknown or completed item is refused. Offered only while `onEdit` is set and an item is queued.
   */
  readonly edit: ((id: string, event?: Event) => boolean) | undefined;
  /** Edits the last queued item, as Alt+Up in the Composer does. Returns whether there was one. */
  takeBack: (source: ChangeSource) => boolean;
  /** Docks the Queue in the Composer around it, and grows or folds it as its first item arrives or its last leaves. */
  bindDock: (el: HTMLElement) => () => void;
  /** The `items` option. */
  getItems: () => readonly QueueItem[];
  /** Pointer and keyboard moves of pending items. Called by the item slot. */
  reordering: Reorder;
  /** The open sections. Queued starts open and Completed closed. */
  getOpenSections: () => QueueSection[];
  /** Opens exactly these sections. */
  setOpenSections: (openSections: QueueSection[]) => void;
  /** Opens a closed section and closes an open one. */
  toggleSection: (section: QueueSection) => void;
  /** Makes a section's content a collapsible panel. Called by the section content slot. */
  bindSection: (el: HTMLElement, section: QueueSection) => () => void;
  /** Moves a section into place with the rows. Called by the section slot. */
  bindSectionBox: (el: HTMLElement) => () => void;
  /** Plays an item's entrance, joins it to focus and moves, and plays its exit once it's removed. */
  bindItem: (el: HTMLElement, part: { key: string; props: ItemProps }) => () => void;
  /** Starts counting items as new after the first frame, and moves rows into place when the order changes. */
  bindRoot: () => () => void;
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<QueueState, QueueApi, Props, Public>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type QueuePrimitive = ReturnType<
  typeof definePrimitive<
    QueueOptions,
    QueueState,
    QueueApi,
    {
      root: Slot;
      section: Slot<ItemProps & BaseSlotProps, QueueSectionState>;
      "section-trigger": Slot<InnerProps & BaseSlotProps, QueueSectionState>;
      "section-content": Slot<InnerProps & BaseSlotProps>;
      list: Slot<InnerProps & BaseSlotProps, { rows: LeavingRow<QueueItem>[] }>;
      item: Slot<ItemProps & BaseSlotProps, { item: QueueItem | undefined }>;
      "item-icon": Slot<InnerProps & BaseSlotProps>;
      "item-title": Slot<InnerProps & BaseSlotProps, { title: string }>;
      "item-description": Slot<InnerProps & BaseSlotProps, { description: string }>;
      "item-send": Slot<InnerProps & BaseSlotProps>;
      "item-edit": Slot<InnerProps & BaseSlotProps>;
      "item-remove": Slot<InnerProps & BaseSlotProps>;
      instructions: Slot<BaseSlotProps, { text: string }>;
    }
  >
>;

const NO_ITEMS: readonly QueueItem[] = [];
const SECTION_TITLES: Record<QueueSection, string> = { pending: WORDS.queued, complete: "Completed" };

const byId = memo((rows: LeavingRow<QueueItem>[]) =>
  Object.fromEntries(rows.map((row) => [row.item.id, row])),
);
const pendingIds = memo((items: readonly QueueItem[]) =>
  items.filter((item) => item.status === "pending").map((item) => item.id),
);

const presentation = (options: QueueOptions) => {
  const items = options.items ?? NO_ITEMS;
  return {
    label: options.label ?? "Queue",
    items,
    order: pendingIds(items),
    canReorder: options.onReorder !== undefined,
    canRemove: options.onRemove !== undefined,
    canSend: options.onSend !== undefined,
    canEdit: options.onEdit !== undefined,
    sendDisabledReason: options.sendDisabledReason || undefined,
    motion: options.motion ?? "auto",
  };
};

/** A section's rows. While an item moves, the pending ones follow its order, and leaving rows keep their places. */
export const queueRows = (
  rows: LeavingRow<QueueItem>[],
  moving: ReorderDraft | null,
  section: QueueSection,
) => {
  const own = rows.filter((row) => row.item.status === section);
  if (section !== "pending" || !moving) return own;
  const live = new Map(own.filter((row) => !row.leaving).map((row) => [row.item.id, row]));
  // Until the draft is rebased on the host's new items, it can still name one that left.
  const order = moving.order.filter((id) => live.has(id));
  if (order.length !== live.size) return own;
  let next = 0;
  return own.map((row) => (row.leaving ? row : (live.get(order[next++] as string) as LeavingRow<QueueItem>)));
};

const rowsOf = { pending: memo(queueRows), complete: memo(queueRows) };

/** Where `id` goes in `items` so that the pending items are in `order`. */
const itemsIndex = (items: readonly QueueItem[], order: string[], id: string) => {
  const rest = items.filter((item) => item.id !== id);
  const at = order.indexOf(id);
  const next = order[at + 1];
  if (next !== undefined) return rest.findIndex((item) => item.id === next);
  const previous = order[at - 1];
  return previous === undefined ? 0 : rest.findIndex((item) => item.id === previous) + 1;
};

/** A section's title, how many items it has, and whether it's open. */
export const queueSection = (state: QueueState, section: QueueSection): QueueSectionState => {
  const count = state.items.filter((item) => item.status === section).length;
  return {
    title:
      state.docked && section === "pending"
        ? `${count} ${WORDS.queued.toLowerCase()}`
        : SECTION_TITLES[section],
    count,
    open: state.openSections.includes(section),
  };
};

/** A docked row's name, "Queued message 2 of 3, not sent", read before its text. */
export const queueItemName = (state: Pick<QueueState, "order">, id: string) => {
  const at = state.order.indexOf(id);
  return at < 0
    ? undefined
    : `${WORDS.queuedMessage} ${at + 1} of ${state.order.length}, ${WORDS.notSentYet}`;
};

/** The keys that move and remove items, for the instructions part. */
export const queueInstructions = ({ canReorder, canRemove }: Pick<QueueState, "canReorder" | "canRemove">) =>
  [
    canReorder &&
      "To move a queued item, press Space, then the arrow keys. Press Space again to drop it, or Escape to cancel.",
    canRemove && "Press Delete to remove an item.",
  ]
    .filter(Boolean)
    .join(" ");

const fromSection = { value: { kind: "string", from: "section" } } as const;
const fromItem = { value: { kind: "string", from: "item" } } as const;

export const queuePrimitive: QueuePrimitive = definePrimitive({
  name: "kind-queue",
  options: {
    items: "value",
    label: "string",
    onReorder: "callback",
    onRemove: "callback",
    onSend: "action",
    onEdit: "action",
    sendDisabledReason: "string",
    defaultOpenSections: "list",
    motion: "string",
  },
  state: (options: QueueOptions): QueueState => {
    const rows = (options.items ?? NO_ITEMS).map((item) => ({ item, leaving: false }));
    return {
      ...presentation(options),
      rows,
      rowsById: byId(rows),
      moving: null,
      focused: null,
      openSections: options.defaultOpenSections ?? ["pending"],
      exitingSections: [],
      sending: null,
      sendPending: false,
      docked: false,
      running: false,
      closing: false,
    };
  },
  sync: presentation,
  controlled: ["items"],
  api: (context): QueueApi => {
    const { store } = context;
    const motion = () => ({ motion: store.get().motion });
    const listFocus = createListFocus<QueueState, ItemProps>(context, {
      slot: "item",
      // Items in a closed section can't take focus, so the Tab stop never hides in one.
      focusable: ({ key }) => {
        const { rowsById, openSections } = store.get();
        const row = rowsById[key];
        return !!row && openSections.includes(row.item.status);
      },
    });

    // The item `reorder` moves, which no draft names.
    let moved: string | undefined;
    const reordering = createReorder<QueueState, ItemProps>(context, {
      slot: "item",
      key: "order",
      draft: "moving",
      disabled: () => !store.get().canReorder,
      label: (key) => store.get().rowsById[key]?.item.title,
      set: (order, details) => {
        const id = moved ?? (store.get().moving as ReorderDraft).key;
        const index = itemsIndex(store.get().items, order, id);
        return !dispatch(context, "onReorder", id, { ...details, index });
      },
    });

    // Web hosts can only set `items` once the element exists, so items in the first frame don't play the entrance.
    // An id is forgotten once its row is dropped, so an item added again enters again.
    let mounting = true;
    const known = new Set(store.get().items.map((item) => item.id));
    const setRows = (rows: LeavingRow<QueueItem>[]) => {
      const ids = new Set(rows.map((row) => row.item.id));
      for (const id of known) if (!ids.has(id)) known.delete(id);
      store.set({ rows, rowsById: byId(rows) });
    };

    // Each item asked to be removed, as it was then: asked again only once the host passes it changed.
    const removing = new Map<string, QueueItem>();
    // The item being sent, as it was then: the lock lifts once the host removes or changes it.
    let sent: QueueItem | undefined;
    const sendLock = createPendingAction(context, { state: "sendPending" });
    const editing = new Set<string>();
    let lastItems = store.get().items;
    context.onOptions((options) => {
      const items = options.items ?? NO_ITEMS;
      if (items === lastItems) return;
      lastItems = items;
      const current = new Map(items.map((item) => [item.id, item]));
      for (const [id, item] of removing) if (current.get(id) !== item) removing.delete(id);
      if (sent && current.get(sent.id) !== sent) {
        sent = undefined;
        sendLock.release();
        store.set({ sending: null });
      }
      setRows(leavingRows(store.get().rows, items, options.motion));
    });

    const rowElements = new Map<string, HTMLElement>();
    const sectionElements = new Set<HTMLElement>();

    const reorder = (id: string, index: number) => {
      if (!Number.isInteger(index) || index < 0 || index >= store.get().items.length) return false;
      const before = store
        .get()
        .items.filter((item) => item.id !== id)
        .slice(0, index);
      moved = id;
      const changed = reordering.move(id, before.filter((item) => item.status === "pending").length);
      moved = undefined;
      return changed;
    };
    const setOpenSections = (openSections: QueueSection[]) => {
      const closed = store.get().openSections.filter((section) => !openSections.includes(section));
      const exitingSections = [
        ...store.get().exitingSections.filter((section) => !openSections.includes(section)),
        ...closed,
      ];
      store.set({ openSections, exitingSections });
    };
    const remove = (id: string, event?: Event) => {
      const item = store.get().items.find((each) => each.id === id);
      if (!item || removing.has(id)) return false;
      const asked = !dispatch(
        context,
        "onRemove",
        id,
        event ? { reason: "remove-press", event } : { reason: "imperative" },
      );
      if (asked) removing.set(id, item);
      return asked;
    };

    const queued = (id: string) =>
      store.get().items.find((item) => item.id === id && item.status === "pending");
    const details = (
      event: Event | undefined,
      reason: QueueItemActionDetails["reason"],
      source?: ChangeSource,
    ): QueueItemActionDetails => ({
      reason,
      ...(event && { event }),
      source: source ?? actionSource(event, reason),
    });
    const send = (id: string, event?: Event) => {
      const { onSend } = context.options();
      const item = queued(id);
      if (!onSend || !item || store.get().sending !== null || store.get().sendDisabledReason) return false;
      const call = details(event, event ? "send-press" : "imperative");
      sent = item;
      store.set({ sending: id });
      void sendLock
        .run(() => onSend(id, call))
        ?.then((outcome) => {
          if (outcome !== "failed") return;
          sent = undefined;
          store.set({ sending: null });
          announce(`${item.title} ${WORDS.notSentYet}`, { priority: "polite" });
        });
      return true;
    };
    const edit = (id: string, event?: Event, source?: ChangeSource) => {
      const { onEdit } = context.options();
      const item = queued(id);
      if (!onEdit || !item || editing.has(id)) return false;
      const call = details(event, source ? "take-back" : event ? "edit-press" : "imperative", source);
      editing.add(id);
      new Promise((resolve) => resolve(onEdit(id, call))).then(
        () => {
          editing.delete(id);
          insertText(context.element("root"), item.title, call.source, "queue-edit");
        },
        () => editing.delete(id),
      );
      return true;
    };
    const takeBack = (source: ChangeSource) => {
      const last = store.get().order.at(-1);
      return last !== undefined && edit(last, undefined, source);
    };

    return {
      ...listFocus,
      get send() {
        const { canSend, sending, order, sendDisabledReason } = store.get();
        return canSend && sending === null && !sendDisabledReason && order.length > 0 ? send : undefined;
      },
      get edit() {
        const { canEdit, order } = store.get();
        return canEdit && order.length > 0 ? edit : undefined;
      },
      takeBack,
      bindDock: (el) => {
        const unlink = bindTextSource(el, {
          takeBack,
          dock: (running) => store.set({ docked: running !== null, running: running ?? false }),
        });
        let filled = store.get().order.length > 0;
        const unsubscribe = store.subscribe(() => {
          const { docked, order, motion } = store.get();
          if (filled === order.length > 0) return;
          filled = !filled;
          if (!docked) return;
          if (filled) {
            if (store.get().closing) store.set({ closing: false });
            void enter(el, "expand", { motion });
            return;
          }
          store.set({ closing: true });
          exit(el, "expand", { motion }).then(
            () => store.set({ closing: false }),
            () => {},
          );
        });
        return () => {
          unsubscribe();
          unlink();
          cancel(el);
        };
      },
      get reorder() {
        const { canReorder, order } = store.get();
        return canReorder && order.length > 1 ? reorder : undefined;
      },
      get remove() {
        const { canRemove, items } = store.get();
        return canRemove && items.length > 0 ? remove : undefined;
      },
      getItems: () => store.get().items,
      reordering,
      getOpenSections: () => store.get().openSections,
      setOpenSections,
      toggleSection: (section) => {
        const { openSections } = store.get();
        setOpenSections(
          openSections.includes(section)
            ? openSections.filter((each) => each !== section)
            : [...openSections, section],
        );
      },
      bindSection: (el, section) =>
        bindStepPanel(el, {
          isOpen: () => store.get().openSections.includes(section),
          isExiting: () => store.get().exitingSections.includes(section),
          motion: () => store.get().motion,
          reveal: () => setOpenSections([...store.get().openSections, section]),
          trigger: () => context.element("section-trigger", section),
          subscribe: store.subscribe,
          exited: () =>
            store.set({ exitingSections: store.get().exitingSections.filter((each) => each !== section) }),
        }),
      bindSectionBox: (el) => {
        sectionElements.add(el);
        return () => void sectionElements.delete(el);
      },
      bindItem: (el, part) => {
        const { key } = part;
        rowElements.set(key, el);
        if (!known.has(key)) {
          known.add(key);
          if (!mounting) void enter(el, "fade-up", motion());
        }
        const unbind = bindLeavingRow(el, {
          store,
          isLeaving: () => store.get().rowsById[key]?.leaving ?? false,
          motion,
          join: () => {
            const pending = store.get().rowsById[key]?.item.status === "pending";
            const joined = [
              listFocus.roving.bind(el, part),
              listFocus.recovery.bind(el, part),
              ...(pending ? [reordering.bind(el, part)] : []),
            ];
            return () => {
              for (const unjoin of joined) unjoin();
            };
          },
          drop: () => setRows(dropRow(store.get().rows, key)),
        });
        return () => {
          unbind();
          if (rowElements.get(key) === el) rowElements.delete(key);
        };
      },
      bindRoot: () => {
        const mounted = requestAnimationFrame(() => {
          mounting = false;
        });
        let measured: Map<HTMLElement, DOMRect> | undefined;
        let frame = 0;
        let { rows, moving } = store.get();
        const unsubscribe = store.subscribe(() => {
          const state = store.get();
          if (state.rows === rows && state.moving === moving) return;
          ({ rows, moving } = state);
          if (measured || resolvedMotion(state.motion) !== "full") return;
          measured = new Map(
            [...rowElements.values(), ...sectionElements].map((el) => [el, el.getBoundingClientRect()]),
          );
          frame = requestAnimationFrame(() => {
            const before = measured as Map<HTMLElement, DOMRect>;
            measured = undefined;
            // A section only slides: it keeps its new size, so its rows aren't scaled.
            const sections = new Map<HTMLElement, DOMRect>();
            for (const section of sectionElements) {
              const was = before.get(section);
              const now = section.getBoundingClientRect();
              if (was) sections.set(section, new DOMRect(was.x, was.y, now.width, now.height));
            }
            // A row moves within its section, so it starts from where it was less its section's own move.
            for (const [key, el] of rowElements) {
              const rect = before.get(el);
              // A dragged row follows the pointer instead.
              if (!rect || !el.checkVisibility() || reordering.dragging(store.get(), key)) continue;
              const section = [...sectionElements].find((each) => each.contains(el));
              const was = section && before.get(section);
              const now = section?.getBoundingClientRect();
              const shift = was && now ? { x: now.x - was.x, y: now.y - was.y } : { x: 0, y: 0 };
              void layout(
                el,
                new DOMRect(rect.x + shift.x, rect.y + shift.y, rect.width, rect.height),
                motion(),
              );
            }
            for (const [section, rect] of sections)
              if (section.checkVisibility()) void layout(section, rect, motion());
          });
        });
        return () => {
          cancelAnimationFrame(mounted);
          cancelAnimationFrame(frame);
          unsubscribe();
        };
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "region",
      attrs: (state) => ({
        "aria-label": state.label,
        "data-docked": state.docked ? "" : undefined,
        "data-running": state.running ? "" : undefined,
        "data-empty": state.order.length === 0 && !state.closing ? "" : undefined,
        "data-motion": state.motion,
      }),
      bind: (el, { api }) => {
        const unbindRoot = api.bindRoot();
        const unbindDock = api.bindDock(el);
        return () => {
          unbindRoot();
          unbindDock();
        };
      },
    }),
    section: slot<ItemProps, QueueSectionState>({
      props: { value: "string" },
      state: (state, { key }) => queueSection(state, key as QueueSection),
      attrs: (state, { key }) => ({
        "data-section": key,
        "data-empty": state.rows.some((row) => row.item.status === key) ? undefined : "",
        ...openAttrs(state.openSections.includes(key as QueueSection)),
      }),
      bind: (el, { api }) => api.bindSectionBox(el),
    }),
    "section-trigger": slot<InnerProps, QueueSectionState>({
      role: "button",
      focus: "native",
      props: fromSection,
      press: ({ api, key }) => api.toggleSection(key as QueueSection),
      state: (state, { key }) => queueSection(state, key as QueueSection),
      attrs: (state, { id, key }) => {
        const open = state.openSections.includes(key as QueueSection);
        return {
          type: "button",
          "aria-expanded": String(open),
          "aria-controls": `${id}-section-${key}`,
          "data-step-part": "trigger",
          ...openAttrs(open),
        };
      },
    }),
    "section-content": slot<InnerProps>({
      props: fromSection,
      attrs: (state, { id, key }) => {
        const section = key as QueueSection;
        const open = state.openSections.includes(section);
        return {
          id: `${id}-section-${key}`,
          "data-step-part": "content",
          "data-motion": state.motion,
          ...openAttrs(open),
          ...hiddenAttrs(open || state.exitingSections.includes(section), true),
        };
      },
      bind: (el, { api, key }) => api.bindSection(el, key as QueueSection),
    }),
    list: slot<InnerProps, { rows: LeavingRow<QueueItem>[] }>({
      role: "list",
      props: fromSection,
      state: (state, { key }) => {
        const section = key as QueueSection;
        return { rows: rowsOf[section](state.rows, state.moving, section) };
      },
      attrs: (state, { key }) => ({
        "aria-roledescription": key === "pending" && state.canReorder ? "sortable list" : undefined,
        "data-section": key,
      }),
    }),
    item: slot<ItemProps, { item: QueueItem | undefined }>({
      role: "listitem",
      focus: "roving",
      props: { value: "string" },
      state: (state, { key }) => ({ item: state.rowsById[key]?.item }),
      attrs: (state, part) => {
        const row = state.rowsById[part.key];
        const sortable = state.canReorder && row?.item.status === "pending";
        const name = state.docked ? queueItemName(state, part.key) : undefined;
        const described = sortable || state.canRemove;
        return {
          tabindex: part.api.roving.tabIndex(state, part),
          "aria-label": name,
          "aria-roledescription": sortable ? "sortable item" : undefined,
          "aria-describedby":
            [name && `${part.id}-title-${part.key}`, described && `${part.id}-instructions`]
              .filter(Boolean)
              .join(" ") || undefined,
          "aria-keyshortcuts": state.canRemove ? "Delete" : undefined,
          "aria-busy": state.sending === part.key && state.sendPending ? "true" : undefined,
          "data-sending": state.sending === part.key ? "" : undefined,
          "aria-hidden": row?.leaving ? "true" : undefined,
          "data-status": row?.item.status,
          "data-sortable": sortable ? "" : undefined,
          "data-leaving": row?.leaving ? "" : undefined,
          "data-grabbed": part.api.reordering.moving(state, part.key) ? "" : undefined,
          "data-dragging": part.api.reordering.dragging(state, part.key) ? "" : undefined,
        };
      },
      on: {
        // A picked-up item takes every key, as in UI SDK's sortable list; then Delete, then arrows between items.
        keydown: (event, { el, api, key }) => {
          const press = event as KeyboardEvent;
          // A row's own buttons keep their keys, but the arrows still move between rows.
          const own = press.target === el;
          if (own && api.reordering.keydown(press, key)) return;
          if (own && (press.key === "Delete" || press.key === "Backspace") && api.remove) {
            press.preventDefault();
            api.remove(key, press);
          } else if (el) {
            api.roving.keydown(press, el);
          }
        },
        pointerdown: (event, { api, key }) => api.reordering.pointerdown(event as PointerEvent, key),
      },
      bind: (el, part) => part.api.bindItem(el, part),
    }),
    "item-icon": slot<InnerProps>({
      props: fromItem,
      // Completed rows keep the check. Every queued row is pending, so a mark there says nothing: the grip takes its
      // place, drawn only while rows can move.
      attrs: (state, { key }) => {
        const status = state.rowsById[key]?.item.status;
        const complete = status === "complete";
        return {
          "aria-hidden": "true",
          "data-status-mark": complete ? "" : undefined,
          "data-status": complete ? status : undefined,
          "data-queue-grip": complete ? undefined : "",
          "data-motion": state.motion,
        };
      },
    }),
    "item-title": slot<InnerProps, { title: string }>({
      props: fromItem,
      state: (state, { key }) => ({ title: state.rowsById[key]?.item.title ?? "" }),
      attrs: (_state, { id, key }) => ({ id: `${id}-title-${key}` }),
    }),
    "item-description": slot<InnerProps, { description: string }>({
      props: fromItem,
      state: (state, { key }) => ({ description: state.rowsById[key]?.item.description ?? "" }),
    }),
    // A queued row's buttons: Tab reaches the focused row's, and they show on hover or focus, always on touch.
    "item-send": slot<InnerProps>({
      role: "button",
      focus: "native",
      props: fromItem,
      present: (state, { key }) => state.canSend && state.rowsById[key]?.item.status === "pending",
      press: ({ api, key }, event) => api.send?.(key, event),
      on: { pointerdown: (event) => event.preventDefault() },
      attrs: (state, part) => ({
        type: "button",
        tabindex: part.api.roving.tabIndex(state, { ...part, props: { value: part.key } }),
        "aria-label": WORDS.sendNow,
        title: state.sendDisabledReason ?? (state.running ? WORDS.steerTooltip : WORDS.sendNow),
        "aria-disabled": state.sending !== null || state.sendDisabledReason ? "true" : undefined,
        "data-pending": state.sending === part.key && state.sendPending ? "" : undefined,
        "data-queue-action": "send",
      }),
    }),
    "item-edit": slot<InnerProps>({
      role: "button",
      focus: "native",
      props: fromItem,
      present: (state, { key }) => state.canEdit && state.rowsById[key]?.item.status === "pending",
      press: ({ api, key }, event) => api.edit?.(key, event),
      on: { pointerdown: (event) => event.preventDefault() },
      attrs: (state, part) => ({
        type: "button",
        tabindex: part.api.roving.tabIndex(state, { ...part, props: { value: part.key } }),
        "aria-label": "Edit",
        title: "Edit",
        "data-queue-action": "edit",
      }),
    }),
    "item-remove": slot<InnerProps>({
      role: "button",
      focus: "native",
      props: fromItem,
      present: (state) => state.canRemove,
      press: ({ api, key }, event) => api.remove?.(key, event),
      // A handled pointerdown doesn't start a reorder, which would capture the pointer and take the click.
      on: { pointerdown: (event) => event.preventDefault() },
      attrs: (state, part) => ({
        type: "button",
        tabindex: part.api.roving.tabIndex(state, { ...part, props: { value: part.key } }),
        "aria-label": "Remove",
        title: "Remove",
        "data-queue-action": "remove",
      }),
    }),
    instructions: slot<BaseSlotProps, { text: string }>({
      state: (state) => ({ text: queueInstructions(state) }),
      attrs: (_state, { id }) => ({ id: `${id}-instructions` }),
    }),
  }),
  // Items are listed by title, so an agent can name one to move or remove, and an unknown one is refused.
  agent: {
    actions: ["reorder", "remove", "send", "edit"],
    items: (api: QueueApi) => api.getItems().map((item) => ({ value: item.id, label: item.title })),
    closed: true,
  },
});
