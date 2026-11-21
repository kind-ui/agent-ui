<!--
  Restore and its dialog, unless you pass children: a snippet that gets the Alert Dialog's props. Rendered only
  while `onRestore` is set and the checkpoint isn't `restored`.
-->
<script lang="ts">
  import type { CheckpointDialogState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { KindAlertDialog, KindAlertDialogTrigger } from "../internal/alert-dialog/index.js";
  import { KindTooltip, KindTooltipContent, KindTooltipTrigger } from "../internal/tooltip/index.js";
  import CheckpointDialog from "./CheckpointDialog.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Restore> = $props();
</script>

{#if children}
  <parts.Restore {...props} {children} />
{:else}
  <parts.Restore {...props}>
    {#snippet children({ controller, dismissible, title, description, initialFocus, busy }: CheckpointDialogState)}
      <KindAlertDialog {controller} {dismissible}>
        <KindTooltip type="label">
          <KindTooltipTrigger data-checkpoint-trigger="" data-kind-icon-button="">
            {#snippet render({ props })}<KindAlertDialogTrigger {...props} />{/snippet}
          </KindTooltipTrigger>
          <KindTooltipContent>Restore checkpoint</KindTooltipContent>
        </KindTooltip>
        <CheckpointDialog {title} {description} {initialFocus} {busy} />
      </KindAlertDialog>
    {/snippet}
  </parts.Restore>
{/if}
