<!-- A chip's icon and label, and its remove control. -->
<script lang="ts">
  import type { ContextBarChipState } from "@kind-ui/agent-ui/core";
  import type { Snippet } from "svelte";

  let { chip, remove }: { chip: ContextBarChipState["chip"]; remove: Snippet } = $props();
  const icon = $derived(chip?.icon as string | Snippet | undefined);
</script>

{#if icon !== undefined}<span data-context-bar-icon=""
    >{#if typeof icon === "string"}<img src={icon} alt="" />{:else}{@render icon()}{/if}</span
  >{/if}<span data-context-bar-label="">{chip?.label}</span>{@render remove()}
