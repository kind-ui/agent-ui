<!--
  Asks a person to approve or deny a request, then shows what was decided. Only the choices the host supplies
  (`onDeny`, `onAlwaysAllow`, `onApprove`) render, in that order. Any `children` replace the default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ConfirmationAlways from "./ConfirmationAlways.svelte";
  import ConfirmationApprove from "./ConfirmationApprove.svelte";
  import ConfirmationCancel from "./ConfirmationCancel.svelte";
  import ConfirmationDeny from "./ConfirmationDeny.svelte";
  import ConfirmationDetail from "./ConfirmationDetail.svelte";
  import ConfirmationError from "./ConfirmationError.svelte";
  import ConfirmationMeta from "./ConfirmationMeta.svelte";
  import ConfirmationOutcome from "./ConfirmationOutcome.svelte";
  import ConfirmationReason from "./ConfirmationReason.svelte";
  import ConfirmationRisk from "./ConfirmationRisk.svelte";
  import ConfirmationTitle from "./ConfirmationTitle.svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

<parts.Root {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<ConfirmationTitle
      /><ConfirmationMeta
      /><ConfirmationRisk
      /><ConfirmationReason
      /><parts.Choices
        ><ConfirmationCancel
        /><ConfirmationDeny
        /><ConfirmationAlways
        /><ConfirmationApprove
        /><ConfirmationError
      /></parts.Choices
      ><ConfirmationDetail
      /><ConfirmationOutcome
    />{/if}{/snippet}</parts.Root>
