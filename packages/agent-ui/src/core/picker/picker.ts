import { definePrimitive } from "@ui-sdk/core";
import type { PickerItem } from "../../types/index.js";
import {
  type PickerBaseApi,
  type PickerBaseOptions,
  type PickerBaseSlots,
  type PickerBaseState,
  pickerBase,
} from "./base.js";

export type PickerOptions = PickerBaseOptions & {
  /**
   * The rows to choose from, grouped by their `group` in the order groups first appear. An item with `items` opens a
   * page of them. Every `value` is unique across all pages. The primitive passes each `icon` through untouched.
   * @default []
   */
  items?: PickerItem<unknown>[];
};

export type PickerState = PickerBaseState;
export type PickerApi = PickerBaseApi;
type PickerSlots = PickerBaseSlots<PickerState, PickerApi>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type PickerPrimitive = ReturnType<
  typeof definePrimitive<PickerOptions, PickerState, PickerApi, PickerSlots>
>;

const noItems: PickerItem<unknown>[] = [];

const base = pickerBase<PickerOptions>({
  kind: "picker",
  label: "Choose",
  toItems: (options) => options.items ?? noItems,
});

export const pickerPrimitive: PickerPrimitive = definePrimitive<
  PickerOptions,
  PickerState,
  PickerApi,
  PickerSlots
>({
  name: "kind-picker",
  options: { ...base.options, items: "value" },
  state: base.state,
  sync: base.sync,
  controlled: base.controlled,
  api: base.api,
  slots: (slot) => base.slots(slot),
  agent: base.agent,
});
