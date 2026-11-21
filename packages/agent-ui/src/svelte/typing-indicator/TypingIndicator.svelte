<!-- A polite status: three flowing dots where the reply will start. Its `label`, "Typing" by default, is for assistive technology. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./index.js";

  let props: ComponentProps<typeof parts.Root> & { children?: never } = $props();
</script>

<parts.Root {...props}>
  <parts.Label>{#snippet children({ label }: { label: string })}{label}{/snippet}</parts.Label>
  <parts.Dots>
    <parts.Dot />
    <parts.Dot />
    <parts.Dot />
  </parts.Dots>
</parts.Root>
