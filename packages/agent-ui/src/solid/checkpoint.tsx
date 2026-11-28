import {
  type CheckpointDialogState,
  type CheckpointScopeState,
  checkpointPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show } from "solid-js";
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
              point={state.point}
              description={state.description}
              note={state.note}
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

/**
 * The dialog's backdrop and content: its title, the checkpoint's description, the scope, the loss sentence as its
 * description, and the answers, unless you pass children, which replace the scope and the answers.
 */
export function CheckpointDialog(props: CheckpointDialogProps) {
  return (
    <>
      <KindAlertDialogBackdrop />
      <KindAlertDialogContent initialFocus={props.initialFocus} aria-busy={props.busy ? "true" : undefined}>
        <KindAlertDialogTitle>{props.title}</KindAlertDialogTitle>
        <Show when={props.point}>
          <p data-checkpoint-point="">{props.point}</p>
        </Show>
        {props.children ?? (
          <>
            <CheckpointScope />
            <CheckpointLoss description={props.description} note={props.note} />
            <DefaultAnswers />
          </>
        )}
      </KindAlertDialogContent>
    </>
  );
}

export type CheckpointLossProps = Pick<CheckpointDialogState, "description" | "note">;

/** The loss sentence, then the note, as the dialog's description, so both are read as it opens. */
export function CheckpointLoss(props: CheckpointLossProps) {
  return (
    <KindAlertDialogDescription data-checkpoint-loss="">
      <span data-checkpoint-loss-text="">{props.description}</span>
      <span data-checkpoint-note="">{props.note}</span>
    </KindAlertDialogDescription>
  );
}

export type CheckpointScopeProps = ComponentProps<typeof parts.Scope>;

/**
 * "Restore" and a radio per scope, unless you pass children: a function that gets the Radio group's props. Rendered
 * only while the host offers more than one scope.
 */
export function CheckpointScope(props: CheckpointScopeProps) {
  return (
    <parts.Scope {...omit(props, "children")}>
      {props.children ??
        ((state: CheckpointScopeState) => (
          <>
            <span aria-hidden="true" data-checkpoint-scope-label="">
              {state.label}
            </span>
            <KindRadioGroup
              controller={state.controller}
              defaultValue={state.defaultValue}
              aria-label={state.label}
              data-agent-hidden=""
            >
              <For each={state.options} keyed={(option) => option.value}>
                {(option) => (
                  // biome-ignore lint/a11y/noLabelWithoutControl: the label wraps UI SDK's radio, which it names.
                  <label data-checkpoint-option="">
                    <KindRadio value={option().value}>
                      <KindRadioIndicator />
                    </KindRadio>
                    {option().label}
                  </label>
                )}
              </For>
            </KindRadioGroup>
          </>
        ))}
    </parts.Scope>
  );
}

export type CheckpointCompareProps = ComponentProps<typeof parts.Compare>;

/** Calls `onCompare`. Reads "Compare" with its icon unless you pass children. Rendered only with `onCompare`. */
export function CheckpointCompare(props: CheckpointCompareProps) {
  return (
    <parts.Compare {...omit(props, "children")}>
      {props.children ?? (
        <>
          <span data-checkpoint-compare-icon="" aria-hidden="true" />
          Compare
        </>
      )}
    </parts.Compare>
  );
}

export type CheckpointRestoredProps = ComponentProps<typeof parts.Restored>;

/**
 * "Restored code and conversation" with a check and what it brought back, in Restore's place once the host restores
 * the checkpoint, unless you pass children.
 */
export function CheckpointRestored(props: CheckpointRestoredProps) {
  return (
    <parts.Restored {...omit(props, "children")}>
      {props.children ??
        ((state: { outcome: string; meta: string }) => (
          <>
            <span aria-hidden="true" data-status-mark="" data-status="complete" />
            {state.outcome}
            <Show when={state.meta}>
              <span data-checkpoint-outcome-meta="">{state.meta}</span>
            </Show>
          </>
        ))}
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
      <CheckpointCompare />
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
