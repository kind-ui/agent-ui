<!-- A span's name and status mark, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import TraceStatus from "./TraceStatus.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Name> = $props();
</script>

{#snippet fallback({ id, name }: { id: string; name: string })}<span data-trace-label="">{name}</span>{" "}<TraceStatus
    value={id}
  />{/snippet}

<parts.Name {...props} children={children ?? fallback} />
