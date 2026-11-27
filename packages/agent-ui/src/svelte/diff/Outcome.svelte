<!-- A decision's words, after a running mark while it's sent. -->
<script lang="ts">
  let { text, working }: { text: string; working: boolean } = $props();
</script>

{#if working}<span data-status-mark="" data-status="running" aria-hidden="true"></span>{/if}{text}
