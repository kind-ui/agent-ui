<!-- A month's short name over the week column its `value` names. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Month> = $props();
</script>

{#snippet words({ label }: { label: string })}{label}{/snippet}

<parts.Month {...props} children={children ?? words} />
