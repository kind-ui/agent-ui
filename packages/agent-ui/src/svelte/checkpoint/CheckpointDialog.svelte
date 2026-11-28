<!--
  The dialog's backdrop and content: its title, the checkpoint's description, the scope, the loss sentence as its
  description, and the answers, unless you pass children, which replace the scope and the answers.
-->
<script lang="ts">
  import type { CheckpointDialogState } from "@kind-ui/agent-ui/core";
  import type { Snippet } from "svelte";
  import { KindAlertDialogBackdrop, KindAlertDialogContent, KindAlertDialogTitle } from "../internal/alert-dialog/index.js";
  import CheckpointCancel from "./CheckpointCancel.svelte";
  import CheckpointCompare from "./CheckpointCompare.svelte";
  import CheckpointConfirm from "./CheckpointConfirm.svelte";
  import CheckpointError from "./CheckpointError.svelte";
  import CheckpointLoss from "./CheckpointLoss.svelte";
  import CheckpointScope from "./CheckpointScope.svelte";

  type Props = Omit<CheckpointDialogState, "controller" | "dismissible" | "busy"> & {
    busy?: boolean;
    children?: Snippet;
  };

  let { title, point, description, note, initialFocus, busy, children }: Props = $props();
</script>

<KindAlertDialogBackdrop
/><KindAlertDialogContent {initialFocus} aria-busy={busy || undefined}>
  <KindAlertDialogTitle>{title}</KindAlertDialogTitle
  >{#if point}<p data-checkpoint-point="">{point}</p>{/if}{#if children}
    {@render children()}
  {:else}<CheckpointScope /><CheckpointLoss {description} {note} /><div data-checkpoint-answers=""
      ><CheckpointCompare
      /><CheckpointError
      /><CheckpointCancel
      /><CheckpointConfirm /></div
    >{/if}
</KindAlertDialogContent>
