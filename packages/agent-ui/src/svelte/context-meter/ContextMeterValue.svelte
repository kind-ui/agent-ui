<!-- UI SDK's Meter: a ring and the percentage, unless you pass children, a snippet that gets the Meter's props. -->
<script lang="ts">
  import type { ContextMeterValueState } from "@kind-ui/agent-ui/core";
  import { Meter, MeterTrack, MeterValue } from "@ui-sdk/svelte/meter";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Value> & { children?: Snippet<[ContextMeterValueState]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Value {...props}>
  {#snippet children(meter: ContextMeterValueState)}
    {#if content}{@render content(meter)}{:else}
      <Meter
        value={meter.value}
        max={meter.max}
        locale={meter.locale}
        getValueLabel={meter.getValueLabel}
        aria-label={meter.label}
        data-agent-hidden=""
      >
        <MeterTrack />
        <MeterValue />
      </Meter>
    {/if}
  {/snippet}
</parts.Value>
