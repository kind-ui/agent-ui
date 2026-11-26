<!-- The `riskText` after a warning mark, unless you pass children. Rendered only while `riskText` is set. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import WithCode from "./WithCode.svelte";

  let { children: content, ...props }: ComponentProps<typeof parts.Risk> = $props();
</script>

<parts.Risk {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<parts.RiskIcon
      /><span><WithCode text={state.text} /></span>{/if}{/snippet}</parts.Risk>
