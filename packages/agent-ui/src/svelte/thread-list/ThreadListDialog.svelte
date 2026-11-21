<!--
  The Alert Dialog Delete opens: "Delete chat?", the thread's title, and Cancel and Delete, unless you pass children
  for the answers. Rendered only while `onDelete` is set and `confirmDelete` is on.
-->
<script lang="ts">
  import type { ThreadListDialogState } from "@kind-ui/agent-ui/core";
  import type { Snippet } from "svelte";
  import {
    KindAlertDialog,
    KindAlertDialogBackdrop,
    KindAlertDialogContent,
    KindAlertDialogDescription,
    KindAlertDialogTitle,
  } from "../internal/alert-dialog/index.js";
  import { parts } from "./parts.js";
  import ThreadListDialogCancel from "./ThreadListDialogCancel.svelte";
  import ThreadListDialogDelete from "./ThreadListDialogDelete.svelte";
  import ThreadListDialogError from "./ThreadListDialogError.svelte";

  let { children: answers }: { children?: Snippet } = $props();
</script>

<parts.Dialog>
  {#snippet children({
    controller,
    dismissible,
    initialFocus,
    finalFocus,
    title,
    description,
  }: ThreadListDialogState)}
    <KindAlertDialog {controller} {dismissible}>
      <KindAlertDialogBackdrop />
      <KindAlertDialogContent {initialFocus} {finalFocus}>
        <KindAlertDialogTitle>{title}</KindAlertDialogTitle>
        <KindAlertDialogDescription>{description}</KindAlertDialogDescription>
        {#if answers}{@render answers()}{:else}
          <div data-thread-list-answers="">
            <ThreadListDialogError />
            <ThreadListDialogCancel />
            <ThreadListDialogDelete />
          </div>
        {/if}
      </KindAlertDialogContent>
    </KindAlertDialog>
  {/snippet}
</parts.Dialog>
