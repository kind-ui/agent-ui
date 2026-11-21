<!-- The item whose `id` is `value`. Without children, it shows the item's mark, title and description. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import PlanItemDescription from "./PlanItemDescription.svelte";
  import PlanItemTitle from "./PlanItemTitle.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Item> = $props();
</script>

{#snippet defaultParts()}<parts.ItemIcon
  /><PlanItemTitle
  /><PlanItemDescription
/>{/snippet}<parts.Item {...props} children={children ?? defaultParts} />
