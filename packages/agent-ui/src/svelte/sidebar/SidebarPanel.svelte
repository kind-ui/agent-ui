<!-- The panel, an `aside` named by the sidebar's `label`: a Resizable panel beside the page, else a drawer. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { KindDrawer, KindDrawerBackdrop, KindDrawerContent } from "../internal/drawer/index.js";
  import { KindResizablePanel } from "../internal/resizable/index.js";
  import { parts } from "./parts.js";

  type PanelProps = ComponentProps<typeof parts.Title>;
  type Handed = Parameters<NonNullable<PanelProps["render"]>>[0];

  let { render: own, ...props }: PanelProps = $props();
  // The Drawer keeps a local change to `open`; the sidebar owns it.
  const keep = () => {};
</script>

<parts.Title {...props}>
  {#snippet render(handed: Handed)}
    {@const { resizablePanel, drawer, drawerContent } = handed.state}
    <KindResizablePanel {...resizablePanel}>
      {#if handed.state.overlay}
        <KindDrawer
          bind:open={() => drawer.open, keep}
          side={drawer.side}
          modal={drawer.modal}
          onOpenChange={drawer.onOpenChange}
        >
          <KindDrawerBackdrop data-agent-hidden="" />
          <KindDrawerContent {...drawerContent}>{@render element(handed)}</KindDrawerContent>
        </KindDrawer>
      {:else}
        {@render element(handed)}
      {/if}
    </KindResizablePanel>
  {/snippet}
</parts.Title>

{#snippet element(handed: Handed)}
  {#if own}{@render own(handed)}{:else}<aside {...handed.props}>{@render handed.children?.(handed.state)}</aside>{/if}
{/snippet}
