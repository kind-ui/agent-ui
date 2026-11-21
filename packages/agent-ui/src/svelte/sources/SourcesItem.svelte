<!-- The source whose `id` is `value`. Without children, it shows a link to it and its snippet. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import SourcesHost from "./SourcesHost.svelte";
  import SourcesIcon from "./SourcesIcon.svelte";
  import SourcesSnippet from "./SourcesSnippet.svelte";
  import SourcesTitle from "./SourcesTitle.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Item> = $props();
</script>

{#snippet fallback()}
  <parts.Link><SourcesIcon /><SourcesTitle /><SourcesHost /></parts.Link>
  <SourcesSnippet />
{/snippet}

<parts.Item {...props} children={children ?? fallback} />
