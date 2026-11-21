<script lang="ts">
  import { Task } from "../components/ui/svelte/task/index.js";
</script>

<Task
  label="Migrating the users table"
  items={[{ id: "schema", status: "complete", title: "Read the schema", files: ["db/schema.sql"] }]}
  defaultOpen
/>
