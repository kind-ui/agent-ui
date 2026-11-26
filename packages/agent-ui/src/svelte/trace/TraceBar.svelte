<!-- A span's bar on the time axis. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.Bar> = $props();
</script>

<parts.Bar {...props} />
