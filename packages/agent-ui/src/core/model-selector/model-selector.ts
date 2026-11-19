import { definePrimitive } from "@ui-sdk/core";
import type { ModelOption, PickerItem } from "../../types/index.js";
import { cached } from "../memo.js";
import {
  type PickerBaseApi,
  type PickerBaseOptions,
  type PickerBaseSlots,
  type PickerBaseState,
  type PickerValueChangeReason,
  pickerBase,
} from "../picker/base.js";

/** `"item-press"`: a person chose a model in the list. `"imperative"`: an `api` call, like an agent's `setValue`. */
export type ModelSelectorValueChangeReason = PickerValueChangeReason;

export type ModelSelectorOptions = Omit<PickerBaseOptions, "label" | "placeholder" | "emptyText"> & {
  /**
   * The models to choose from, grouped by their `group` in the order groups first appear. The primitive passes each
   * `icon` through to the render layer untouched.
   * @default []
   */
  models?: ModelOption<unknown>[];
  /**
   * `"groups"` lists each `group` as a row that opens a page of its models, shown with the first icon among them and
   * found by their names, so a model `id` mustn't start with `group:`. `"flat"` lists every model under its group's
   * label.
   * @default "flat"
   */
  pages?: "flat" | "groups";
  /**
   * Names the trigger, with the chosen model's name after it, and the search field.
   * @default "Model"
   */
  label?: string;
  /**
   * Shown in the empty search field.
   * @default "Search models"
   */
  placeholder?: string;
  /**
   * Shown while no model matches the search.
   * @default "No models found"
   */
  emptyText?: string;
};

export type ModelSelectorState = PickerBaseState;
export type ModelSelectorApi = PickerBaseApi;
type ModelSelectorSlots = PickerBaseSlots<ModelSelectorState, ModelSelectorApi>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ModelSelectorPrimitive = ReturnType<
  typeof definePrimitive<ModelSelectorOptions, ModelSelectorState, ModelSelectorApi, ModelSelectorSlots>
>;

const noModels: ModelOption<unknown>[] = [];

// A provider row's value, apart from model ids, since rows and pages share one set of values.
const groupValue = (group: string) => `group:${group}`;

const itemOf = (
  { id, name, group, description, icon, disabled }: ModelOption<unknown>,
  flat: boolean,
): PickerItem<unknown> => ({
  value: id,
  label: name,
  ...(description === undefined ? {} : { description }),
  ...(icon === undefined ? {} : { icon }),
  ...(disabled === undefined ? {} : { disabled }),
  // A search for the provider finds its models.
  ...(flat && group !== undefined ? { group, keywords: [group] } : {}),
});

const flat = new WeakMap<ModelOption<unknown>[], PickerItem<unknown>[]>();
const grouped = new WeakMap<ModelOption<unknown>[], PickerItem<unknown>[]>();

/** Each group as a row that opens a page of its models; models without a group stay on the first page. */
const groupItems = (models: ModelOption<unknown>[]) => {
  const items: PickerItem<unknown>[] = [];
  const groups = new Map<
    string,
    PickerItem<unknown> & { items: PickerItem<unknown>[]; keywords: string[] }
  >();
  for (const model of models) {
    if (model.group === undefined) {
      items.push(itemOf(model, false));
      continue;
    }
    let row = groups.get(model.group);
    if (!row) {
      row = { value: groupValue(model.group), label: model.group, items: [], keywords: [] };
      groups.set(model.group, row);
      items.push(row);
    }
    row.icon ??= model.icon;
    row.items.push(itemOf(model, false));
    // Command searches only the open page, so a provider row is found by its models' names.
    row.keywords.push(model.name, ...(model.description ? [model.description] : []));
  }
  return items;
};

/** The models as picker items, kept while the host keeps its `models` array. */
const toItems = (models: ModelOption<unknown>[], pages: "flat" | "groups") =>
  pages === "groups"
    ? cached(grouped, models, groupItems)
    : cached(flat, models, (all) => all.map((model) => itemOf(model, true)));

const base = pickerBase<ModelSelectorOptions>({
  kind: "model-selector",
  label: "Model",
  placeholder: "Search models",
  emptyText: "No models found",
  toItems: (options) => toItems(options.models ?? noModels, options.pages ?? "flat"),
});

/**
 * A button that shows the chosen model and opens a searchable list of models grouped by provider, built on Picker:
 * the search sits in the popup, and `actions` add footer rows like "More models".
 */
export const modelSelectorPrimitive: ModelSelectorPrimitive = definePrimitive<
  ModelSelectorOptions,
  ModelSelectorState,
  ModelSelectorApi,
  ModelSelectorSlots
>({
  name: "kind-model-selector",
  options: { ...base.options, models: "value", pages: "string" },
  state: base.state,
  sync: base.sync,
  controlled: base.controlled,
  api: base.api,
  slots: (slot) => base.slots(slot),
  agent: base.agent,
});
