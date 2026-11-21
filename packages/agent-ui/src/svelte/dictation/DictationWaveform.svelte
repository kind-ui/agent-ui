<!-- The waveform, one `DictationBar` per level unless you pass children. Shown while listening. -->
<script lang="ts">
  import type { DictationWaveformState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Waveform> & { children?: Snippet<[DictationWaveformState]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Waveform {...props}>
  {#snippet children(state: DictationWaveformState)}
    {#if content}{@render content(state)}{:else}
      {#each { length: state.bars }, i (i)}<parts.Bar value={String(i)} />{/each}
    {/if}
  {/snippet}
</parts.Waveform>
