<!--
  A tool call as a step: its name and status, then its input, output or error, and its approval. Any `children`
  replace the default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import ToolApproval from "./ToolApproval.svelte";
  import ToolError from "./ToolError.svelte";
  import ToolInput from "./ToolInput.svelte";
  import ToolMeta from "./ToolMeta.svelte";
  import ToolOutput from "./ToolOutput.svelte";
  import ToolTitle from "./ToolTitle.svelte";

  let { children: content, open = $bindable(), ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

<parts.Root {...props} bind:open
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<parts.Trigger
        ><parts.Icon
        /><ToolTitle
        /><ToolMeta
      /></parts.Trigger
      ><parts.Content
        ><ToolInput
        /><ToolOutput
        /><ToolError
      /></parts.Content
      ><ToolApproval
    />{/if}{/snippet}</parts.Root>
