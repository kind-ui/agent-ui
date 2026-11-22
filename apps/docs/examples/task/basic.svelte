<script lang="ts">
  import { Task } from "@/components/ui/svelte/task/index.js";
</script>

<Task
  label="Add rate limiting to the API"
  items={[
    { id: "read", status: "complete", title: "Read the request handlers", files: ["src/server.ts"] },
    {
      id: "middleware",
      status: "running",
      title: "Write the rate limit middleware",
      files: ["src/middleware/rate-limit.ts"],
    },
    { id: "tests", status: "pending", title: "Add tests for the limits" },
  ]}
/>
