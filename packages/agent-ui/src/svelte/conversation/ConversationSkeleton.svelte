<!-- Three placeholder rows while `status` is `"loading"`, unless you pass children. Hidden from assistive technology. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Skeleton> = $props();
</script>

{#snippet rows()}<span></span><span></span><span></span>{/snippet}

<parts.Skeleton {...props} children={children ?? rows} />
