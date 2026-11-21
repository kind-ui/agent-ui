<!--
  A Confirmation for the call's approval while it has one: Approve and Deny while `onApprove` and `onDeny` are set
  and the request is open, then what was decided. Pass children to render it yourself.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { Confirmation } from "../confirmation/index.js";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Approval> = $props();
</script>

<parts.Approval {...props}>
  {#snippet children(state)}
    {#if content}
      {@render content(state)}
    {:else}
      <Confirmation
        approval={state.approval}
        label={state.label}
        reason={state.reason}
        focusFallback={state.focusFallback}
        motion={state.motion}
        onApprove={state.onApprove}
        onDeny={state.onDeny}
      />
    {/if}
  {/snippet}
</parts.Approval>
