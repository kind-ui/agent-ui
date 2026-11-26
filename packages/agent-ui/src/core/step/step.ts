import type { SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { definePrimitive } from "../define-primitive.js";
import { type StepApi, type StepOptions, type StepState, stepBase } from "./base.js";

type StepSlot = SlotDefinition<StepState, StepApi, BaseSlotProps, Record<never, never>>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type StepPrimitive = ReturnType<
  typeof definePrimitive<
    StepOptions,
    StepState,
    StepApi,
    Record<"root" | "trigger" | "icon" | "title" | "meta" | "content" | "children", StepSlot>
  >
>;

export const stepPrimitive: StepPrimitive = definePrimitive({ name: "kind-step", ...stepBase() });
