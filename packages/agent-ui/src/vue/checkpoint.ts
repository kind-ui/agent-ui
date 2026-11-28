import {
  type CheckpointDialogState,
  type CheckpointScopeState,
  checkpointPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import type { RadioGroupController } from "@ui-sdk/vue/radio";
import { defineComponent, Fragment, h, type VNode } from "vue";
import {
  KindAlertDialog,
  KindAlertDialogBackdrop,
  KindAlertDialogContent,
  KindAlertDialogDescription,
  KindAlertDialogTitle,
  KindAlertDialogTrigger,
} from "./internal/alert-dialog.js";
import { KindRadio, KindRadioGroup, KindRadioIndicator } from "./internal/radio.js";
import { KindTooltip, KindTooltipContent, KindTooltipTrigger } from "./internal/tooltip.js";

const parts = createParts(checkpointPrimitive, {
  root: "div",
  label: "span",
  description: "span",
  line: "span",
  restore: "div",
  restored: "span",
  scope: "div",
  compare: "button",
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
      h(parts.Root, attrs, {
        ...slots,
        default:
          slots.default ??
          (() => [
            h(CheckpointLabel),
            h(CheckpointDescription),
            h(CheckpointLine),
            h(CheckpointRestore),
            h(CheckpointRestored),
          ]),
      });
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
        ...slots,
        default: slots.default ?? (({ state }: Scope<{ label: string }>) => state.label),
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
        ...slots,
        default: slots.default ?? (({ state }: Scope<{ description?: string }>) => state.description),
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
        ...slots,
        default: ({ state }: Scope<CheckpointDialogState>) => {
          // The slot's state is a proxy that tracks each key read and lists none, so it's copied key by key for a
          // slot that binds it with `v-bind`.
          const dialog: CheckpointDialogState = {
            controller: state.controller,
            dismissible: state.dismissible,
            busy: state.busy,
            initialFocus: state.initialFocus,
            title: state.title,
            point: state.point,
            description: state.description,
            note: state.note,
          };
          if (slots.default) return slots.default({ state: dialog });
          const { controller, dismissible, ...rest } = dialog;
          return h(KindAlertDialog, { controller, dismissible }, () => [
            restoreTrigger(),
            h(CheckpointDialog, rest),
          ]);
        },
      });
  },
});

const answers = () =>
  h("div", { "data-checkpoint-answers": "" }, [
    h(CheckpointCompare),
    h(CheckpointError),
    h(CheckpointCancel),
    h(CheckpointConfirm),
  ]);

/**
 * The dialog's backdrop and content: its title, the checkpoint's description, the scope, the loss sentence as its
 * description, and the answers, unless you pass a default slot, which replaces the scope and the answers.
 */
export const CheckpointDialog = defineComponent({
  name: "CheckpointDialog",
  props: {
    title: { type: String, required: true },
    point: { type: String, required: true },
    description: { type: String, required: true },
    note: { type: String, required: true },
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
            props.point ? h("p", { "data-checkpoint-point": "" }, props.point) : null,
            ...(slots.default
              ? [slots.default()]
              : [
                  h(CheckpointScope),
                  h(CheckpointLoss, { description: props.description, note: props.note }),
                  answers(),
                ]),
          ],
        ),
      ]);
  },
});

/** The loss sentence, then the note, as the dialog's description, so both are read as it opens. */
export const CheckpointLoss = defineComponent({
  name: "CheckpointLoss",
  props: {
    description: { type: String, required: true },
    note: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h(KindAlertDialogDescription, { "data-checkpoint-loss": "" }, () => [
        h("span", { "data-checkpoint-loss-text": "" }, props.description),
        h("span", { "data-checkpoint-note": "" }, props.note),
      ]);
  },
});

/**
 * "Restore" and a radio per scope, unless you pass a default slot, which gets the Radio group's props as `state`.
 * Rendered only while the host offers more than one scope.
 */
export const CheckpointScope = defineComponent({
  name: "CheckpointScope",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Scope, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: Scope<CheckpointScopeState>) => [
            h("span", { "aria-hidden": "true", "data-checkpoint-scope-label": "" }, state.label),
            h(
              KindRadioGroup,
              {
                // Vue's Radio group takes a string controller, not the scope union core's is typed with.
                controller: state.controller as RadioGroupController,
                defaultValue: state.defaultValue,
                "aria-label": state.label,
                "data-agent-hidden": "",
              },
              () =>
                state.options.map((option) =>
                  h("label", { key: option.value, "data-checkpoint-option": "" }, [
                    h(KindRadio, { value: option.value }, () => h(KindRadioIndicator)),
                    option.label,
                  ]),
                ),
            ),
          ]),
      });
  },
});

/** Calls `onCompare`. Reads "Compare" with its icon unless you pass a default slot. Rendered only with `onCompare`. */
export const CheckpointCompare = defineComponent({
  name: "CheckpointCompare",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Compare, attrs, {
        ...slots,
        default:
          slots.default ??
          (() => [h("span", { "data-checkpoint-compare-icon": "", "aria-hidden": "true" }), "Compare"]),
      });
  },
});

/**
 * "Restored code and conversation" with a check and what it brought back, in Restore's place once the host restores
 * the checkpoint, unless you pass a default slot.
 */
export const CheckpointRestored = defineComponent({
  name: "CheckpointRestored",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Restored, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: Scope<{ outcome: string; meta: string }>) => [
            h("span", { "aria-hidden": "true", "data-status-mark": "", "data-status": "complete" }),
            state.outcome,
            state.meta ? h("span", { "data-checkpoint-outcome-meta": "" }, state.meta) : null,
          ]),
      });
  },
});

/** "Couldn't restore. Try again." after a restore fails, unless you pass a default slot. */
export const CheckpointError = defineComponent({
  name: "CheckpointError",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Error, attrs, { ...slots, default: slots.default ?? (() => "Couldn't restore. Try again.") });
  },
});

/** Closes the dialog. Reads "Cancel" unless you pass a default slot. */
export const CheckpointCancel = defineComponent({
  name: "CheckpointCancel",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Cancel, attrs, { ...slots, default: slots.default ?? (() => "Cancel") });
  },
});

/** Calls `onRestore`. Reads "Restore", with a running mark while the restore is pending, unless you pass a default slot. */
export const CheckpointConfirm = defineComponent({
  name: "CheckpointConfirm",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Confirm, attrs, {
        ...slots,
        default:
          slots.default ??
          (() => [
            // The mark shows only while the restore is pending (controls.css).
            h("span", {
              "data-kind-pending-mark": "",
              "data-status-mark": "",
              "data-status": "running",
              "aria-hidden": "true",
            }),
            "Restore",
          ]),
      });
  },
});
