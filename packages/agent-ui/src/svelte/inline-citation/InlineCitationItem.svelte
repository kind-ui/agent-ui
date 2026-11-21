<!--
  The source whose `id` is `value`. Without children, it shows its icon, title and host name, a link when its `url` is
  safe, then its snippet.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import InlineCitationHost from "./InlineCitationHost.svelte";
  import InlineCitationIcon from "./InlineCitationIcon.svelte";
  import InlineCitationSnippet from "./InlineCitationSnippet.svelte";
  import InlineCitationSourceTitle from "./InlineCitationSourceTitle.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Item> = $props();
</script>

{#snippet fallback()}
  <parts.Link><InlineCitationIcon /><InlineCitationSourceTitle /><InlineCitationHost /></parts.Link
  ><InlineCitationSnippet />
{/snippet}

<parts.Item {...props} children={children ?? fallback} />
