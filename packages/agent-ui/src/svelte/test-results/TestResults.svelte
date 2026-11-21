<!--
  A test run as a step: its duration in the header, its counts beside it, which filter the tests when pressed, over a
  tree of suites and tests in which a failed test opens to its message and stack trace. Any `children` replace the
  default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import TestResultsEmpty from "./TestResultsEmpty.svelte";
  import TestResultsFilter from "./TestResultsFilter.svelte";
  import TestResultsMeta from "./TestResultsMeta.svelte";
  import TestResultsTitle from "./TestResultsTitle.svelte";
  import TestResultsTree from "./TestResultsTree.svelte";

  let {
    children,
    open = $bindable(),
    filter = $bindable(),
    expanded = $bindable(),
    ...props
  }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet defaultParts()}
  <parts.Trigger>
    <parts.Icon />
    <TestResultsTitle />
    <TestResultsMeta />
  </parts.Trigger>
  <TestResultsFilter />
  <parts.Content>
    <div data-test-results-panel="">
      <TestResultsTree />
      <TestResultsEmpty />
    </div>
  </parts.Content>
{/snippet}

<parts.Root {...props} bind:open bind:filter bind:expanded children={children ?? defaultParts} />
