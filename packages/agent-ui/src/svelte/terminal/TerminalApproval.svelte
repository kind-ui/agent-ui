<!--
  A Confirmation for the command's approval while it has one: Deny, Always allow and Approve while `onDeny`,
  `onAlwaysAllow` and `onApprove` are set and the request is open, then what was decided. Pass children to render it yourself.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { Confirmation } from "../confirmation/index.js";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Approval> = $props();
</script>

<parts.Approval {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<Confirmation
        approval={state.approval}
        label={state.label}
        reason={state.reason}
        focusFallback={state.focusFallback}
        motion={state.motion}
        onApprove={state.onApprove}
        onDeny={state.onDeny}
        onAlwaysAllow={state.onAlwaysAllow}
        approveLabel={state.approveLabel}
        alwaysLabel={state.alwaysLabel}
        alwaysTarget={state.alwaysTarget}
        alwaysScope={state.alwaysScope}
        alwaysDetail={state.alwaysDetail}
        risk={state.risk}
        riskText={state.riskText}
    />{/if}{/snippet}</parts.Approval>
