<!-- The event's status mark, or a dot without a status. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.Marker> = $props();
</script>

<parts.Marker {...props} />
