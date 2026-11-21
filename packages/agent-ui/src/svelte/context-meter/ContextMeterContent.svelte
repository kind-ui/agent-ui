<!-- The details: the title, the value and each count, unless you pass children. Leaves focus on the trigger. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import ContextMeterDescription from "./ContextMeterDescription.svelte";
  import ContextMeterRows from "./ContextMeterRows.svelte";
  import ContextMeterTitle from "./ContextMeterTitle.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Content> & { children?: Snippet };

  let { children, ...props }: Props = $props();
</script>

<parts.Content initialFocus="none" {...props}>
  {#if children}{@render children()}{:else}<ContextMeterTitle /><ContextMeterDescription /><ContextMeterRows />{/if}
</parts.Content>
