import {
  type ActionDetails,
  announce,
  type ChangeDetails,
  createChange,
  createFocusRecovery,
  definePrimitive,
  type SlotDefinition,
} from "@ui-sdk/core";
import {
  type AlertDialogController,
  type AlertDialogOpenChangeReason,
  createAlertDialogController,
} from "@ui-sdk/core/alert-dialog";
import { createRadioGroupController, type RadioGroupController } from "@ui-sdk/core/radio";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { actionSource } from "../action-source.js";
import { memo } from "../memo.js";
import { enter, type MotionMode } from "../motion/index.js";
import { createPendingAction } from "../pending.js";
import {
  type CheckpointChanges,
  type CheckpointScope,
  checkpointLoss,
  checkpointNote,
  checkpointOutcome,
  checkpointOutcomeMeta,
  SCOPE_LABELS,
  SCOPES,
} from "./text.js";

/** `onRestore`'s details: who confirmed, and what to restore. */
export type CheckpointRestoreDetails = ActionDetails & { scope: CheckpointScope };

export type CheckpointOptions = {
  /**
   * Names the checkpoint, like "Checkpoint 3".
   * @default "Checkpoint"
   */
  label?: string;
  /**
   * What the checkpoint was taken before, like "Before “Switch to the session table”, 4 min ago.". The dialog repeats
   * it under its title.
   */
  description?: string;
  /**
   * Called when a person confirms in the dialog. Shows Restore while set. Return a promise to keep the dialog open
   * until it settles: a rejection keeps it open with an error, and Restore works again. `details.source` says who
   * pressed it, and `details.scope` what to restore.
   */
  onRestore?: (details: CheckpointRestoreDetails) => unknown;
  /**
   * What a restore can bring back. With more than one, the dialog asks which, in this order.
   * @default ["both"]
   */
  scopes?: CheckpointScope[];
  /**
   * The scope chosen when the dialog first opens. One `scopes` doesn't hold reads as the first of them.
   * @default the first of `scopes`
   */
  defaultScope?: CheckpointScope;
  /** What restoring the code undoes, for the dialog's loss sentence and the outcome: `{ files, additions, deletions }`. */
  changes?: CheckpointChanges;
  /** How many messages came after the checkpoint, which restoring the conversation removes. */
  laterMessages?: number;
  /** How many later messages changed code that can't be restored. The dialog says so while the restore brings code back. */
  unrestorableMessages?: number;
  /** Shows Compare in the dialog, which calls it, so the host can show what the restore would undo. */
  onCompare?: (details: ActionDetails) => unknown;
  /**
   * Whether the host restored the checkpoint. Shows "Restored" in place of Restore, and closes the dialog.
   * @default false
   */
  restored?: boolean;
  /** @default "Restore to this point?" */
  confirmTitle?: string;
  /**
   * Replaces the dialog's loss sentence, which otherwise follows the chosen scope: "Undoes changes to 3 files
   * (+12 −40) and removes 4 later messages.", or "Changes after it will be discarded." without `changes` and
   * `laterMessages`.
   */
  confirmDescription?: string;
  /** Whether the dialog is open. Passing it controls it: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the dialog is open at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the dialog opens or closes, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<AlertDialogOpenChangeReason>) => void;
  /**
   * Whether an agent needs a person to approve `restore` and every action on the checkpoint. Either way, an agent
   * pressing the dialog's Restore needs a person.
   * @default true
   */
  agentConfirm?: boolean;
  /**
   * How the dialog opens and closes, and how "Restored" fades in. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type CheckpointState = {
  /** The `label`, else "Checkpoint". */
  label: string;
  /** The `description`. */
  description: string | undefined;
  /** Whether `onRestore` is set. */
  canRestore: boolean;
  /** The `restored` option. */
  restored: boolean;
  /** The `confirmTitle`, else "Restore to this point?". */
  confirmTitle: string;
  /** The `scopes` the host offers, else `["both"]`. */
  scopes: readonly CheckpointScope[];
  /** The scope the dialog has chosen. */
  scope: CheckpointScope;
  /** Whether `onCompare` is set. */
  canCompare: boolean;
  /** The `confirmDescription`, else what restoring `scope` loses. */
  confirmDescription: string;
  /** "Code from 2 messages can't be restored.", or empty. */
  note: string;
  /** "Restored code and conversation", or "Restored" while the host passes no `scopes`. */
  outcome: string;
  /** What the restore brought back, "3 files, 4 messages", or empty. */
  outcomeMeta: string;
  /** Whether the dialog is open. */
  open: boolean;
  /** Whether a promise `onRestore` returned is still pending. */
  pending: boolean;
  /** Whether the last restore failed, until Restore is pressed again or the dialog opens again. */
  failed: boolean;
  /** The `agentConfirm` option. */
  agentConfirm: boolean;
  /** The `motion` option. */
  motion: MotionMode;
};

