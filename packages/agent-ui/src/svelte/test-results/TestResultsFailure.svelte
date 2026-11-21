<!-- A failed test's message and stack trace, as a Stack Trace, unless you pass children. Its `value` is the test's. -->
<script lang="ts">
  import type { TestResultsFailureState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { StackTrace } from "../stack-trace/index.js";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Failure> = $props();
</script>

{#snippet fallback(state: TestResultsFailureState)}
  <StackTrace message={state.message || undefined} stack={state.stack} autoOpen="never" motion={state.motion} />
{/snippet}

<parts.Failure {...props} children={children ?? fallback} />
