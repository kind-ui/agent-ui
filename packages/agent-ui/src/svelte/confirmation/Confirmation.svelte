<!--
  Asks a person to approve or deny a request, then shows what was decided. Only the choices the host supplies
  (`onApprove`, `onDeny`) render. Any `children` replace the default parts.
-->
<script lang="ts">
  import type { ConfirmationState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import ConfirmationApprove from "./ConfirmationApprove.svelte";
  import ConfirmationCancel from "./ConfirmationCancel.svelte";
  import ConfirmationDeny from "./ConfirmationDeny.svelte";
  import ConfirmationError from "./ConfirmationError.svelte";
  import ConfirmationOutcome from "./ConfirmationOutcome.svelte";
  import ConfirmationReason from "./ConfirmationReason.svelte";
  import ConfirmationTitle from "./ConfirmationTitle.svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

<parts.Root {...props}>
  {#snippet children(state)}
    {#if content}
      {@render content(state)}
    {:else}
      <ConfirmationTitle />
      <ConfirmationReason />
      <parts.Choices>
        <ConfirmationApprove />
        <ConfirmationDeny />
        <ConfirmationCancel />
        <ConfirmationError />
      </parts.Choices>
      <ConfirmationOutcome />
    {/if}
  {/snippet}
</parts.Root>
