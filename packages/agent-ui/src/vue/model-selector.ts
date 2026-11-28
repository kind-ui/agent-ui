import { type ModelSelectorOptions, modelSelectorPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h, type VNode } from "vue";
import { pickerParts } from "./picker.js";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onAction`, whose presence offers `run`, is declared a function prop instead, which `@action` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => modelSelectorPrimitive(options), modelSelectorPrimitive, {
    options: { ...modelSelectorPrimitive.options, onAction: "action" },
  }),
  "name",
  { value: modelSelectorPrimitive.name },
) as typeof modelSelectorPrimitive;

const parts = createParts(primitive, {
  root: "div",
  trigger: "button",
  content: "div",
  viewport: "div",
  command: "div",
  item: "span",
  note: "p",
});

const picker = pickerParts(parts, "ModelSelector");

/** A model, whose `icon` is an image URL or a node such as an inline `svg`. */
export type ModelSelectorModel = Omit<NonNullable<ModelSelectorOptions["models"]>[number], "icon"> & {
  icon?: string | VNode;
};

/**
 * A button that shows the chosen model and its icon, and opens a searchable list of models grouped by provider, with
 * footer `actions`. A default slot replaces the trigger and the list.
 */
export const ModelSelector = defineComponent({
  name: "ModelSelector",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Root, attrs, { ...slots, default: slots.default ?? picker.Default });
  },
}) as unknown as typeof parts.Root;

/** Opens the list. Shows the chosen model's icon and name, or the `label` while none is chosen, unless you pass a slot. */
export const ModelSelectorTrigger = picker.Trigger;
/** The popover: the search field and the list, unless you pass a slot. Focus moves to the search field. */
export const ModelSelectorContent = picker.Content;
/** UI SDK Command: the search field, the empty text, and every page of rows unless you pass a slot. */
export const ModelSelectorList = picker.List;
/** A group of rows under its label, or the footer. */
export const ModelSelectorSectionRows = picker.SectionRows;
/** A row: UI SDK's `CommandItem` with the row's props, holding its `ModelSelectorItem` unless you pass a slot. */
export const ModelSelectorRowItem = picker.RowItem;
/** A row's content: the model's icon, its marked name, its description, and a check when chosen. */
export const ModelSelectorItem = picker.Item;
