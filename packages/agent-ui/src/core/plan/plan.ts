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
   * Whether the plan was accepted, which replaces Accept with "Accepted". Without it, a plan shows "Accepted" once a
   * call to `onAccept` resolves.
   */
  accepted?: boolean;
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
  /** The `accepted` option, else whether a call to `onAccept` resolved. */
  accepted: boolean;
  /** The `agentConfirm` option. */
  agentConfirm: boolean;
};

export type PlanApi = ItemListApi<PlanItem, PlanState> & {
  /** Calls `onAccept`. Offered only while it's set, not pending and the plan isn't accepted. */
  readonly accept: (() => void) | undefined;
  /** Whether the plan reads as accepted. */
  isAccepted: () => boolean;
  /** Marks the plan accepted, or not, unless the host passes `accepted`. A web element put back keeps it this way. */
  setAccepted: (accepted: boolean) => void;
  /** Moves focus to "Accepted", else the trigger, when Accept leaves while focused. Called by the accept slot. */
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
  outcome: Slot;
  "outcome-icon": Slot;
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

// A plan is the same plan while its item ids are, so an accept of an earlier one doesn't count for it.
const planKey = (options: PlanOptions) => (options.items ?? []).map((item) => item.id).join("\n");

export const planPrimitive: PlanPrimitive = definePrimitive<PlanOptions, PlanState, PlanApi, PlanSlots>({
  name: "kind-plan",
  ...list,
  options: { ...list.options, onAccept: "action", accepted: "boolean", agentConfirm: "boolean" },
  state: (options) => ({
    ...list.state(options),
    ...presentation(options),
    accepted: options.accepted ?? false,
    pending: false,
  }),
  sync: (options) => ({ ...list.sync(options), ...presentation(options) }),
  api: (context) => {
    const { store } = context;
    let key = planKey(context.options());
    // Whether a call to `onAccept` resolved for this plan, which counts while the host doesn't pass `accepted`.
    let called = false;
    const pendingAccept = createPendingAction(context, { state: "pending", key: () => key });
    context.onOptions((options) => {
      const next = planKey(options);
      if (next !== key) {
        key = next;
        called = false;
        pendingAccept.release();
      }
      const accepted = options.accepted ?? called;
      if (accepted !== store.get().accepted) store.set({ accepted });
    });
    const setAccepted = (accepted: boolean) => {
      called = accepted;
      store.set({ accepted: context.options().accepted ?? called });
    };
    const accept = () => {
      const { onAccept } = context.options();
      if (!onAccept) return;
      void pendingAccept.run(onAccept)?.then((outcome) => {
        if (outcome === "done") setAccepted(true);
      });
    };
    return {
      ...list.api(context),
      isAccepted: () => store.get().accepted,
      setAccepted,
      acceptRecovery: createFocusRecovery({
        fallback: () => context.element("outcome") ?? context.element("trigger"),
      }),
      get accept() {
        const { canAccept, pending, accepted } = store.get();
        return canAccept && !pending && !accepted ? accept : undefined;
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
        present: (state) => state.canAccept && !state.accepted,
        press: ({ api }) => api.accept?.(),
        state: (state) => ({ pending: state.pending }),
        attrs: (state) => ({
          type: "button",
          "aria-disabled": state.pending ? "true" : undefined,
          "data-step-part": "accept",
          "data-kind-button": "primary",
          "data-pending": state.pending ? "" : undefined,
        }),
        bind: (el, part) => part.api.acceptRecovery.bind(el, part),
      }),
      // Takes Accept's place at its height, so the decision stays on the page. A Tab stop, so focus has somewhere
      // to go when Accept leaves.
      outcome: slot({
        focus: "tab-stop",
        present: (state) => state.accepted,
        attrs: () => ({ tabindex: "0", "data-step-part": "outcome" }),
      }),
      "outcome-icon": slot({
        attrs: (state) => ({
          "aria-hidden": "true",
          "data-status-mark": "",
          "data-status": "complete",
          "data-motion": state.motion,
        }),
      }),
    };
  },
  agent: { actions: ["expand", "collapse", "accept"] },
});