export type CheckpointDialogState = {
  /** Pass it to the Alert Dialog as its `controller`. */
  controller: AlertDialogController;
  /** Pass it to the Alert Dialog. False while a restore is pending, so Escape waits for it. */
  dismissible: boolean;
  /** Pass it to the Alert Dialog content as `aria-busy`: true while a restore is pending. */
  busy: boolean;
  /** Pass it to the Alert Dialog content: Cancel's selector, the least destructive answer. */
  initialFocus: string;
  /** The `confirmTitle`. */
  title: string;
  /** The checkpoint's `description`, which the dialog repeats under its title. */
  point: string;
  /** The loss sentence, the dialog's description: the `confirmDescription`, else what restoring the scope loses. */
  description: string;
  /** "Code from 2 messages can't be restored.", or empty. Part of the description. */
  note: string;
};

export type CheckpointScopeState = {
  /** Pass it to the Radio group as its `controller`. */
  controller: RadioGroupController<CheckpointScope>;
  /** Pass it to the Radio group: the scope when it mounts. */
  defaultValue: CheckpointScope;
  /** The radios, in order. */
  options: readonly { value: CheckpointScope; label: string }[];
  /** "Restore", the Radio group's name and its visible label. */
  label: string;
};

export type CheckpointApi = {
  /**
   * Opens the dialog, as pressing Restore does. Offered only while `onRestore` is set, the checkpoint isn't
   * `restored` and the dialog is closed. Only the dialog's Restore calls `onRestore`.
   */
  readonly restore: (() => void) | undefined;
  /** Whether the dialog is open. */
  isOpen: () => boolean;
  /** Opens or closes the dialog. Returns whether the change was accepted. */
  setOpen: (open: boolean) => boolean;
  /** Chooses what to restore. Offered only while the dialog is open and offers a choice. */
  readonly setScope: ((scope: CheckpointScope) => boolean) | undefined;
  /** Calls `onCompare`. Offered only while the dialog is open and `onCompare` is set. */
  readonly compare: (() => void) | undefined;
  /** The scopes the host offers, in order. */
  getScopes: () => readonly CheckpointScope[];
  /** Reads the scope the Radio group chose, as its `change` bubbles. Called by the scope slot. */
  readScope: () => void;
  /** Calls `onCompare`. Called by the compare slot. */
  pressCompare: (event?: Event) => void;
  /** Hands the Radio group its props. Called by the scope slot. */
  scopeState: (state: CheckpointState) => CheckpointScopeState;
  /** Calls `onRestore` while the dialog is open. Called by the confirm slot. */
  confirm: (event?: Event) => void;
  /** Closes the dialog unless a restore is pending. Called by the cancel slot. */
  cancel: (event?: Event) => void;
  /** Follows the dialog the Alert Dialog trigger opened. Called as the trigger's click bubbles to the restore slot. */
  follow: (event: Event) => void;
  /** Opens the dialog when it's in the page and `open`. Called by the restore slot, which holds it. */
  bindDialog: () => () => void;
  /** Hands the Alert Dialog its props. Called by the restore slot. */
  dialogState: (state: CheckpointState) => CheckpointDialogState;
  /** Moves focus to "Restored" when Restore leaves while focused. Called by the restore slot. */
  recovery: ReturnType<typeof createFocusRecovery>;
  /** Fades "Restored" in when the host restores the checkpoint, after the first frame. Called by the restored slot. */
  enterRestored: (el: HTMLElement) => void;
  /** Opens a dialog that starts open, and starts announcing, after the first frame. Called by the root slot. */
  bindRoot: () => () => void;
};

type Slot<Public extends object = Record<never, never>> = SlotDefinition<
  CheckpointState,
  CheckpointApi,
  BaseSlotProps,
  Public
>;

