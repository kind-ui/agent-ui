<!--
  An action, whose `value` is its `id`. Wrap a `KindToolbarButton`, or leave it empty for one with the action's label.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { KindToolbarButton } from "../internal/toolbar/index.js";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Item> = $props();
</script>

{#snippet fallback({ label, description, canRun }: { label: string; description?: string; canRun: boolean })}
  <KindToolbarButton disabled={!canRun} title={description}>{label}</KindToolbarButton>
{/snippet}

<parts.Item {...props} children={children ?? fallback} />
