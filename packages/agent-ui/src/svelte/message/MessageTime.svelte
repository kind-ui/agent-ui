<!-- A `<time>` of `createdAt`: the time of day, with the date when it isn't today. -->
<script lang="ts">
  import type { MessageTimeState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: Omit<ComponentProps<typeof parts.Time>, "children"> = $props();
</script>

<parts.Time {...props}>
  {#snippet children({ label }: MessageTimeState)}{label}{/snippet}
</parts.Time>
