<!--
  One agent handing the conversation to another agent or a person: both avatars, "<from> handed off to <to>", the
  reason as a quote, the status in words with its mark, and a Confirmation while there's an approval. Any `children`
  replace the default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import HandoffApproval from "./HandoffApproval.svelte";
  import HandoffFromAvatar from "./HandoffFromAvatar.svelte";
  import HandoffReason from "./HandoffReason.svelte";
  import HandoffStatus from "./HandoffStatus.svelte";
  import HandoffText from "./HandoffText.svelte";
  import HandoffToAvatar from "./HandoffToAvatar.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}<HandoffFromAvatar /><HandoffToAvatar /><HandoffText /><HandoffStatus /><HandoffReason
  /><HandoffApproval />{/snippet}

<parts.Root {...props} children={children ?? fallback} />
