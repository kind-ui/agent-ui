<!--
  A marker in the conversation that a person can restore. Restore opens a dialog that asks before calling
  `onRestore`. Any `children` replace the default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import CheckpointDescription from "./CheckpointDescription.svelte";
  import CheckpointLabel from "./CheckpointLabel.svelte";
  import CheckpointRestore from "./CheckpointRestore.svelte";
  import CheckpointRestored from "./CheckpointRestored.svelte";
  import { parts } from "./parts.js";

  let { children, open = $bindable(), ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}
  <CheckpointLabel
  /><CheckpointDescription
  /><parts.Line
  /><CheckpointRestore
  /><CheckpointRestored />
{/snippet}

<parts.Root {...props} bind:open children={children ?? fallback} />
