<!-- The row after "Done"'s threads: "12 more done", which shows a page more, then "Show less". -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.FoldRow> = $props();
</script>

<parts.FoldRow {...props}>
  <parts.FoldCell value={props.value}>
    <parts.Fold value={props.value}>
      {#snippet children({ label }: { label: string })}<span data-thread-list-icon="fold" aria-hidden="true"
        ></span>{label}{/snippet}
    </parts.Fold>
  </parts.FoldCell>
</parts.FoldRow>
