import type { ComponentProps } from "svelte";
import Checkpoint from "./Checkpoint.svelte";
import CheckpointCancel from "./CheckpointCancel.svelte";
import CheckpointCompare from "./CheckpointCompare.svelte";
import CheckpointConfirm from "./CheckpointConfirm.svelte";
import CheckpointDescription from "./CheckpointDescription.svelte";
import CheckpointDialog from "./CheckpointDialog.svelte";
import CheckpointError from "./CheckpointError.svelte";
import CheckpointLabel from "./CheckpointLabel.svelte";
import CheckpointLoss from "./CheckpointLoss.svelte";
import CheckpointRestore from "./CheckpointRestore.svelte";
import CheckpointRestored from "./CheckpointRestored.svelte";
import CheckpointScope from "./CheckpointScope.svelte";
import { parts } from "./parts.js";

export {
  Checkpoint,
  CheckpointCancel,
  CheckpointCompare,
  CheckpointConfirm,
  CheckpointDescription,
  CheckpointDialog,
  CheckpointError,
  CheckpointLabel,
  CheckpointLoss,
  CheckpointRestore,
  CheckpointRestored,
  CheckpointScope,
};
export const CheckpointLine = parts.Line;
export type CheckpointProps = ComponentProps<typeof Checkpoint>;
export type CheckpointLabelProps = ComponentProps<typeof CheckpointLabel>;
export type CheckpointDescriptionProps = ComponentProps<typeof CheckpointDescription>;
export type CheckpointRestoreProps = ComponentProps<typeof CheckpointRestore>;
export type CheckpointDialogProps = ComponentProps<typeof CheckpointDialog>;
export type CheckpointRestoredProps = ComponentProps<typeof CheckpointRestored>;
export type CheckpointErrorProps = ComponentProps<typeof CheckpointError>;
export type CheckpointCancelProps = ComponentProps<typeof CheckpointCancel>;
export type CheckpointConfirmProps = ComponentProps<typeof CheckpointConfirm>;
export type CheckpointLossProps = ComponentProps<typeof CheckpointLoss>;
export type CheckpointScopeProps = ComponentProps<typeof CheckpointScope>;
export type CheckpointCompareProps = ComponentProps<typeof CheckpointCompare>;
