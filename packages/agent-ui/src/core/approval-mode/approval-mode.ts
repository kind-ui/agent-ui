import {
  type ChangeDetails,
  type ChangeSource,
  createChange,
  dispatch,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { MenuData } from "@ui-sdk/core/menu";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { ApprovalModeOption } from "../../types/index.js";
import { definePrimitive } from "../define-primitive.js";
import { cached, memo } from "../memo.js";
import {
  type MenuBaseApi,
  type MenuBaseOptions,
  type MenuBaseSlots,
  type MenuBaseState,
  type MenuPartState,
  type MenuTriggerState,
  menuBase,
} from "../menu-base.js";

/** `"item-press"`: a person chose a mode in the menu. `"imperative"`: an `api` call, like an agent's `setValue`. */
export type ApprovalModeChangeReason = "item-press" | "imperative";

/** An Approval Mode's options: the menu's, plus its modes and the chosen one. */
export type ApprovalModeOptions = MenuBaseOptions & {
  /**
   * The modes, in order, each a radio item. Every `value` is unique. A `danger` mode lets the agent do more without
   * asking: it's drawn with a warning mark, which reads "Risky".
   * @default []
   */
  modes?: ApprovalModeOption[];
  /**
   * The chosen mode's `value`. Passing it controls it: change it in `onValueChange`. A value that isn't one of the
   * `modes` chooses none, and the trigger shows only the `label`.
   */
  value?: string;
  /** The mode chosen at first, when `value` isn't passed. Without either, none is. */
  defaultValue?: string;
  /** Called when a person or an `api` call chooses another mode. Cancel it to keep the mode, or to ask first. */
  onValueChange?: (value: string, details: ChangeDetails<ApprovalModeChangeReason>) => void;
  /**
   * Names the menu, and with the mode the trigger: "Approvals, Ask every time".
   * @default "Approvals"
   */
  label?: string;
  /** Where the menu's Learn more link goes. Without it or `onLearnMore`, the menu has no Learn more item. */
  learnMoreHref?: string;
  /**
   * Called when a person chooses Learn more, with the `learnMoreHref` if there is one. The link opens whatever it
   * does: call `details.event?.preventDefault()` to route it yourself.
   */
  onLearnMore?: (href: string | undefined, details: ChangeDetails<"item-press">) => void;
  /**
   * Whether an agent needs a person before it acts on the menu, since changing the mode widens or narrows what it may
   * do without asking. Renders `data-agent-confirm` on the root.
   * @default true
   */
  agentConfirm?: boolean;
};

/** A mode's radio item. */
export type ApprovalModeRow = {
  /** The mode's `value`, which the radio item takes. */
  value: string;
  /** The first line, and the text typeahead matches. */
  label: string;
  /** The second line, under the label. */
  description: string | undefined;
  /** Whether the mode is risky: drawn with the warning mark, which reads "Risky". */
  danger: boolean;
};

/** What the content slot hands render functions: the header and the rows to draw inside UI SDK's `MenuContent`. */
export type ApprovalModeContentState = {
  /** The header's title: the `label`. */
  label: string;
  /** Whether the menu ends with a Learn more item: a `learnMoreHref` or an `onLearnMore`. */
  learnMore: boolean;
  /** The Learn more item's link, if any. */
  learnMoreHref: string | undefined;
  /** The modes' radio items, in order. */
  rows: ApprovalModeRow[];
  /** The chosen mode's `value`, or `null` while none is. */
  value: string | null;
};

/** What the trigger slot hands UI SDK's `MenuTrigger`, and the chosen mode it shows. */
export type ApprovalModeTriggerState = MenuTriggerState & {
  /** The chosen mode, which the trigger shows, or `undefined` while none is. */
  mode: ApprovalModeRow | undefined;
};

export type ApprovalModeState = MenuBaseState & {
  /** The host's `modes`, as passed. */
  modes: ApprovalModeOption[];
  /** The chosen mode's `value`, which the agent snapshot shows: always one of the `modes`, or `undefined`. */
  value: string | undefined;
  /** The `learnMoreHref`, `undefined` when empty. */
  learnMoreHref: string | undefined;
  /** Whether `onLearnMore` is set. */
  canLearnMore: boolean;
  /** The `agentConfirm` option. */
  agentConfirm: boolean;
};

export type ApprovalModeApi = MenuBaseApi & {
  /** The chosen mode's `value`. */
  getValue: () => string | undefined;
  /**
   * Chooses a mode by its `value`. Offered only while the menu is enabled and holds a mode. Returns whether the change
   * was accepted: `false` for an unknown value, or one the owner cancelled.
   */
  readonly setValue: ((value: string) => boolean) | undefined;
  /** The modes an agent can choose, or none while disabled. */
  getModes: () => ApprovalModeOption[];
  /** The trigger slot's state, memoized. */
  triggerState: (state: ApprovalModeState) => ApprovalModeTriggerState;
  /** The content slot's state, memoized. */
  contentState: (state: ApprovalModeState) => ApprovalModeContentState;
};

type ApprovalModeSlots = Omit<MenuBaseSlots<ApprovalModeState, ApprovalModeApi>, "trigger" | "content"> & {
  trigger: SlotDefinition<ApprovalModeState, ApprovalModeApi, BaseSlotProps, ApprovalModeTriggerState>;
  content: SlotDefinition<ApprovalModeState, ApprovalModeApi, BaseSlotProps, ApprovalModeContentState>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ApprovalModePrimitive = ReturnType<
  typeof definePrimitive<ApprovalModeOptions, ApprovalModeState, ApprovalModeApi, ApprovalModeSlots>
>;

/** The radio group's `name`, which UI SDK Menu reports a change with. */
export const APPROVAL_MODE_GROUP = "mode";
/** The Learn more item's `value`, which UI SDK Menu runs it with. */
export const APPROVAL_MODE_LEARN_MORE = "learn-more";

const NO_MODES: ApprovalModeOption[] = [];

/** The rows the modes draw. */
export const approvalModeRows = (modes: ApprovalModeOption[]): ApprovalModeRow[] =>
  modes.map((mode) => ({
    value: mode.value,
    label: mode.label,
    description: mode.description,
    danger: mode.danger === true,
  }));

/** Names the root and the trigger by the label and the mode, with "risky" for a danger mode. */
export const approvalModeName = (label: string, mode: ApprovalModeRow | undefined): string =>
  mode ? `${label}, ${mode.label}${mode.danger ? ", risky" : ""}` : label;

const data = new WeakMap<ApprovalModeOption[], MenuData>();
const toData = (modes: ApprovalModeOption[]) =>
  cached(data, modes, () => [
    {
      type: "radio-group" as const,
      name: APPROVAL_MODE_GROUP,
      items: modes.map(({ value, label }) => ({ value, label })),
    },
  ]);

const rowsOf = new WeakMap<ApprovalModeOption[], ApprovalModeRow[]>();
const rows = (modes: ApprovalModeOption[]) => cached(rowsOf, modes, approvalModeRows);
const chosen = (state: Pick<ApprovalModeState, "modes" | "value">) =>
  rows(state.modes).find((row) => row.value === state.value);

type Cause = { reason: ApprovalModeChangeReason; event?: Event; source?: ChangeSource };

// Each instance's own, by its context: `menuBase` hands a person's choice to the config with the context only.
const instances = new WeakMap<
  object,
  {
    change: (value: string, cause: Cause) => boolean;
    learnMore: (event?: Event, source?: ChangeSource) => void;
  }
>();

const base = menuBase<ApprovalModeOptions>({
  kind: "approval-mode",
  label: "Approvals",
  toData: (options) => toData(options.modes ?? NO_MODES),
  onAction: (value, { event, source }, context) => {
    if (value === APPROVAL_MODE_LEARN_MORE) instances.get(context)?.learnMore(event, source);
  },
  onValue: (group, value, { reason, event, source, cancel }, context) => {
    if (group !== APPROVAL_MODE_GROUP) return;
    const cause = { reason: reason as ApprovalModeChangeReason, source, ...(event && { event }) };
    if (!instances.get(context)?.change(value, cause)) cancel();
  },
});

const known = (modes: ApprovalModeOption[], value: string | undefined) =>
  value !== undefined && modes.some((mode) => mode.value === value) ? value : undefined;

const own = (options: ApprovalModeOptions) => ({
  modes: options.modes ?? NO_MODES,
  learnMoreHref: options.learnMoreHref || undefined,
  canLearnMore: typeof options.onLearnMore === "function",
  agentConfirm: options.agentConfirm ?? true,
});

export const approvalModePrimitive: ApprovalModePrimitive = definePrimitive<
  ApprovalModeOptions,
  ApprovalModeState,
  ApprovalModeApi,
  ApprovalModeSlots
>({
  name: "kind-approval-mode",
  options: {
    ...base.options,
    modes: "value",
    value: "string",
    defaultValue: "string",
    onValueChange: "callback",
    learnMoreHref: "string",
    onLearnMore: "callback",
    agentConfirm: "boolean",
  },
  state: (options) => ({
    ...base.state(options),
    ...own(options),
    value: known(options.modes ?? NO_MODES, options.value ?? options.defaultValue),
  }),
  sync: (options) => ({
    ...base.sync(options),
    ...own(options),
    ...(options.value === undefined ? {} : { value: known(options.modes ?? NO_MODES, options.value) }),
  }),
  controlled: [...base.controlled, "value"],
  api: (context) => {
    const { store } = context;
    const menu = base.api(context);
    const changeValue = createChange(context);
    // A host that drops the chosen mode from `modes` leaves an uncontrolled menu with none chosen.
    context.onOptions(() => {
      const { modes, value } = store.get();
      if (value !== undefined && known(modes, value) === undefined) store.set({ value: undefined });
    });

    const change = (value: string, cause: Cause) => {
      const { disabled, modes, value: current } = store.get();
      if (disabled || !modes.some((mode) => mode.value === value)) return false;
      if (current === value) return true;
      return changeValue("value", value, cause);
    };
    const learnMore = (event?: Event, source?: ChangeSource) => {
      const details = { reason: "item-press" as const, ...(source && { source }), ...(event && { event }) };
      dispatch(context, "onLearnMore", store.get().learnMoreHref, details);
    };
    instances.set(context, { change, learnMore });

    const setValue = (value: string) => change(value, { reason: "imperative" });

    const trigger = memo(
      (label: string, disabled: boolean, mode: ApprovalModeRow | undefined): ApprovalModeTriggerState => ({
        "aria-label": approvalModeName(label, mode),
        disabled,
        "data-kind-trigger": "",
        mode,
      }),
    );
    const content = memo(
      (
        label: string,
        learnMoreHref: string | undefined,
        canLearnMore: boolean,
        modes: ApprovalModeOption[],
        value: string | undefined,
      ): ApprovalModeContentState => ({
        label,
        learnMore: learnMoreHref !== undefined || canLearnMore,
        learnMoreHref,
        rows: rows(modes),
        value: value ?? null,
      }),
    );

    return {
      controller: menu.controller,
      isOpen: menu.isOpen,
      setOpen: menu.setOpen,
      get open() {
        return menu.open;
      },
      get close() {
        return menu.close;
      },
      getItems: menu.getItems,
      partState: menu.partState,
      composedEvents: menu.composedEvents,
      getValue: () => store.get().value,
      get setValue() {
        const { disabled, modes } = store.get();
        return disabled || modes.length === 0 ? undefined : setValue;
      },
      getModes: () => (store.get().disabled ? NO_MODES : store.get().modes),
      triggerState: (state) => trigger(state.label, state.disabled, chosen(state)),
      contentState: (state) =>
        content(state.label, state.learnMoreHref, state.canLearnMore, state.modes, state.value),
    };
  },
  slots: (slot) => {
    const slots = base.slots(slot);
    return {
      ...slots,
      // Named by the label and the mode, since the agent bridge names a component by its root.
      root: slot<BaseSlotProps, MenuPartState>({
        ...slots.root,
        attrs: (state, part) => {
          const mode = chosen(state);
          return {
            ...slots.root.attrs?.(state, part),
            "aria-label": approvalModeName(state.label, mode),
            "data-danger": mode?.danger ? "" : undefined,
            "data-agent-confirm": state.agentConfirm
              ? "Changes what the agent may do without asking"
              : undefined,
          };
        },
      }),
      trigger: slot<BaseSlotProps, ApprovalModeTriggerState>({
        ...slots.trigger,
        state: (state, { api }) => api.triggerState(state),
        attrs: (state, part) => ({
          ...slots.trigger.attrs?.(state, part),
          "data-danger": chosen(state)?.danger ? "" : undefined,
        }),
      }),
      content: slot<BaseSlotProps, ApprovalModeContentState>({
        ...slots.content,
        state: (state, { api }) => api.contentState(state),
      }),
    };
  },
  agent: {
    ...base.agent,
    actions: [...base.agent.actions, "setValue"],
    items: (api: ApprovalModeApi) => api.getModes().map(({ value, label }) => ({ value, label })),
  },
});