type CheckpointSlots = {
  root: Slot;
  label: Slot<{ label: string }>;
  description: Slot<{ description: string }>;
  line: Slot;
  restore: Slot<CheckpointDialogState>;
  restored: Slot<{ outcome: string; meta: string }>;
  scope: Slot<CheckpointScopeState>;
  compare: Slot;
  error: Slot;
  cancel: Slot;
  confirm: Slot<{ pending: boolean }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type CheckpointPrimitive = ReturnType<
  typeof definePrimitive<CheckpointOptions, CheckpointState, CheckpointApi, CheckpointSlots>
>;

// One array per list of scopes, so a host's new array with the same scopes changes no state.
const scopeLists = new Map<string, readonly CheckpointScope[]>();
const scopeList = (scopes: CheckpointScope[] | undefined): readonly CheckpointScope[] => {
  const known = (scopes ?? []).filter(
    (scope, index, all) => SCOPES.includes(scope) && all.indexOf(scope) === index,
  );
  if (known.length === 0) known.push("both");
  const key = known.join(" ");
  let list = scopeLists.get(key);
  if (!list) {
    list = Object.freeze(known);
    scopeLists.set(key, list);
  }
  return list;
};

const count = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : undefined;

const changesOf = (changes: CheckpointChanges | undefined): CheckpointChanges | undefined =>
  changes && {
    files: count(changes.files) ?? 0,
    additions: count(changes.additions) ?? 0,
    deletions: count(changes.deletions) ?? 0,
  };

// The words that follow the scope, recomputed whenever it or the host's numbers change.
const words = (options: CheckpointOptions, scope: CheckpointScope) => {
  const changes = changesOf(options.changes);
  const later = count(options.laterMessages);
  return {
    confirmDescription: options.confirmDescription ?? checkpointLoss(scope, changes, later),
    note: checkpointNote(scope, count(options.unrestorableMessages)),
    outcome: checkpointOutcome(scope, options.scopes !== undefined),
    outcomeMeta: checkpointOutcomeMeta(scope, changes, later),
  };
};

// Reads `options` rather than spreading it: on Web Components, `@ui-sdk/web` fills in the callbacks on read.
const presentation = (options: CheckpointOptions) => ({
  label: options.label ?? "Checkpoint",
  description: options.description,
  canRestore: options.onRestore !== undefined,
  canCompare: options.onCompare !== undefined,
  restored: options.restored ?? false,
  confirmTitle: options.confirmTitle ?? "Restore to this point?",
  scopes: scopeList(options.scopes),
  agentConfirm: options.agentConfirm ?? true,
  motion: options.motion ?? "auto",
});

const initialScope = (options: CheckpointOptions): CheckpointScope => {
  const scopes = scopeList(options.scopes);
  return options.defaultScope && scopes.includes(options.defaultScope)
    ? options.defaultScope
    : (scopes[0] ?? "both");
};

const showsRestore = (state: CheckpointState) => state.canRestore && !state.restored;

const pendingAttrs = (state: CheckpointState) => ({
  type: "button",
  "data-kind-button": "secondary",
  "aria-disabled": state.pending ? "true" : undefined,
});

export const checkpointPrimitive: CheckpointPrimitive = definePrimitive<
  CheckpointOptions,
  CheckpointState,
  CheckpointApi,
  CheckpointSlots
>({
  name: "kind-checkpoint",
  options: {
    label: "string",
    description: "string",
    onRestore: "action",
    scopes: "value",
    defaultScope: "string",
    changes: "value",
    laterMessages: "number",
    unrestorableMessages: "number",
    onCompare: "action",
    restored: "boolean",
    confirmTitle: "string",
    confirmDescription: "string",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    agentConfirm: "boolean",
    motion: "string",
  },
  state: (options) => {
    const scope = initialScope(options);
    return {
      ...presentation(options),
      ...words(options, scope),
      scope,
      open: options.open ?? options.defaultOpen ?? false,
      pending: false,
      failed: false,
    };
  },
  sync: (options) => ({
    ...presentation(options),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["open", "scope"],
  api: (context) => {
    const { store } = context;
    const change = createChange(context);
    const pending = createPendingAction(context, { state: "pending" });
    const controller = createAlertDialogController();
    const scopes = createRadioGroupController<CheckpointScope>();
    let mounting = true;
    let destroyed = false;
    let dialogBound = false;
    let watching = false;
    context.onDestroy(() => {
      destroyed = true;
    });

    // `open` resolves on the dialog's next close, whatever causes it, so every close reaches `open` state.
    const watch = () => {
      watching = true;
      store.set({ failed: false });
      // Undefined until an Alert Dialog attaches the controller.
      const closed = controller.open() as ReturnType<typeof controller.open> | undefined;
      if (!closed) {
        watching = false;
        return;
      }
      void closed.then(({ reason, source }) => {
        watching = false;
        if (destroyed) return;
        if (store.get().open)
          change("open", false, reason === "unmount" ? { reason: "imperative" } : { reason, source });
        sync();
      });
    };
    // Brings the dialog to the `open` state, which the host owns when it passes `open`. Restore leaving, as when
    // the host sets `restored`, closes it: a web part that leaves stays in the page, hidden.
    const sync = () => {
      if (mounting) return;
      const state = store.get();
      if (!showsRestore(state)) {
        if (controller.isOpen()) controller.close();
        if (state.open) change("open", false, { reason: "imperative" });
      } else if (!dialogBound) return;
      else if (state.open && !watching) watch();
      else if (!state.open && controller.isOpen()) controller.close();
    };
    store.subscribe(sync);

    // The scope and the words that follow it. A scope the host stops offering falls back to the first it offers.
    const choose = (next: CheckpointScope, options = context.options()) => {
      const scope = scopeList(options.scopes).includes(next) ? next : initialScope(options);
      store.set({ scope, ...words(options, scope) });
      // Writes the scope into the radios, which hold their own value.
      if (scopes.getValue() !== undefined && scopes.getValue() !== scope) scopes.setValue(scope);
      return scope === next;
    };

    // Compared with the last options rather than the store: a framework that hands its props over through
    // `follow` (Svelte) shows the new value in `store.get()` before `onOptions` runs.
    let wasRestored = store.get().restored;
    context.onOptions((options) => {
      const restored = options.restored ?? false;
      if (!mounting && restored && !wasRestored) announce("Checkpoint restored", { priority: "polite" });
      wasRestored = restored;
      choose(store.get().scope, options);
    });

    const dialogState = memo(
      (
        dismissible: boolean,
        title: string,
        point: string,
        description: string,
        note: string,
      ): CheckpointDialogState => ({
        controller,
        dismissible,
        busy: !dismissible,
        initialFocus: '[data-slot="kind-checkpoint-cancel"]',
        title,
        point,
        description,
        note,
      }),
    );
    // Built once per list of scopes: the Radio group reads `defaultValue` only as it mounts.
    const scopeState = memo(
      (list: readonly CheckpointScope[], scope: CheckpointScope): CheckpointScopeState => ({
        controller: scopes,
        defaultValue: scope,
        options: list.map((value) => ({ value, label: SCOPE_LABELS[value] })),
        label: "Restore",
      }),
    );
    let scopeKey: readonly CheckpointScope[] | undefined;
    let mountedScope: CheckpointScope = store.get().scope;

    const compare = (event?: Event) => {
      const { onCompare } = context.options();
      if (onCompare) void onCompare({ source: actionSource(event, "compare-press") });
    };

    return {
      get restore() {
        const state = store.get();
        return showsRestore(state) && !state.open
          ? () => void change("open", true, { reason: "imperative" })
          : undefined;
      },
      get setScope() {
        const state = store.get();
        return state.open && state.scopes.length > 1 ? (scope: CheckpointScope) => choose(scope) : undefined;
      },
      get compare() {
        const state = store.get();
        return state.open && state.canCompare ? () => compare() : undefined;
      },
      getScopes: () => store.get().scopes,
      readScope: () => {
        const value = scopes.getValue();
        if (value && value !== store.get().scope) choose(value);
      },
      pressCompare: compare,
      scopeState: (state) => {
        // A new list of radios mounts with the scope chosen then.
        if (state.scopes !== scopeKey) {
          scopeKey = state.scopes;
          mountedScope = state.scope;
        }
        return scopeState(state.scopes, mountedScope);
      },
      isOpen: () => store.get().open,
      setOpen: (open) => change("open", open, { reason: "imperative" }),
      confirm: (event) => {
        const { onRestore } = context.options();
        if (!onRestore || !controller.isOpen()) return;
        const details = { source: actionSource(event, "confirm-press"), scope: store.get().scope };
        store.set({ failed: false });
        void pending
          .run(() => onRestore(details))
          ?.then((outcome) => {
            if (outcome === "done") controller.close({ reason: "action", returnValue: "confirm" });
            else if (outcome === "failed") {
              store.set({ failed: true });
              announce("Checkpoint not restored", { priority: "polite" });
            }
          });
      },
      cancel: (event) => {
        if (!store.get().pending) controller.close(event ? { reason: "close-press", event } : {});
      },
      // The trigger has opened the dialog already, so an owner who refuses the change closes it again.
      follow: (event) => {
        if (watching || !controller.isOpen()) return;
        if (!store.get().open && !change("open", true, { reason: "trigger-press", event }))
          controller.close();
        else if (!watching) watch();
      },
      bindDialog: () => {
        dialogBound = true;
        // `@ui-sdk/svelte` binds this part before the Alert Dialog inside it attaches the controller.
        queueMicrotask(() => dialogBound && sync());
        return () => {
          dialogBound = false;
        };
      },
      dialogState: (state) =>
        dialogState(
          !state.pending,
          state.confirmTitle,
          state.description ?? "",
          state.confirmDescription,
          state.note,
        ),
      recovery: createFocusRecovery({ fallback: () => context.element("restored") }),
      enterRestored: (el) => {
        if (!mounting) void enter(el, "fade", { motion: store.get().motion });
      },
      bindRoot: () => {
        const frame = requestAnimationFrame(() => {
          mounting = false;
          sync();
        });
        return () => cancelAnimationFrame(frame);
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "group",
      attrs: (state, part) => ({
        "aria-label": state.label,
        "aria-describedby": state.description ? `${part.id}-description` : undefined,
        "aria-busy": state.pending ? "true" : undefined,
        "data-restored": state.restored ? "" : undefined,
        "data-motion": state.motion,
        // Spec §6 and D7: an agent's restore needs a person, then the dialog asks them again.
        "data-agent-confirm": state.agentConfirm ? "Restores the checkpoint for you" : undefined,
      }),
      bind: (_el, { api }) => api.bindRoot(),
    }),
    label: slot<BaseSlotProps, { label: string }>({
      state: (state) => ({ label: state.label }),
    }),
    description: slot<BaseSlotProps, { description: string }>({
      present: (state) => Boolean(state.description),
      state: (state) => ({ description: state.description ?? "" }),
      attrs: (_state, part) => ({ id: `${part.id}-description` }),
    }),
    line: slot({ attrs: () => ({ "aria-hidden": "true" }) }),
    // Wraps the Alert Dialog and hears its trigger's click bubble (spec §2, composing UI SDK).
    restore: slot<BaseSlotProps, CheckpointDialogState>({
      present: showsRestore,
      state: (state, { api }) => api.dialogState(state),
      on: { click: (event, { api }) => api.follow(event) },
      bind: (el, part) => {
        const unbindDialog = part.api.bindDialog();
        const unbindRecovery = part.api.recovery.bind(el, part);
        return () => {
          unbindDialog();
          unbindRecovery();
        };
      },
    }),
    // Takes Restore's place at its height. A Tab stop, so focus has somewhere to go when Restore leaves.
    restored: slot<BaseSlotProps, { outcome: string; meta: string }>({
      focus: "tab-stop",
      present: (state) => state.restored,
      state: (state) => ({ outcome: state.outcome, meta: state.outcomeMeta }),
      attrs: () => ({ tabindex: "0" }),
      bind: (el, { api }) => api.enterRestored(el),
    }),
    // Wraps the Radio group and hears its native `change` bubble (spec §2, composing UI SDK).
    scope: slot<BaseSlotProps, CheckpointScopeState>({
      present: (state) => state.scopes.length > 1,
      state: (state, { api }) => api.scopeState(state),
      on: { change: (_event, { api }) => api.readScope() },
    }),
    compare: slot({
      role: "button",
      focus: "native",
      present: (state) => state.canCompare,
      press: ({ api }, event) => api.pressCompare(event),
      attrs: () => ({ type: "button", "data-kind-button": "" }),
    }),
    // In the dialog's answer row, so a failure moves nothing.
    error: slot({ present: (state) => state.failed }),
    cancel: slot({
      role: "button",
      focus: "native",
      press: ({ api }, event) => api.cancel(event),
      attrs: pendingAttrs,
    }),
    confirm: slot<BaseSlotProps, { pending: boolean }>({
      role: "button",
      focus: "native",
      press: ({ api }, event) => api.confirm(event),
      state: (state) => ({ pending: state.pending }),
      attrs: (state) => ({
        ...pendingAttrs(state),
        "data-kind-button": "danger",
        "data-pending": state.pending ? "" : undefined,
        // Whatever `agentConfirm` says, an agent pressing it needs a person. Only while open: a web part that stays in
        // the page closed would otherwise mark every step on the checkpoint.
        "data-agent-confirm": state.open
          ? "Restores the checkpoint, discarding the changes after it"
          : undefined,
      }),
    }),
  }),
  agent: {
    actions: ["restore", "setScope", "compare"],
    items: (api: CheckpointApi) => api.getScopes().map((value) => ({ value, label: SCOPE_LABELS[value] })),
    closed: true,
  },
});
