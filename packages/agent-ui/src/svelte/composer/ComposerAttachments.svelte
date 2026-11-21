<!-- The draft's attachments, hidden while there are none. -->
<script lang="ts">
  import type { ComposerAttachmentsState } from "@kind-ui/agent-ui/core";
  import { Attachments, type AttachmentsProps } from "../attachments/index.js";
  import { parts } from "./parts.js";

  let props: Omit<AttachmentsProps, "items" | "onRemove" | "focusFallback" | "motion"> = $props();
</script>

<parts.Attachments>
  {#snippet children({ items, motion, focusFallback, onRemove }: ComposerAttachmentsState)}
    <!-- Part state is read one key at a time, so it can't be spread. -->
    <Attachments aria-label="Attachments" {...props} {items} {motion} {focusFallback} {onRemove} />
  {/snippet}
</parts.Attachments>
