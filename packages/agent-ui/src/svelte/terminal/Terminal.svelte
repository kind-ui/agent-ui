<!--
  A command and its output as a step: the command, its exit code and duration, its approval while it has one, then
  the output with its ANSI colors, following its end while it streams. Any `children` replace the default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import TerminalApproval from "./TerminalApproval.svelte";
  import TerminalCommand from "./TerminalCommand.svelte";
  import TerminalExit from "./TerminalExit.svelte";
  import TerminalJump from "./TerminalJump.svelte";
  import TerminalMeta from "./TerminalMeta.svelte";
  import TerminalOutput from "./TerminalOutput.svelte";
  import TerminalTitle from "./TerminalTitle.svelte";

  let { children, open = $bindable(), ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}<parts.Trigger
    ><parts.Icon /><TerminalTitle /><TerminalExit /><TerminalMeta /></parts.Trigger
  ><TerminalApproval
  /><parts.Content
    ><div data-terminal-screen="" data-kind-code=""
      ><div data-terminal-header=""><TerminalCommand /><parts.Copy /></div
      ><parts.Viewport><TerminalOutput /></parts.Viewport><TerminalJump /></div
    ></parts.Content
  >{/snippet}

<parts.Root {...props} bind:open children={children ?? fallback} />
