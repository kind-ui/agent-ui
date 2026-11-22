<script lang="ts">
  import { Tool } from "../components/ui/svelte/tool/index.js";
</script>

<Tool
  call={{
    toolCallId: "t1",
    name: "search_docs",
    dynamic: false,
    input: { state: "ready", value: { query: "steps" } },
    output: { state: "available", value: 0 },
  }}
  defaultOpen
/>
