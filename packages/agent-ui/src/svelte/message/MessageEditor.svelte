<!-- Shown in place of the content while a user message is edited, with Cancel and Save after it unless you pass children. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import MessageEditActions from "./MessageEditActions.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Editor> & {
    /** What follows the text area: `<MessageEditActions />` by default. Pass an empty snippet for none. */
    children?: Snippet;
  };

  let { children, ...props }: Props = $props();
</script>

<parts.Editor {...props}
/>{#if children}{@render children()}{:else}<MessageEditActions />{/if}
