<!-- Text with its backticks as `code`. -->
<script lang="ts">
  import { codeSpans } from "@kind-ui/agent-ui/core";

  let { text }: { text: string } = $props();
</script>

{#each codeSpans(text) as piece, index}{#if index % 2}<code>{piece}</code>{:else}{piece}{/if}{/each}
