<!--
  The steps an agent plans to take, with how many are done and, while `onAccept` is set, an Accept button that
  "Accepted" replaces. Any `children` replace the default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import PlanAccept from "./PlanAccept.svelte";
  import PlanList from "./PlanList.svelte";
  import PlanMeta from "./PlanMeta.svelte";
  import PlanOutcome from "./PlanOutcome.svelte";
  import PlanTitle from "./PlanTitle.svelte";
  import { parts } from "./parts.js";

  let { children: content, open = $bindable(), ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

<parts.Root {...props} bind:open
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<parts.Trigger
        ><parts.Icon
        /><PlanTitle
        /><PlanMeta
      /></parts.Trigger
      ><parts.Content
        ><PlanList
      /></parts.Content
      ><PlanAccept
      /><PlanOutcome
    />{/if}{/snippet}</parts.Root>
