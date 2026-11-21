<!--
  A box for the reason Deny sends, unless you pass children. Rendered with the `reason` option, once a person's Deny
  opens it.
-->
<script lang="ts">
  import type { ConfirmationReasonState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { KindTextarea } from "../internal/textarea/index.js";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Reason> = $props();
</script>

<parts.Reason {...props}>
  {#snippet children(state: ConfirmationReasonState)}
    {#if content}
      {@render content(state)}
    {:else}
      <KindTextarea
        controller={state.controller}
        readOnly={state.readOnly}
        aria-label="Reason for denying"
        placeholder="Add a reason (optional)"
        rows={2}
      />
    {/if}
  {/snippet}
</parts.Reason>
