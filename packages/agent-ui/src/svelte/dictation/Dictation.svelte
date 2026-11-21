<!--
  A mic button that turns speech into text through a host's `source`. While listening it shows a waveform, the words
  heard so far, Cancel and Stop, in the same box. Any `children` replace those parts.
-->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import DictationStatus from "./DictationStatus.svelte";
  import DictationWaveform from "./DictationWaveform.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Root> & { children?: Snippet };

  let { children, ...props }: Props = $props();
</script>

<parts.Root {...props}>
  {#if children}{@render children()}{:else}
    <DictationWaveform />
    <DictationStatus />
    <parts.Start />
    <parts.Cancel />
    <parts.Stop />
  {/if}
</parts.Root>
