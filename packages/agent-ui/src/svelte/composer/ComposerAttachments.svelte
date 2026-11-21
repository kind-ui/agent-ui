<!-- The draft's attachments, hidden while there are none. -->
<script lang="ts">
  import { Attachments, type AttachmentsProps } from "../attachments/index.js";
  import { parts } from "./parts.js";

  type Owned = "items" | "onRemove" | "focusFallback" | "motion";
  let props: { [K in keyof AttachmentsProps as K extends Owned ? never : K]: AttachmentsProps[K] } = $props();
</script>

<parts.Attachments>
  {#snippet children({ items, motion, focusFallback, onRemove })}
    <!-- Part state is read one key at a time, so it can't be spread. -->
    <Attachments aria-label="Attachments" {...props} {items} {motion} {focusFallback} {onRemove} />
  {/snippet}
</parts.Attachments>
