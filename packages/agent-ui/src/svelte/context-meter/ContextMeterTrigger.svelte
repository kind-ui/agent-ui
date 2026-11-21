<!-- Opens the details. Holds the meter unless you pass children. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import ContextMeterValue from "./ContextMeterValue.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Trigger> & { children?: Snippet };

  let { children, ...props }: Props = $props();
</script>

<parts.Trigger {...props}>
  {#if children}{@render children()}{:else}<ContextMeterValue />{/if}
</parts.Trigger>
