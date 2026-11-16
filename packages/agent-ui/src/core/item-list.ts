import { announce, type PrimitiveContext, type SlotFactory, selects } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { StepStatus } from "../types/index.js";
import { createListFocus, type ListFocus } from "./list-focus.js";
import { memo } from "./memo.js";
import { enter } from "./motion/index.js";
import { type StepApi, type StepOptions, type StepState, stepAnnouncement, stepBase } from "./step/base.js";

/** An entry of a Task's or Plan's `items`. */
export type ListItem = { id: string; title: string; status: string };

export type ItemProgress = { done: number; total: number; percent: number };

/** How many of `items` have a status in `done`, and that share as a whole percent: 0 for an empty list. */
export const itemProgress = (items: readonly { status: string }[], done: readonly string[]): ItemProgress => {
  const count = items.filter((item) => done.includes(item.status)).length;
  return {
    done: count,
    total: items.length,
    percent: items.length === 0 ? 0 : Math.round((count / items.length) * 100),
  };
};

/**
 * The status the items add up to: `error` once one fails, `complete` once every one is done, `running` once one
 * runs or is done, else `pending`.
 */
export const itemsStatus = (items: readonly { status: string }[], done: readonly string[]): StepStatus => {
  if (items.some((item) => item.status === "error")) return "error";
  const { done: count, total } = itemProgress(items, done);
  if (total > 0 && count === total) return "complete";
  return count > 0 || items.some((item) => item.status === "running") ? "running" : "pending";
};

export type ItemListOptions<Item extends ListItem> = Omit<StepOptions, "status" | "label"> & {
  /** The items, in order. Update an item's `status` as it runs, keeping its `id`. Defaults to none. */
  items?: Item[];
  /** Defaults to what the items add up to: `error` once one fails, `complete` once all are done, else `running` or `pending`. */
  status?: StepStatus;
  /** The title, which also names it in announcements. Defaults to "Task" or "Plan". */
  label?: string;
};

export type ItemListState<Item extends ListItem> = StepState & {
  /** The `label`, else the component's name. */
  title: string;
  /** The `items` option, which the list renders in order. */
  items: Item[];
  /** The items by id, so an item's update reaches only its own parts. */
  itemsById: Record<string, Item>;
  /** How many items are done. */
  progress: ItemProgress;
  /** The item that holds the list's Tab stop. */
  focused: string | null;
};

type ItemProps = { value: string };
/** A part inside an item, which takes the item's `value`. */
export type ItemPartProps = { value?: string };

export type ItemListApi<Item extends ListItem, State extends ItemListState<Item>> = StepApi &
  ListFocus<State, ItemProps> & {
    /** The `items` option. */
    getItems: () => Item[];
    /** Plays an item's entrance when it arrives after the first frame. Called by the item slot. */
    bindItem: (el: HTMLElement, id: string) => void;
    /** Starts counting items as new after the first frame. Called by the root slot. */
    bindRoot: () => () => void;
  };

/** The prop of a part inside an item. */
export const fromItem = { value: { kind: "string", from: "item" } } as const;

/** An item's parts hear only about their own item. */
export const ownItem = <State extends ItemListState<ListItem>, Api>() =>
  selects<State, Api, ItemPartProps>({
    itemsById: ({ key }) => [key],
    items: [],
    title: [],
    progress: [],
    // TypeScript can't map the keys of a `State` that only extends ItemListState.
  } as Parameters<typeof selects<State, Api, ItemPartProps>>[0]);

const ITEM_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  running: "Running",
  complete: "Complete",
  error: "Failed",
  skipped: "Skipped",
};

/**
 * Everything but the name of Task and Plan (spec §7): the Step base, with a list of items whose statuses add up to
 * the step's, each a focusable `listitem` in one Tab stop. Steps and items that end in one update are announced
 * together, as Chain of Thought's are.
 */
export const itemList = <
  Item extends ListItem,
  State extends ItemListState<Item>,
  Api extends ItemListApi<Item, State>,
  Options extends ItemListOptions<Item>,
