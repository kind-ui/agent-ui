<!-- The command after its prompt, which the stylesheet draws, unless you pass children. Present only while a `label` replaces the command as the title. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Command> = $props();
</script>

{#snippet fallback({ command }: { command: string })}{command}{/snippet}

<parts.Command {...props} children={children ?? fallback} />
