<!-- "Listening" or the words heard so far, "Transcribing", or the error, with its mark unless you pass children. -->
<script lang="ts">
  import type { DictationStatusState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Status> & { children?: Snippet<[DictationStatusState]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Status {...props}>
  {#snippet children(state: DictationStatusState)}
    {#if content}{@render content(state)}{:else}<parts.StatusIcon /><span data-dictation-text="">{state.text}</span>{/if}
  {/snippet}
</parts.Status>
