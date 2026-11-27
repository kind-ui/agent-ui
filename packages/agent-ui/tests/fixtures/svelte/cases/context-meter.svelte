<script module lang="ts">
  export const variants = [
    ...["all", "high", "full", "reduced", "german"],
    ...["breakdown", "limits", "near-cap", "compacting", "inline"],
  ];
</script>

<script lang="ts">
  import type { ContextMeterOptions } from "@kind-ui/agent-ui/core";
  import { ContextMeter } from "../../../../src/svelte/context-meter/index.js";
  import { expose } from "../../shared/expose.js";
  import { context, contextHost, levels, meterCases } from "../../shared/context-meter.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, record, compact } = contextHost();
  const initial = (): number =>
    variant === "high" ? levels.high : variant === "full" ? levels.full : context.used;
  let used = $state(initial());
  const extra: ContextMeterOptions | undefined = $derived(meterCases[variant as keyof typeof meterCases]);
  expose({ kindHost: { ...host, setUsed: (value: number) => (used = value) } });
</script>

<div class={`flex flex-col items-start gap-4 p-6 ${extra?.layout === "inline" ? "w-[32rem]" : ""}`}>
  <p id="above">Above</p
  ><div class="flex items-center gap-2">
    <ContextMeter
      id="context"
      {...context}
      {used}
      onOpenChange={record}
      motion={variant === "reduced" ? "reduced" : undefined}
      locale={variant === "german" ? "de-DE" : undefined}
      {...extra && { onCompact: compact, ...extra }}
    /><span id="beside">Beside</span>
  </div>
</div>
