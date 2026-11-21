<!-- The visually hidden status read while `status` is `"loading"`: "Loading conversation", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Loading> = $props();
</script>

{#snippet text()}Loading conversation{/snippet}

<parts.Loading {...props} children={children ?? text} />
