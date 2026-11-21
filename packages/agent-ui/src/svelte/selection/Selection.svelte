<!-- Wraps a reply so selecting text in it shows a toolbar of `actions` above the selection. The `children` are the reply. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";
  import SelectionToolbar from "./SelectionToolbar.svelte";

  type Props = ComponentProps<typeof parts.Root> & { children?: Snippet };

  let { children, ...props }: Props = $props();
</script>

<parts.Root {...props}>
  <parts.Content>{@render children?.()}</parts.Content>
  <SelectionToolbar />
</parts.Root>
