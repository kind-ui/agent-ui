import { type PickerRow, pickerPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";
import { getContext, type Snippet, setContext } from "svelte";

export const parts = createParts(pickerPrimitive, {
  root: "div",
  trigger: "button",
  content: "div",
  viewport: "div",
  command: "div",
  item: "span",
  note: "p",
});

/** The parts a picker renders through: Picker's, or those of a component that spreads `pickerBase`. */
export type PickerParts = Pick<
  typeof parts,
  "Trigger" | "Content" | "Viewport" | "Command" | "Item" | "Note"
>;

/**
 * How a picker draws its parts, which its root hands the parts inside it. `icon` draws a row's icon (an image URL
 * or a snippet by default; `null` draws none), and `trailing` what follows its `meta`.
 */
export type PickerConfig = {
  parts: PickerParts;
  icon?: Snippet<[PickerRow]> | null;
  trailing?: Snippet<[PickerRow]>;
};

const key = Symbol("kind-picker");

/** Lets the Picker parts inside render through `config.parts`, for components that spread `pickerBase`. */
export const setPickerConfig = (config: PickerConfig) => setContext(key, config);
export const pickerConfig = () => getContext<PickerConfig>(key);
