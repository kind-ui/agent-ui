import { type CheckpointDialogState, checkpointPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit } from "solid-js";
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

export type CheckpointProps = ComponentProps<typeof parts.Root>;

/**
 * A marker in the conversation that a person can restore. Restore opens a dialog that asks before calling
 * `onRestore`. Any `children` replace the default parts.
 */
export function Checkpoint(props: CheckpointProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export const CheckpointLine = parts.Line;

export type CheckpointLabelProps = ComponentProps<typeof parts.Label>;

/** The `label`, unless you pass children. */
export function CheckpointLabel(props: CheckpointLabelProps) {
  return (
    <parts.Label {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => state.label)}
    </parts.Label>
  );
}

export type CheckpointDescriptionProps = ComponentProps<typeof parts.Description>;

/** The `description`, unless you pass children. Rendered only with one. */
export function CheckpointDescription(props: CheckpointDescriptionProps) {
  return (
    <parts.Description {...omit(props, "children")}>
      {props.children ?? ((state: { description: string | undefined }) => state.description)}
    </parts.Description>
  );
}

export type CheckpointRestoreProps = ComponentProps<typeof parts.Restore>;

/**
 * Restore and its dialog, unless you pass children: a function that gets the Alert Dialog's props. Rendered only
 * while `onRestore` is set and the checkpoint isn't `restored`.
 */
export function CheckpointRestore(props: CheckpointRestoreProps) {
  return (
    <parts.Restore {...omit(props, "children")}>
      {props.children ??
        ((state: CheckpointDialogState) => (
          <KindAlertDialog controller={state.controller} dismissible={state.dismissible}>
            <KindTooltip type="label">
              <KindTooltipTrigger
                render={(trigger) => <KindAlertDialogTrigger {...trigger} />}
                data-checkpoint-trigger=""
                data-kind-icon-button=""
              />
              <KindTooltipContent>Restore checkpoint</KindTooltipContent>
            </KindTooltip>
            <CheckpointDialog
              title={state.title}
              description={state.description}
              initialFocus={state.initialFocus}
              busy={state.busy}
            />
          </KindAlertDialog>
        ))}
    </parts.Restore>
  );
}

export type CheckpointDialogProps = Omit<CheckpointDialogState, "controller" | "dismissible" | "busy"> & {
  busy?: boolean;
  children?: JSX.Element;
};

/** The dialog's backdrop and content: its title, description and answers, unless you pass children. */
export function CheckpointDialog(props: CheckpointDialogProps) {
  return (
    <>
      <KindAlertDialogBackdrop />
      <KindAlertDialogContent initialFocus={props.initialFocus} aria-busy={props.busy ? "true" : undefined}>
        <KindAlertDialogTitle>{props.title}</KindAlertDialogTitle>
        <KindAlertDialogDescription>{props.description}</KindAlertDialogDescription>
        {props.children ?? <DefaultAnswers />}
      </KindAlertDialogContent>
    </>
  );
}

export type CheckpointRestoredProps = ComponentProps<typeof parts.Restored>;

/** "Restored" with a check, in Restore's place once the host restores the checkpoint, unless you pass children. */
export function CheckpointRestored(props: CheckpointRestoredProps) {
  return (
    <parts.Restored {...omit(props, "children")}>
      {props.children ?? (
        <>
          <span aria-hidden="true" data-status-mark="" data-status="complete" />
          Restored
        </>
      )}
    </parts.Restored>
  );
}

export type CheckpointErrorProps = ComponentProps<typeof parts.Error>;

/** "Couldn't restore. Try again." after a restore fails, unless you pass children. */
export function CheckpointError(props: CheckpointErrorProps) {
  return (
    <parts.Error {...omit(props, "children")}>{props.children ?? "Couldn't restore. Try again."}</parts.Error>
  );
}

export type CheckpointCancelProps = ComponentProps<typeof parts.Cancel>;

/** Closes the dialog. Reads "Cancel" unless you pass children. */
export function CheckpointCancel(props: CheckpointCancelProps) {
  return <parts.Cancel {...omit(props, "children")}>{props.children ?? "Cancel"}</parts.Cancel>;
}

export type CheckpointConfirmProps = ComponentProps<typeof parts.Confirm>;

/** Calls `onRestore`. Reads "Restore", with a running mark while the restore is pending, unless you pass children. */
export function CheckpointConfirm(props: CheckpointConfirmProps) {
  return (
    <parts.Confirm {...omit(props, "children")}>
      {
        // The mark shows only while the restore is pending (controls.css).
        props.children ?? (
          <>
            <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
            Restore
          </>
        )
      }
    </parts.Confirm>
  );
}

function DefaultAnswers() {
  return (
    <div data-checkpoint-answers="">
      <CheckpointError />
      <CheckpointCancel />
      <CheckpointConfirm />
    </div>
  );
}

function DefaultParts() {
  return (
    <>
      <CheckpointLabel />
      <CheckpointDescription />
      <CheckpointLine />
      <CheckpointRestore />
      <CheckpointRestored />
    </>
  );
}
