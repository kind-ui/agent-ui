<script lang="ts">
  import { GuardrailNotice } from "@/components/ui/svelte/guardrail-notice/index.js";

  let shown = $state(true);
</script>

<div class="flex w-full max-w-xl flex-col gap-3">
  {#if shown}
    <GuardrailNotice
      blocking
      label="Model output withheld"
      reason="The response included personal data."
      detail="Your organization's policy blocks responses that contain email addresses or phone numbers."
      onDismiss={() => (shown = false)}
    />
  {:else}
    <button
      type="button"
      class="self-start rounded-md border border-[var(--kind-color-border)] px-2.5 py-1 text-sm"
      onclick={() => (shown = true)}
    >
      Show the notice again
    </button>
  {/if}
  <GuardrailNotice
    variant="info"
    label="Some results hidden"
    reason="Two search results matched a content filter."
    detail="Filtered results come from sites your organization has blocked."
  />
</div>
