<!-- "Accepted" with a complete mark, in Accept's place once the plan is accepted, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Outcome> = $props();
</script>

<parts.Outcome {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<parts.OutcomeIcon
      />Accepted{/if}{/snippet}</parts.Outcome>
