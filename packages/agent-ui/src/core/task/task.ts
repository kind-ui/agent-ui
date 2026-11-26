import type { SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { TaskItem } from "../../types/index.js";
import { definePrimitive } from "../define-primitive.js";
import {
  fromItem,
  type ItemListApi,
  type ItemListOptions,
  type ItemListState,
  type ItemPartProps,
  itemList,
  ownItem,
} from "../item-list.js";

export type TaskOptions = ItemListOptions<TaskItem>;

export type TaskState = ItemListState<TaskItem>;

export type TaskApi = ItemListApi<TaskItem, TaskState>;

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<TaskState, TaskApi, Props, Public>;

type ItemSlot<Public extends object = Record<never, never>> = Slot<ItemPartProps & BaseSlotProps, Public>;

type TaskSlots = {
  root: Slot;
  trigger: Slot;
  icon: Slot;
  title: Slot<BaseSlotProps, { title: string }>;
  meta: Slot<BaseSlotProps, { done: number; total: number }>;
  content: Slot;
  list: Slot<BaseSlotProps, { items: TaskItem[] }>;
  item: Slot<{ value: string } & BaseSlotProps, { status: string }>;
  "item-icon": ItemSlot;
  "item-title": ItemSlot<{ title: string }>;
  "item-files": ItemSlot<{ files: string[] }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type TaskPrimitive = ReturnType<typeof definePrimitive<TaskOptions, TaskState, TaskApi, TaskSlots>>;

const NO_FILES: string[] = [];

const list = itemList<TaskItem, TaskState, TaskApi, TaskOptions>({
  kind: "task",
  title: "Task",
  done: ["complete"],
});

export const taskPrimitive: TaskPrimitive = definePrimitive<TaskOptions, TaskState, TaskApi, TaskSlots>({
  name: "kind-task",
  ...list,
  slots: (slot) => ({
    ...list.slots(slot),
    "item-files": slot<ItemPartProps & BaseSlotProps, { files: string[] }>({
      props: fromItem,
      selects: ownItem<TaskState, TaskApi>(),
      present: (state, { key }) => (state.itemsById[key]?.files?.length ?? 0) > 0,
      state: (state, { key }) => ({ files: state.itemsById[key]?.files ?? NO_FILES }),
      attrs: () => ({ "data-step-part": "files" }),
    }),
  }),
});
