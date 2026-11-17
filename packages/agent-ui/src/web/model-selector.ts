import {
  type ModelSelectorApi,
  type ModelSelectorOptions,
  type ModelSelectorValueChangeReason,
  modelSelectorPrimitive,
  type PickerOpenChangeReason,
  type PickerOptions,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineInternalCommand } from "./internal/command.js";
import { pickerElements } from "./picker.js";

type ModelIcon = string | Element;

/**
 * `<kind-model-selector>` fills in its trigger and list when it has no children. Set `models`, `actions` and `value`
 * as properties; choosing a model fires `modelchange` with its id as `detail.value`, and with `can-run`, an action
 * fires `modelaction` with its `id`.
 */
export function defineModelSelector(): void {
  if (customElements.get("kind-model-selector")) return;
  defineInternalCommand();
  createParts(
    modelSelectorPrimitive,
    pickerElements<typeof modelSelectorPrimitive>("kind-model-selector", {
      onValueChange: "modelchange",
      onAction: "modelaction",
    }),
  );
}

export type KindModelSelectorEvents = {
  modelchange: UiChangeEvent<string, ModelSelectorValueChangeReason>;
  modelaction: UiChangeEvent<string, ModelSelectorValueChangeReason>;
  openchange: UiChangeEvent<boolean, PickerOpenChangeReason>;
};

export interface KindModelSelectorElement
  extends UiElement<KindModelSelectorEvents>,
    AttributeProperties<
      typeof modelSelectorPrimitive,
      "api" | "models" | "actions" | "value" | "defaultValue" | "open"
    > {
  /**
   * A model's `icon` is an image URL, or an element (such as an `svg`) copied into its row and the trigger. A copy
   * keeps the element's ids, so pass a logo that uses `defs` (gradients, masks) as an image URL.
   */
  models?: (Omit<NonNullable<ModelSelectorOptions["models"]>[number], "icon"> & { icon?: ModelIcon })[];
  actions?: (Omit<NonNullable<PickerOptions["actions"]>[number], "icon"> & { icon?: ModelIcon })[];
  get value(): string | null;
  set value(id: string);
  defaultValue?: string | null;
  open: boolean;
  /** Whether a person can run the `actions`, which fires `modelaction`. */
  canRun: boolean;
  api: Pick<ModelSelectorApi, "isOpen" | "setOpen" | "getValue">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-model-selector": KindModelSelectorElement;
    "kind-model-selector-trigger": HTMLElement;
    "kind-model-selector-content": HTMLElement;
    "kind-model-selector-viewport": HTMLElement;
    "kind-model-selector-command": HTMLElement;
    "kind-model-selector-item": HTMLElement;
  }
}
