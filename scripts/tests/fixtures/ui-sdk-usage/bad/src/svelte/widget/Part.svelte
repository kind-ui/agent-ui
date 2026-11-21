<script lang="ts">
// biome-ignore lint/correctness/noUnusedVariables: the markup renders it
let { children } = $props();
</script>

<div onkeydown={() => undefined}>{@render children?.()}</div>
