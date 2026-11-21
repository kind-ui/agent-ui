<script lang="ts">
// biome-ignore lint/correctness/noUnusedVariables: the markup renders it
let { children } = $props();
</script>

<span aria-hidden="true"></span>{@render children?.()}
