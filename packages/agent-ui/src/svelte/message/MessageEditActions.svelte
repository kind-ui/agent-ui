<!-- Cancel and Save, shown while the message is edited. Enter and Escape do the same. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import MessageEditCancel from "./MessageEditCancel.svelte";
  import MessageEditSave from "./MessageEditSave.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.EditActions> = $props();
</script>

{#snippet actions()}
  <MessageEditCancel
  /><MessageEditSave />
{/snippet}

<parts.EditActions {...props} children={children ?? actions} />
