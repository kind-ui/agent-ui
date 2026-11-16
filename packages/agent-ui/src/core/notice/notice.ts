import { definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { type NoticeApi, type NoticeOptions, type NoticeState, noticeBase } from "./base.js";

type Slot<Public extends object = Record<never, never>> = SlotDefinition<
  NoticeState,
  NoticeApi,
  BaseSlotProps,
  Public
>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type NoticePrimitive = ReturnType<
  typeof definePrimitive<
    NoticeOptions,
    NoticeState,
    NoticeApi,
    {
      root: Slot;
      icon: Slot;
      title: Slot<{ label: string }>;
      description: Slot;
      actions: Slot;
      dismiss: Slot;
    }
  >
>;

export const noticePrimitive: NoticePrimitive = definePrimitive({
  name: "kind-notice",
  ...noticeBase(),
});
