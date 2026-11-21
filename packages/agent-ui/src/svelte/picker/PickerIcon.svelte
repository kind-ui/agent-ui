<!-- An icon a host passed: an image URL, or a snippet such as an inline `svg`. -->
<script lang="ts">
  import type { Snippet } from "svelte";

  let { icon }: { icon: unknown } = $props();
</script>

{#if typeof icon === "string"}<img src={icon} alt="" />{:else if typeof icon === "function"}{@render (icon as Snippet)()}{/if}
