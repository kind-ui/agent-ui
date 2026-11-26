<!-- The `index`th row: its old and new numbers, its sign and its code, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import DiffCode from "./DiffCode.svelte";
  import DiffNewNumber from "./DiffNewNumber.svelte";
  import DiffOldNumber from "./DiffOldNumber.svelte";
  import DiffSign from "./DiffSign.svelte";
  import { parts } from "./parts.js";

  let { children, value, ...props }: ComponentProps<typeof parts.Row> = $props();
</script>

{#snippet fallback()}<DiffOldNumber /><DiffNewNumber /><DiffSign /><DiffCode />{/snippet}

<parts.Row value={value ?? String(props.index)} {...props} children={children ?? fallback} />
