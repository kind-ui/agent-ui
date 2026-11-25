<script lang="ts">
  import { QuotaNotice } from "@/components/ui/svelte/quota-notice/index.js";

  let used = $state(800);
  let shown = $state(true);
</script>

<div class="flex w-full max-w-xl flex-col items-start gap-3">
  {#if shown}
    <QuotaNotice
      class="w-full"
      {used}
      limit={1000}
      period="this month"
      now="2026-11-28T09:00:00Z"
      resetAt="2026-12-01T09:00:00Z"
      onUpgrade={() => window.alert("Upgrade")}
      onDismiss={() => (shown = false)}
    />
  {/if}
  <button
    type="button"
    class="rounded-md border border-[var(--kind-color-border)] px-2.5 py-1 text-sm"
    onclick={() => {
      shown = true;
      used = used >= 1000 ? 800 : used + 100;
    }}
  >
    {used >= 1000 ? "Start over" : "Send 100 requests"}
  </button>
</div>
