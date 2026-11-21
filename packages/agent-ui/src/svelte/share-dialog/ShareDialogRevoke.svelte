<!-- Calls `onRevoke`. "Stop sharing", or "Stopping" with a running mark while pending, unless you pass children. -->
<script lang="ts">
  import type { ShareDialogActionState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Revoke> & { children?: Snippet<[ShareDialogActionState]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Revoke {...props}>
  {#snippet children(state: ShareDialogActionState)}
    {#if content}{@render content(state)}{:else if state.pending}
      <span aria-hidden="true" data-status-mark="" data-status="running" data-motion={state.motion}></span>Stopping
    {:else}Stop sharing{/if}
  {/snippet}
</parts.Revoke>
