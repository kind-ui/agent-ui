<!-- The row's header: the weekday's short name. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Weekday> = $props();
</script>

{#snippet words({ label }: { label: string })}{label}{/snippet}

<parts.Weekday {...props} children={children ?? words} />
