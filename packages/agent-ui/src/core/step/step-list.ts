import { definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { createListFocus, type ListFocus } from "../list-focus.js";

export type StepListOptions = Record<never, never>;

export type StepListState = { focused: string | null };

type ItemProps = { value: string };

export type StepListApi = ListFocus<StepListState, ItemProps>;

type StepListSlot<Props extends object> = SlotDefinition<
  StepListState,
  StepListApi,
  Props,
  Record<never, never>
>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type StepListPrimitive = ReturnType<
  typeof definePrimitive<
    StepListOptions,
    StepListState,
    StepListApi,
    { root: StepListSlot<BaseSlotProps>; item: StepListSlot<ItemProps & BaseSlotProps> }
  >
>;

export const stepListPrimitive: StepListPrimitive = definePrimitive({
  name: "kind-step-list",
  state: (): StepListState => ({ focused: null }),
  api: (context): StepListApi => createListFocus<StepListState, ItemProps>(context, { slot: "item" }),
  slots: (slot) => ({
    root: slot({ role: "group", attrs: () => ({ "data-step-part": "list" }) }),
    item: slot<ItemProps>({
      props: { value: "string" },
      focus: "roving",
      attrs: (state, part) => ({ tabindex: part.api.roving.tabIndex(state, part) }),
      on: {
        keydown: (event, { el, api }) => {
          if (el) api.roving.keydown(event as KeyboardEvent, el);
        },
      },
      bind: (el, part) => {
        const unbindFocus = part.api.roving.bind(el, part);
        const unbindRecovery = part.api.recovery.bind(el, part);
        return () => {
          unbindFocus();
          unbindRecovery();
        };
      },
    }),
  }),
  agent: { actions: [] },
});
