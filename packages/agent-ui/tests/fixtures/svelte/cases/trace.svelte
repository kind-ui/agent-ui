<script module lang="ts">
  export const variants = ["all", "running", "reduced", "refused", "many-50", "many-5000"];
</script>

<script lang="ts">
  import type { MotionMode } from "@kind-ui/agent-ui/core";
  import { flushSync, untrack } from "svelte";
  import { Trace } from "../../../../src/svelte/trace/index.js";
  import { expose } from "../../shared/expose.js";
  import { manySpans, runningSpans, spans, type TraceLog } from "../../shared/trace.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const log: TraceLog = { values: [], expanded: [] };
  const many = untrack(() => (variant.startsWith("many-") ? manySpans(Number(variant.slice(5))) : undefined));

  const running = $derived(variant === "running");
  const refuse = $derived(variant === "refused");
  const motion: MotionMode | undefined = $derived(variant === "reduced" ? "reduced" : undefined);

  let now = $state(4000);
  let value: string | null = $state(null);
  let expanded: string[] = $state.raw(many?.expanded ?? []);

  expose({
    kindLog: log,
    kindHost: { tick: (ms: number) => flushSync(() => (now = ms)) },
    kindTrace: {
      select: (id: string | null) => flushSync(() => (value = id)),
      toggle: (id: string) =>
        flushSync(
          () => (expanded = expanded.includes(id) ? expanded.filter((other) => other !== id) : [...expanded, id]),
        ),
    },
  });
</script>

{#if many}
  <!-- A fixed 400px column with a 600px viewport and 28px rows, so the same rows are in view at 50 spans as at 5,000. -->
  <div class="w-[400px]" style="--kind-trace-height: 600px">
    <Trace spans={many.spans} bind:value bind:expanded motion="none" />
  </div>
{:else}
  <div class="w-[44rem] max-w-full p-6">
    <Trace
      id="trace"
      label="Agent run"
      spans={running ? runningSpans : spans}
      now={running ? now : undefined}
      {motion}
      defaultExpanded={["run"]}
      onValueChange={(value, details) => {
        log.values.push(`${value} ${details.reason}`);
        if (refuse) details.cancel();
      }}
      onExpandedChange={(expanded, details) => {
        log.expanded.push(`${expanded.join(",")} ${details.reason}`);
        if (refuse) details.cancel();
      }}
    />
  </div>
{/if}
