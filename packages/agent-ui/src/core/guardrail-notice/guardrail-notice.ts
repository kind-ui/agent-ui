import {
  type ChangeDetails,
  createChange,
  definePrimitive,
  hiddenAttrs,
  openAttrs,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { type NoticeApi, type NoticeOptions, type NoticeState, noticeBase } from "../notice/base.js";
import { bindStepPanel } from "../step/base.js";

export type GuardrailNoticeOpenChangeReason = "trigger-press" | "find-in-page" | "imperative";

export type GuardrailNoticeOptions = NoticeOptions & {
  /** The policy reason, in a sentence. */
  reason?: string;
  /** More about the policy, shown under "Why?". Without it, there's no "Why?". */
  detail?: string;
  /**
   * Whether the guardrail stopped the response. A blocking notice is an alert and its announcement interrupts;
   * otherwise it's a note, as Notice is.
   * @default false
   */
  blocking?: boolean;
  /** Whether the detail shows. Passing it controls it: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the detail shows at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the detail opens or closes, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<GuardrailNoticeOpenChangeReason>) => void;
};

export type GuardrailNoticeState = NoticeState & {
  /** The `reason`, or empty. */
  reason: string;
  /** The `detail`, or empty. */
  detail: string;
  /** The `blocking` option. */
  blocking: boolean;
  /** Whether the detail shows. */
  open: boolean;
  /** Whether the detail is closing and still shown while its exit plays. */
  exiting: boolean;
};

export type GuardrailNoticeApi = NoticeApi & {
  /** Whether the detail shows; the owner's `open` when controlled. */
  isOpen: () => boolean;
  /** Shows or hides the detail. Returns whether the change was accepted. */
  setOpen: (open: boolean) => boolean;
  /** Shows the detail. Offered while there is one. Returns whether the change was accepted. */
  readonly expand: (() => boolean) | undefined;
  /** Hides the detail. Offered while there is one. Returns whether the change was accepted. */
  readonly collapse: (() => boolean) | undefined;
  /** Shows a hidden detail and hides a shown one, as "Why?" does. Returns whether the change was accepted. */
  toggle: (event?: Event) => boolean;
  /** Opens the detail for find in page. Called by the detail slot. */
  reveal: (event: Event) => void;
};

type Slot<Public extends object = Record<never, never>> = SlotDefinition<
  GuardrailNoticeState,
  GuardrailNoticeApi,
  BaseSlotProps,
  Public
>;

type GuardrailNoticeSlots = {
  root: Slot;
  icon: Slot;
  title: Slot<{ label: string }>;
  reason: Slot<{ reason: string }>;
  "detail-trigger": Slot;
  detail: Slot<{ detail: string }>;
  description: Slot;
  actions: Slot;
  dismiss: Slot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type GuardrailNoticePrimitive = ReturnType<
  typeof definePrimitive<
    GuardrailNoticeOptions,
    GuardrailNoticeState,
    GuardrailNoticeApi,
    GuardrailNoticeSlots
  >
>;

const base = noticeBase<GuardrailNoticeState, GuardrailNoticeApi, GuardrailNoticeOptions>({
  variant: "warning",
  label: (options) => (options.blocking ? "Response blocked" : "Response filtered"),
  urgent: (options) => options.blocking === true,
});

const presentation = (options: GuardrailNoticeOptions) => ({
  reason: options.reason ?? "",
  detail: options.detail ?? "",
  blocking: options.blocking ?? false,
});

export const guardrailNoticePrimitive: GuardrailNoticePrimitive = definePrimitive<
  GuardrailNoticeOptions,
  GuardrailNoticeState,
  GuardrailNoticeApi,
  GuardrailNoticeSlots
>({
  name: "kind-guardrail-notice",
  ...base,
  options: {
    ...base.options,
    reason: "string",
    detail: "string",
    blocking: "boolean",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
  },
  state: (options) => ({
    ...base.state(options),
    ...presentation(options),
    open: options.open ?? options.defaultOpen ?? false,
    exiting: false,
  }),
  sync: (options) => ({
    ...base.sync(options),
    ...presentation(options),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["open"],
  api: (context) => {
    const { store } = context;
    const change = createChange(context);
    let wasOpen = store.get().open;
    store.subscribe(() => {
      const { open } = store.get();
      if (open === wasOpen) return;
      wasOpen = open;
      if (!open) store.set({ exiting: true });
    });
    const setOpen = (open: boolean, reason: GuardrailNoticeOpenChangeReason = "imperative", event?: Event) =>
      change("open", open, event ? { reason, event } : { reason });
    const hasDetail = () => store.get().detail !== "";
    return {
      ...base.api(context),
      isOpen: () => store.get().open,
      setOpen: (open) => setOpen(open),
      get expand() {
        return hasDetail() ? () => setOpen(true) : undefined;
      },
      get collapse() {
        return hasDetail() ? () => setOpen(false) : undefined;
      },
      toggle: (event) => setOpen(!store.get().open, "trigger-press", event),
      reveal: (event) => void setOpen(true, "find-in-page", event),
    };
  },
  slots: (slot) => {
    const { root, ...slots } = base.slots(slot);
    return {
      ...slots,
      root: slot({
        ...root,
        role: (state) => (state.blocking ? "alert" : "note"),
        roles: ["alert", "note"],
        attrs: (state, part) => ({ ...root.attrs?.(state, part), ...openAttrs(state.open) }),
      }),
      reason: slot<BaseSlotProps, { reason: string }>({
        present: (state) => state.reason !== "",
        state: (state) => ({ reason: state.reason }),
        attrs: () => ({ "data-notice-part": "reason" }),
      }),
      "detail-trigger": slot({
        role: "button",
        focus: "native",
        present: (state) => state.detail !== "",
        press: ({ api }, event) => api.toggle(event),
        attrs: (state, part) => ({
          type: "button",
          "aria-expanded": String(state.open),
          "aria-controls": `${part.id}-detail`,
          "data-notice-part": "detail-trigger",
          "data-motion": state.motion,
          ...openAttrs(state.open),
        }),
      }),
      detail: slot<BaseSlotProps, { detail: string }>({
        present: (state) => state.detail !== "",
        state: (state) => ({ detail: state.detail }),
        attrs: (state, part) => ({
          id: `${part.id}-detail`,
          "data-notice-part": "detail",
          "data-motion": state.motion,
          ...openAttrs(state.open),
          ...hiddenAttrs(state.open || state.exiting, true),
        }),
        bind: (el, { api, id, store }) =>
          bindStepPanel(el, {
            isOpen: () => store.get().open,
            isExiting: () => store.get().exiting,
            motion: () => store.get().motion,
            reveal: api.reveal,
            trigger: () =>
              el.ownerDocument.querySelector<HTMLElement>(`[aria-controls="${id}-detail"]`) ?? undefined,
            subscribe: store.subscribe,
            exited: () => store.set({ exiting: false }),
          }),
      }),
    };
  },
  agent: { actions: ["dismiss", "expand", "collapse"] },
});