>({
  kind,
  title: defaultTitle,
  done,
}: {
  kind: string;
  /** The title without a `label`. */
  title: string;
  /** The item statuses that count as done. */
  done: readonly string[];
}) => {
  const noItems: Item[] = [];
  const byId = memo((items: Item[]) => Object.fromEntries(items.map((item) => [item.id, item])));
  const progressOf = memo((items: Item[]) => itemProgress(items, done));
  const base = stepBase<State, Api, Options>({
    kind,
    status: (options) => itemsStatus(options.items ?? noItems, done),
    announcement: () => undefined,
  });
  const presentation = ({ items = noItems, label }: Options) => ({
    title: label ?? defaultTitle,
    items,
    itemsById: byId(items),
    progress: progressOf(items),
  });
  const own = ownItem<State, Api>();

  return {
    ...base,
    options: { ...base.options, items: "value" } as const,
    state: (options: Options): ItemListState<Item> => ({
      ...base.state(options),
      ...presentation(options),
      focused: null,
    }),
    sync: (options: Options) => ({ ...base.sync(options), ...presentation(options) }) as Partial<State>,
    api: (context: PrimitiveContext<Options, State, string>): ItemListApi<Item, State> => {
      const { store } = context;
      let prevItems = store.get().items;
      let prevStatus = store.get().status;
      // Web hosts can only set `items` once the element exists, so items in the first frame count as known: they
      // don't play the entrance or announce.
      let mounting = true;
      const known = new Set(prevItems.map((item) => item.id));

      context.onOptions((options, synced) => {
        const texts: string[] = [];
        const items = options.items ?? noItems;
        if (items !== prevItems) {
          const statuses = new Map(prevItems.map((item) => [item.id, item.status]));
          prevItems = items;
          for (const item of items) {
            if (mounting || !item.title || item.status === (statuses.get(item.id) ?? "pending")) continue;
            const text = stepAnnouncement(item.status as StepStatus, item.title);
            if (text) texts.push(text);
          }
        }
        const status = synced?.status ?? prevStatus;
        if (status !== prevStatus) {
          prevStatus = status;
          const text = stepAnnouncement(status, options.label ?? defaultTitle);
          if (text) texts.push(text);
        }
        // A polite announcement replaces one still waiting, so items that end with the list are read as one.
        if (texts.length) announce(texts.join(". "), { priority: "polite" });
      });

      return {
        ...base.api(context),
        ...createListFocus<State, ItemProps>(context, { slot: "item" }),
        getItems: () => store.get().items,
        bindItem: (el, id) => {
          if (known.has(id)) return;
          known.add(id);
          if (!mounting) void enter(el, "fade-up", { motion: store.get().motion });
        },
        bindRoot: () => {
          const frame = requestAnimationFrame(() => {
            mounting = false;
          });
          return () => cancelAnimationFrame(frame);
        },
      };
    },
    slots: (slot: SlotFactory<State, Api>) => {
      const { root, trigger, icon, title, meta, content } = base.slots(slot);
      return {
        root: slot({ ...root, bind: (_el, { api }) => api.bindRoot() }),
        trigger,
        icon,
        title: slot<BaseSlotProps, { title: string }>({
          ...title,
          state: (state) => ({ title: state.title }),
        }),
        meta: slot<BaseSlotProps, { done: number; total: number }>({
          ...meta,
          state: ({ progress }) => ({ done: progress.done, total: progress.total }),
        }),
        content,
        list: slot<BaseSlotProps, { items: Item[] }>({
          role: "list",
          attrs: () => ({ "data-step-part": "list" }),
          state: (state) => ({ items: state.items }),
        }),
        item: slot<ItemProps & BaseSlotProps, { status: string }>({
          role: "listitem",
          focus: "roving",
          props: { value: "string" },
          selects: own,
          state: (state, { key }) => ({ status: state.itemsById[key]?.status ?? "pending" }),
          attrs: (state, part) => {
            const status = state.itemsById[part.key]?.status ?? "pending";
            return {
              tabindex: part.api.roving.tabIndex(state, part),
              "aria-current": status === "running" ? "step" : undefined,
              "data-step-part": "item",
              "data-status": status,
            };
          },
          on: {
            keydown: (event, { el, api }) => {
              if (el) api.roving.keydown(event as KeyboardEvent, el);
            },
          },
          bind: (el, part) => {
            part.api.bindItem(el, part.key);
            const unbindFocus = part.api.roving.bind(el, part);
            const unbindRecovery = part.api.recovery.bind(el, part);
            return () => {
              unbindFocus();
              unbindRecovery();
            };
          },
        }),
        // Named by its status, since every status needs text as well as a mark (spec §8).
        "item-icon": slot<ItemPartProps & BaseSlotProps>({
          role: "img",
          props: fromItem,
          selects: own,
          attrs: (state, { key }) => {
            const status = state.itemsById[key]?.status ?? "pending";
            return {
              "aria-label": ITEM_STATUS_LABELS[status] ?? status,
              "data-step-part": "icon",
              "data-status-mark": "",
              "data-status": status,
              "data-motion": state.motion,
            };
          },
        }),
        "item-title": slot<ItemPartProps & BaseSlotProps, { title: string }>({
          props: fromItem,
          selects: own,
          state: (state, { key }) => ({ title: state.itemsById[key]?.title ?? "" }),
          attrs: (state, { key }) => ({
            "data-step-part": "title",
            "data-status": state.itemsById[key]?.status ?? "pending",
            "data-motion": state.motion,
          }),
        }),
      };
    },
  };
};
