<!--
  The sources a response used, as "Used N sources" that opens a list of links. Any `children` replace the default
  trigger and content.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import SourcesList from "./SourcesList.svelte";
  import SourcesTrigger from "./SourcesTrigger.svelte";

  let { children, open = $bindable(), ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}
  <SourcesTrigger />
  <parts.Content>
    <SourcesList />
  </parts.Content>
{/snippet}

<parts.Root {...props} bind:open children={children ?? fallback} />
