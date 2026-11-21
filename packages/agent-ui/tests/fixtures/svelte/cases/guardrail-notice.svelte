<script module lang="ts">
  export const variants = ["all", "reduced", "refused"];
</script>

<script lang="ts">
  import type { MotionMode } from "@kind-ui/agent-ui/core";
  import { GuardrailNotice } from "../../../../src/svelte/guardrail-notice/index.js";
  import { expose } from "../../shared/expose.js";
  import { guardrails, noticeHost } from "../../shared/notice.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const motion: MotionMode | undefined = $derived(variant === "reduced" ? "reduced" : undefined);
  const refuse = $derived(variant === "refused");
  const { host, dismissed } = noticeHost();
  let shown = $state({ blocking: true, filtered: true, late: false });

  expose({ kindHost: Object.assign(host, { add: () => (shown.late = true) }) });

  const dismiss = (id: keyof typeof shown) => async () => {
    await dismissed(id);
    shown[id] = false;
  };
</script>

<div class="flex w-[30rem] flex-col gap-3 p-6">
  <button id="above" type="button">Above</button>
  {#if shown.blocking}
    {#if refuse}
      <GuardrailNotice
        id="guardrail-blocking"
        {...guardrails.blocking}
        blocking
        {motion}
        onDismiss={dismiss("blocking")}
        open={false}
        onOpenChange={(_open: boolean, details: { reason: string }) => host.openings.push(details.reason)}
      />
    {:else}
      <GuardrailNotice id="guardrail-blocking" {...guardrails.blocking} blocking {motion} onDismiss={dismiss("blocking")} />
    {/if}
  {/if}
  {#if shown.filtered}
    <GuardrailNotice id="guardrail-filtered" variant="info" {...guardrails.filtered} {motion} />
  {/if}
  {#if shown.late}
    <GuardrailNotice id="guardrail-late" label="Request blocked" reason="The prompt asked for malware." blocking />
  {/if}
  <button id="below" type="button">Below</button>
</div>
