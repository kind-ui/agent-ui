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
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { actionSource } from "../action-source.js";
import { memo } from "../memo.js";
import { enter, type MotionMode } from "../motion/index.js";
import { createPendingAction } from "../pending.js";

export type CheckpointOptions = {
  /**
   * Names the checkpoint, like "Checkpoint 3".
   * @default "Checkpoint"
   */
  label?: string;
  /** What the checkpoint was taken before, like "Before editing auth.ts". */
  description?: string;
  /**
   * Called when a person confirms in the dialog. Shows Restore while set. Return a promise to keep the dialog open
   * until it settles: a rejection keeps it open with an error, and Restore works again. `details.source` says who
   * pressed it.
   */
  onRestore?: (details: ActionDetails) => unknown;
  /**
   * Whether the host restored the checkpoint. Shows "Restored" in place of Restore, and closes the dialog.
   * @default false
   */
  restored?: boolean;
  /** @default "Restore this checkpoint?" */
  confirmTitle?: string;
  /** @default "Changes after it will be discarded." */
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
  /** The `confirmTitle`, else "Restore this checkpoint?". */
  confirmTitle: string;
  /** The `confirmDescription`, else "Changes after it will be discarded.". */
  confirmDescription: string;
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
  /** The `confirmDescription`. */
  description: string;
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
  restored: Slot;
  error: Slot;
  cancel: Slot;
  confirm: Slot<{ pending: boolean }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type CheckpointPrimitive = ReturnType<
  typeof definePrimitive<CheckpointOptions, CheckpointState, CheckpointApi, CheckpointSlots>
>;

// Reads `options` rather than spreading it: on Web Components, `@ui-sdk/web` fills in the callbacks on read.
const presentation = (options: CheckpointOptions) => ({
  label: options.label ?? "Checkpoint",
  description: options.description,
  canRestore: options.onRestore !== undefined,
  restored: options.restored ?? false,
  confirmTitle: options.confirmTitle ?? "Restore this checkpoint?",
  confirmDescription: options.confirmDescription ?? "Changes after it will be discarded.",
  agentConfirm: options.agentConfirm ?? true,
  motion: options.motion ?? "auto",
});

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
    restored: "boolean",
    confirmTitle: "string",
    confirmDescription: "string",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    agentConfirm: "boolean",
    motion: "string",
  },
  state: (options) => ({
    ...presentation(options),
    open: options.open ?? options.defaultOpen ?? false,
    pending: false,
    failed: false,
  }),
  sync: (options) => ({
    ...presentation(options),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["open"],
  api: (context) => {
    const { store } = context;
    const change = createChange(context);
    const pending = createPendingAction(context, { state: "pending" });
    const controller = createAlertDialogController();
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
      void controller.open().then(({ reason, source }) => {
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

    // Compared with the last options rather than the store: a framework that hands its props over through
    // `follow` (Svelte) shows the new value in `store.get()` before `onOptions` runs.
    let wasRestored = store.get().restored;
    context.onOptions(({ restored = false }) => {
      if (!mounting && restored && !wasRestored) announce("Checkpoint restored", { priority: "polite" });
      wasRestored = restored;
    });

    const dialogState = memo(
      (dismissible: boolean, title: string, description: string): CheckpointDialogState => ({
        controller,
        dismissible,
        busy: !dismissible,
        initialFocus: '[data-slot="kind-checkpoint-cancel"]',
        title,
        description,
      }),
    );

    return {
      get restore() {
        const state = store.get();
        return showsRestore(state) && !state.open
          ? () => void change("open", true, { reason: "imperative" })
          : undefined;
      },
      isOpen: () => store.get().open,
      setOpen: (open) => change("open", open, { reason: "imperative" }),
      confirm: (event) => {
        const { onRestore } = context.options();
        if (!onRestore || !controller.isOpen()) return;
        const details = { source: actionSource(event, "confirm-press") };
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
        sync();
        return () => {
          dialogBound = false;
        };
      },
      dialogState: (state) => dialogState(!state.pending, state.confirmTitle, state.confirmDescription),
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
    restored: slot({
      focus: "tab-stop",
      present: (state) => state.restored,
      attrs: () => ({ tabindex: "0" }),
      bind: (el, { api }) => api.enterRestored(el),
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
        // Whatever `agentConfirm` says, an agent pressing it needs a person.
        "data-agent-confirm": "Restores the checkpoint, discarding the changes after it",
      }),
    }),
  }),
  agent: { actions: ["restore"] },
});
