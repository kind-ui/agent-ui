<!--
  An error as a step: its name and message, then its frames, with consecutive library frames folded into one row.
  Any `children` replace the default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import StackTraceList from "./StackTraceList.svelte";
  import StackTraceMessage from "./StackTraceMessage.svelte";
  import StackTraceTitle from "./StackTraceTitle.svelte";

  let {
    children,
    open = $bindable(),
    showLibraryFrames = $bindable(),
    ...props
  }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet defaultParts()}
  <parts.Trigger>
    <parts.Icon
    /><StackTraceTitle />
  </parts.Trigger
  ><parts.Content>
    <div data-stack-trace-panel="" data-kind-code="">
      <StackTraceMessage
      /><StackTraceList
      /><parts.Copy />
    </div>
  </parts.Content>
{/snippet}

<parts.Root {...props} bind:open bind:showLibraryFrames children={children ?? defaultParts} />
