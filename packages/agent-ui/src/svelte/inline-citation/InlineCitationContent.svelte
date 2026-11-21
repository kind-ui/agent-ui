<!-- The card. Leaves focus on the marker when it opens. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.Content> = $props();
</script>

<parts.Content initialFocus="none" {...props} />
