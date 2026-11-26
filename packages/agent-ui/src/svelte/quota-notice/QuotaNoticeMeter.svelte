<!-- UI SDK's Meter: a bar and the amounts, unless you pass a `children` snippet, which gets the Meter's props. -->
<script lang="ts">
  import type { QuotaNoticeMeterState } from "@kind-ui/agent-ui/core";
  import { Meter, MeterIndicator, MeterTrack, MeterValue } from "@ui-sdk/svelte/meter";
  import type { ComponentProps } from "svelte";
  import { parts } from "./index.js";

  let { children, ...props }: ComponentProps<typeof parts.Meter> = $props();
</script>

{#snippet meter(meter: QuotaNoticeMeterState)}<Meter
    value={meter.value}
    max={meter.max}
    locale={meter.locale}
    format={meter.format}
    getValueLabel={meter.getValueLabel}
    aria-label={meter.label}
    data-agent-hidden=""
    ><MeterTrack><MeterIndicator /></MeterTrack><MeterValue /></Meter
  >{/snippet}

<parts.Meter {...props} children={children ?? meter} />
