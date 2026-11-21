<!-- "↑↓ Navigate", "↵ Open" and "Esc Close" under the list, unless you pass children. Hidden on touch screens. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Hints>;

  let { children: content, ...props }: Props = $props();
</script>

<parts.Hints {...props}>
  {#snippet children(state: Parameters<NonNullable<Props["children"]>>[0])}
    {#if content}{@render content(state)}{:else}<span><kbd>↑↓</kbd> Navigate</span><span><kbd>↵</kbd> Open</span><span
        ><kbd>Esc</kbd> Close</span
      >{/if}
  {/snippet}
</parts.Hints>
