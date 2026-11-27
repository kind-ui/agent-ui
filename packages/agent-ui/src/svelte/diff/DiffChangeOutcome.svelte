<!-- The change's "Kept", "Undone", "Keeping…" or "Undoing…", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import Outcome from "./Outcome.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.ChangeOutcome> = $props();
</script>

{#snippet fallback({ text, working }: { text: string; working: boolean })}<Outcome {text} {working} />{/snippet}

<parts.ChangeOutcome {...props} children={children ?? fallback} />
