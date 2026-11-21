<!-- The `detail`, unless you pass a `children` snippet. Rendered only with a `detail`; find in page reaches it while hidden. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./index.js";

  let { children, ...props }: ComponentProps<typeof parts.Detail> = $props();
</script>

{#snippet detail({ detail }: { detail: string })}<p>{detail}</p>{/snippet}

<parts.Detail {...props} children={children ?? detail} />
