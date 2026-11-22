<!-- The modes' radio items, a risky one marked "Risky". Choosing one closes the menu. -->
<script lang="ts">
  import type { ApprovalModeRow } from "@kind-ui/agent-ui/core";
  import { KindMenuItemContent, KindMenuItemIndicator, KindMenuRadioItem } from "../internal/menu/index.js";

  let { rows }: { rows: ApprovalModeRow[] } = $props();
</script>

{#each rows as row (row.value)}
  <KindMenuRadioItem value={row.value} label={row.label} closeOnSelect data-danger={row.danger ? "" : undefined}>
    <KindMenuItemIndicator keepMounted><span data-menu-check="" aria-hidden="true"></span></KindMenuItemIndicator
    ><KindMenuItemContent label={row.label} description={row.description}
    />{#if row.danger}<span data-approval-mode-risk="">Risky</span>{/if}
  </KindMenuRadioItem>
{/each}
