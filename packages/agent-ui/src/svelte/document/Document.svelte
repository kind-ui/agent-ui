<!--
  A document as a card: its title, kind and size, Copy and Download, and a preview that expands. Any `children`
  replace the default header and body.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import DocumentBody from "./DocumentBody.svelte";
  import DocumentMeta from "./DocumentMeta.svelte";
  import DocumentTitle from "./DocumentTitle.svelte";
  import DocumentToolbar from "./DocumentToolbar.svelte";
  import { parts } from "./parts.js";

  let { children, open = $bindable(), ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}
  <parts.Header>
    <DocumentTitle
    /><DocumentMeta
    /><DocumentToolbar />
  </parts.Header
  ><DocumentBody />
{/snippet}

<parts.Root {...props} bind:open children={children ?? fallback} />
