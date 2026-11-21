<script lang="ts">
  import { TestResults } from "../components/ui/svelte/test-results/index.js";
</script>

<TestResults
  defaultOpen
  suites={[
    {
      id: "math",
      name: "math",
      tests: [
        { id: "sum", name: "adds", status: "pass", durationMs: 2 },
        { id: "div", name: "divides", status: "fail", error: { message: "Error: divided by zero" } },
      ],
    },
  ]}
/>
