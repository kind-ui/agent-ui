<!--
  A trace as UI SDK Waterfall: every span a row with its kind, status, duration and bar on one time axis, nested spans
  that expand, and the selected span's details below. Only the rows in view render. Any `children` replace the
  viewport and details.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import TraceDetails from "./TraceDetails.svelte";
  import TraceViewport from "./TraceViewport.svelte";

  let {
    children,
    value = $bindable(),
    expanded = $bindable(),
    ...props
  }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}<TraceViewport /><TraceDetails />{/snippet}

<parts.Root {...props} bind:value bind:expanded children={children ?? fallback} />
