<!--
  A toggle button for the tests with its `value` (`"pass"`, `"fail"` or `"skip"`): pressing it shows only those, and
  pressing it again shows every test. "3 passed", unless you pass children.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Count> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.Count {...props} children={children ?? fallback} />
