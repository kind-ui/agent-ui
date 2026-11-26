<!-- A span's status mark, named by its status. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.Status> = $props();
</script>

<parts.Status {...props} />
