<!-- The dialog's backdrop and content: its title, description and answers, unless you pass children. -->
<script lang="ts">
  import type { CheckpointDialogState } from "@kind-ui/agent-ui/core";
  import type { Snippet } from "svelte";
  import {
    KindAlertDialogBackdrop,
    KindAlertDialogContent,
    KindAlertDialogDescription,
    KindAlertDialogTitle,
  } from "../internal/alert-dialog/index.js";
  import CheckpointCancel from "./CheckpointCancel.svelte";
  import CheckpointConfirm from "./CheckpointConfirm.svelte";
  import CheckpointError from "./CheckpointError.svelte";

  type Props = Omit<CheckpointDialogState, "controller" | "dismissible" | "busy"> & {
    busy?: boolean;
    children?: Snippet;
  };

  let { title, description, initialFocus, busy, children }: Props = $props();
</script>

<KindAlertDialogBackdrop />
<KindAlertDialogContent {initialFocus} aria-busy={busy || undefined}>
  <KindAlertDialogTitle>{title}</KindAlertDialogTitle>
  <KindAlertDialogDescription>{description}</KindAlertDialogDescription>
  {#if children}
    {@render children()}
  {:else}
    <div data-checkpoint-answers="">
      <CheckpointError />
      <CheckpointCancel />
      <CheckpointConfirm />
    </div>
  {/if}
</KindAlertDialogContent>
