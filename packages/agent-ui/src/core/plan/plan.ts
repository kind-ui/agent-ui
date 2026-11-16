import { createFocusRecovery, definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { PlanItem } from "../../types/index.js";
import {
  fromItem,
  type ItemListApi,
  type ItemListOptions,
  type ItemListState,
  type ItemPartProps,
  itemList,
  ownItem,
} from "../item-list.js";
import { createPendingAction } from "../pending.js";

export type PlanOptions = ItemListOptions<PlanItem> & {
  /**
   * Called when the plan is accepted. Shows the Accept button while set. Return a promise to keep Accept pending
   * until it settles: a rejection makes it available again.
   */
  onAccept?: () => unknown;
  /**
   * Whether an agent needs a person to approve its actions on the plan. UI SDK marks a whole component, so
   * `expand` and `collapse` ask too.
   * @default true
   */
  agentConfirm?: boolean;
};

export type PlanState = ItemListState<PlanItem> & {
  /** Whether `onAccept` is set, so Accept shows. */
  canAccept: boolean;
  /** Whether a promise `onAccept` returned is still pending. */
  pending: boolean;
  /** The `agentConfirm` option. */
  agentConfirm: boolean;
};

export type PlanApi = ItemListApi<PlanItem, PlanState> & {
  /** Calls `onAccept`. Offered only while it's set and not pending. */
  readonly accept: (() => void) | undefined;
  /** Moves focus to the trigger when Accept leaves while focused. Called by the accept slot. */
  acceptRecovery: ReturnType<typeof createFocusRecovery>;
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<PlanState, PlanApi, Props, Public>;

type ItemSlot<Public extends object = Record<never, never>> = Slot<ItemPartProps & BaseSlotProps, Public>;

type PlanSlots = {
  root: Slot;
  trigger: Slot;
  icon: Slot;
  title: Slot<BaseSlotProps, { title: string }>;
  meta: Slot<BaseSlotProps, { done: number; total: number }>;
  content: Slot;
  progress: Slot<BaseSlotProps, { value: number; label: string }>;
  list: Slot<BaseSlotProps, { items: PlanItem[] }>;
  item: Slot<{ value: string } & BaseSlotProps, { status: string }>;
  "item-icon": ItemSlot;
  "item-title": ItemSlot<{ title: string }>;
  "item-description": ItemSlot<{ description: string }>;
  accept: Slot<BaseSlotProps, { pending: boolean }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type PlanPrimitive = ReturnType<typeof definePrimitive<PlanOptions, PlanState, PlanApi, PlanSlots>>;

const list = itemList<PlanItem, PlanState, PlanApi, PlanOptions>({
  kind: "plan",
  title: "Plan",
  done: ["complete", "skipped"],
});

const presentation = (options: PlanOptions) => ({
  canAccept: options.onAccept !== undefined,
  agentConfirm: options.agentConfirm ?? true,
});

export const planPrimitive: PlanPrimitive = definePrimitive<PlanOptions, PlanState, PlanApi, PlanSlots>({
  name: "kind-plan",
  ...list,
  options: { ...list.options, onAccept: "action", agentConfirm: "boolean" },
  state: (options) => ({ ...list.state(options), ...presentation(options), pending: false }),
  sync: (options) => ({ ...list.sync(options), ...presentation(options) }),
  api: (context) => {
    const { store } = context;
    const pendingAccept = createPendingAction(context, { state: "pending" });
    const accept = () => {
      const { onAccept } = context.options();
      if (onAccept) pendingAccept.run(onAccept);
    };
    return {
      ...list.api(context),
      acceptRecovery: createFocusRecovery({ fallback: () => context.element("trigger") }),
      get accept() {
        const { canAccept, pending } = store.get();
        return canAccept && !pending ? accept : undefined;
      },
    };
  },
  slots: (slot) => {
    const { root, ...slots } = list.slots(slot);
    return {
      ...slots,
      root: slot({
        ...root,
        attrs: (state, part) => ({
          ...root.attrs?.(state, part),
          "aria-busy": state.pending ? "true" : undefined,
          // UI SDK marks a whole component, so every plan action asks the person while it's on.
          "data-agent-confirm": state.agentConfirm ? "Accepts the plan for you" : undefined,
        }),
      }),
      progress: slot<BaseSlotProps, { value: number; label: string }>({
        attrs: (state) => ({ "data-step-part": "progress", "data-motion": state.motion }),
        state: ({ progress }) => ({
          value: progress.percent,
          label: `${progress.done} of ${progress.total} ${progress.total === 1 ? "step" : "steps"}`,
        }),
      }),
      "item-description": slot<ItemPartProps & BaseSlotProps, { description: string }>({
        props: fromItem,
        selects: ownItem<PlanState, PlanApi>(),
        present: (state, { key }) => Boolean(state.itemsById[key]?.description),
        state: (state, { key }) => ({ description: state.itemsById[key]?.description ?? "" }),
        attrs: () => ({ "data-step-part": "description" }),
      }),
      accept: slot<BaseSlotProps, { pending: boolean }>({
        role: "button",
        focus: "native",
        present: (state) => state.canAccept,
        press: ({ api }) => api.accept?.(),
        state: (state) => ({ pending: state.pending }),
        attrs: (state) => ({
          type: "button",
          "aria-disabled": state.pending ? "true" : undefined,
          "data-step-part": "accept",
          "data-pending": state.pending ? "" : undefined,
        }),
        bind: (el, part) => part.api.acceptRecovery.bind(el, part),
      }),
    };
  },
  agent: { actions: ["expand", "collapse", "accept"] },
});
