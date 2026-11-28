<!-- A line: its numbers, its sign and its code, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import DiffCode from "./DiffCode.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Line> = $props();
</script>

{#snippet fallback()}<parts.OldNumber /><parts.NewNumber /><parts.Sign /><DiffCode />{/snippet}

<parts.Line {...props} children={children ?? fallback} />
