<!-- The host name of the source's `url`, unless you pass children. Rendered only with a safe `url`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Host> = $props();
</script>

{#snippet fallback({ host }: { host: string })}{host}{/snippet}

<parts.Host {...props} children={children ?? fallback} />
