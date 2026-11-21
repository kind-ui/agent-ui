import { type CheckpointDialogState, checkpointPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, Fragment, h, type VNode } from "vue";
import {
  KindAlertDialog,
  KindAlertDialogBackdrop,
  KindAlertDialogContent,
  KindAlertDialogDescription,
  KindAlertDialogTitle,
  KindAlertDialogTrigger,
} from "./internal/alert-dialog.js";
import { KindTooltip, KindTooltipContent, KindTooltipTrigger } from "./internal/tooltip.js";

const parts = createParts(checkpointPrimitive, {
  root: "div",
  label: "span",
  description: "span",
  line: "span",
  restore: "div",
  restored: "span",
  error: "span",
  cancel: "button",
  confirm: "button",
});

type Scope<State> = { state: State };

/**
 * A marker in the conversation that a person can restore. Restore opens a dialog that asks before calling
 * `onRestore`. A default slot replaces the default parts.
 */
export const Checkpoint = defineComponent({
  name: "Checkpoint",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, () =>
        slots.default
          ? slots.default()
          : [
              h(CheckpointLabel),
              h(CheckpointDescription),
              h(CheckpointLine),
              h(CheckpointRestore),
              h(CheckpointRestored),
            ],
      );
  },
});

export const CheckpointLine = parts.Line;

/** The `label`, unless you pass a default slot. */
export const CheckpointLabel = defineComponent({
  name: "CheckpointLabel",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Label, attrs, {
        default: (scope: Scope<{ label: string }>) => slots.default?.(scope) ?? scope.state.label,
      });
  },
});

/** The `description`, unless you pass a default slot. Rendered only with one. */
export const CheckpointDescription = defineComponent({
  name: "CheckpointDescription",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Description, attrs, {
        default: (scope: Scope<{ description?: string }>) =>
          slots.default?.(scope) ?? scope.state.description,
      });
  },
});

const restoreTrigger = () =>
  h(KindTooltip, { type: "label" }, () => [
    h(
      KindTooltipTrigger,
      { "data-checkpoint-trigger": "", "data-kind-icon-button": "" },
      {
        render: ({ props, children }: { props: Record<string, unknown>; children: () => VNode }) =>
          h(KindAlertDialogTrigger, props, () => h(children)),
      },
    ),
    h(KindTooltipContent, null, () => "Restore checkpoint"),
  ]);

/**
 * Restore and its dialog, unless you pass a default slot, which gets the Alert Dialog's props as `state`. Rendered
 * only while `onRestore` is set and the checkpoint isn't `restored`.
 */
export const CheckpointRestore = defineComponent({
  name: "CheckpointRestore",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Restore, attrs, {
        default: (scope: Scope<CheckpointDialogState>) => {
          if (slots.default) return slots.default(scope);
          // The slot's state is a proxy that tracks each key read and lists none, so a rest spread would be empty.
          const { controller, dismissible, busy, initialFocus, title, description } = scope.state;
          return h(KindAlertDialog, { controller, dismissible }, () => [
            restoreTrigger(),
            h(CheckpointDialog, { busy, initialFocus, title, description }),
          ]);
        },
      });
  },
});

const answers = () =>
  h("div", { "data-checkpoint-answers": "" }, [
    h(CheckpointError),
    h(CheckpointCancel),
    h(CheckpointConfirm),
  ]);

/** The dialog's backdrop and content: its title, description and answers, unless you pass a default slot. */
export const CheckpointDialog = defineComponent({
  name: "CheckpointDialog",
  props: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    initialFocus: { type: String, required: true },
    busy: { type: Boolean, default: undefined },
  },
  setup(props, { slots }) {
    return () =>
      h(Fragment, [
        h(KindAlertDialogBackdrop),
        h(
          KindAlertDialogContent,
          { initialFocus: props.initialFocus, "aria-busy": props.busy || undefined },
          () => [
            h(KindAlertDialogTitle, null, () => props.title),
            h(KindAlertDialogDescription, null, () => props.description),
            slots.default ? slots.default() : answers(),
          ],
        ),
      ]);
  },
});

/** "Restored" with a check, in Restore's place once the host restores the checkpoint, unless you pass a default slot. */
export const CheckpointRestored = defineComponent({
  name: "CheckpointRestored",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Restored, attrs, () =>
        slots.default
          ? slots.default()
          : [
              h("span", { "aria-hidden": "true", "data-status-mark": "", "data-status": "complete" }),
              "Restored",
            ],
      );
  },
});

/** "Couldn't restore. Try again." after a restore fails, unless you pass a default slot. */
export const CheckpointError = defineComponent({
  name: "CheckpointError",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Error, attrs, () => slots.default?.() ?? "Couldn't restore. Try again.");
  },
});

/** Closes the dialog. Reads "Cancel" unless you pass a default slot. */
export const CheckpointCancel = defineComponent({
  name: "CheckpointCancel",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Cancel, attrs, () => slots.default?.() ?? "Cancel");
  },
});

/** Calls `onRestore`. Reads "Restore", with a running mark while the restore is pending, unless you pass a default slot. */
export const CheckpointConfirm = defineComponent({
  name: "CheckpointConfirm",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Confirm, attrs, () =>
        slots.default
          ? slots.default()
          : [
              // The mark shows only while the restore is pending (controls.css).
              h("span", {
                "data-kind-pending-mark": "",
                "data-status-mark": "",
                "data-status": "running",
                "aria-hidden": "true",
              }),
              "Restore",
            ],
      );
  },
});
