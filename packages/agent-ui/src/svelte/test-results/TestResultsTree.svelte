<!-- The suites and tests as a UI SDK Tree, with a row for each, unless you pass children. -->
<script lang="ts">
  import type { TestResultsTreeState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { KindTree } from "../internal/tree/index.js";
  import { parts } from "./parts.js";
  import TestResultsRows from "./TestResultsRows.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Tree> = $props();
</script>

{#snippet fallback(tree: TestResultsTreeState)}
  <KindTree
    controller={tree.controller}
    items={tree.items}
    defaultExpanded={tree.defaultExpanded}
    aria-label={tree["aria-label"]}
    mode={tree.mode}
    hiddenUntilFound={tree.hiddenUntilFound}
  >
    <TestResultsRows items={tree.items} />
  </KindTree>
{/snippet}

<parts.Tree {...props} children={children ?? fallback} />
