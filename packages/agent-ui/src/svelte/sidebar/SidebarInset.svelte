<!-- The page beside the panel. It stays in the same Resizable panel at every width, so it never mounts again. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { KindResizablePanel } from "../internal/resizable/index.js";
  import { parts } from "./parts.js";

  type InsetProps = ComponentProps<typeof parts.Inset>;
  type Handed = Parameters<NonNullable<InsetProps["render"]>>[0];

  let { render: own, ...props }: InsetProps = $props();
</script>

<parts.Inset {...props}>
  {#snippet render(handed: Handed)}
    <KindResizablePanel {...handed.state.resizablePanel}>
      {#if own}{@render own(handed)}{:else}<div {...handed.props}>{@render handed.children?.(handed.state)}</div>{/if}
    </KindResizablePanel>
  {/snippet}
</parts.Inset>
