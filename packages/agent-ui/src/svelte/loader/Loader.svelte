<!-- A polite status: three flowing dots beside its `label`, "Loading…" by default. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./index.js";

  let props: ComponentProps<typeof parts.Root> & { children?: never } = $props();
</script>

<parts.Root {...props}>
  <parts.Dots>
    <parts.Dot
    /><parts.Dot
    /><parts.Dot />
  </parts.Dots
  ><parts.Label>{#snippet children({ label }: { label: string })}{label}{/snippet}</parts.Label>
</parts.Root>
