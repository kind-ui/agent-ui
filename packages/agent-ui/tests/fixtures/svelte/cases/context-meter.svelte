<script module lang="ts">
  export const variants = ["all", "high", "full", "reduced", "german", "breakdown"];
</script>

<script lang="ts">
  import { ContextMeter } from "../../../../src/svelte/context-meter/index.js";
  import { expose } from "../../shared/expose.js";
  import { context, contextHost, levels } from "../../shared/context-meter.js";
  import { contextBreakdown } from "../../shared/usage-meter.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, record } = contextHost();
  const initial = (): number =>
    variant === "high" ? levels.high : variant === "full" ? levels.full : context.used;
  let used = $state(initial());
  expose({ kindHost: { ...host, setUsed: (value: number) => (used = value) } });
</script>

<div class="flex flex-col items-start gap-4 p-6">
  <p id="above">Above</p
  ><div class="flex items-center gap-2">
    <ContextMeter
      id="context"
      {...context}
      {used}
      onOpenChange={record}
      motion={variant === "reduced" ? "reduced" : undefined}
      locale={variant === "german" ? "de-DE" : undefined}
      breakdown={variant === "breakdown" ? contextBreakdown : undefined}
    /><span id="beside">Beside</span>
  </div>
</div>
