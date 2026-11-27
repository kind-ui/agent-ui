<!-- A UI SDK Meter per limit, with its share used, reset and pace. Rendered only with `limits`. -->
<script lang="ts">
  import type { ContextLimitRow } from "@kind-ui/agent-ui/core";
  import { Meter, MeterIndicator, MeterLabel, MeterTrack, MeterValue } from "@ui-sdk/svelte/meter";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Limits> & { children?: Snippet<[{ limits: ContextLimitRow[] }]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Limits {...props}>
  {#snippet children(state: { limits: ContextLimitRow[] })}
    {#if content}{@render content(state)}{:else}
      {#each state.limits as limit (limit.id)}
        <Meter
          value={limit.value}
          max={limit.max}
          getValueLabel={() => limit.valueText}
          data-agent-hidden=""
          data-level={limit.low ? "high" : "normal"}
        >
          <MeterLabel>{limit.label}</MeterLabel
          ><MeterValue>{limit.percent}</MeterValue
          ><MeterTrack
            data-pace={limit.pace === undefined ? undefined : ""}
            style={limit.pace === undefined ? undefined : `--kind-limit-pace: ${limit.pace * 100}%`}
            ><MeterIndicator /></MeterTrack
          >{#if limit.detail}<span data-context-meter-detail="">{limit.detail}</span>{/if}
        </Meter>
      {/each}
    {/if}
  {/snippet}
</parts.Limits>
