<script module lang="ts">
  export const variants = ["all", "reduced"];
</script>

<script lang="ts">
  import type { TaskOptions } from "@kind-ui/agent-ui/core";
  import { Task } from "../../../../src/svelte/task/index.js";
  import { expose } from "../../shared/expose.js";

  type Item = NonNullable<TaskOptions["items"]>[number];

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  let items: Item[] = $state.raw([
    { id: "schema", status: "complete", title: "Read the schema", files: ["db/schema.sql"] },
    { id: "migrate", status: "running", title: "Write the migration", files: ["db/migrations/0042_users.sql"] },
    { id: "tests", status: "pending", title: "Run the tests" },
  ]);

  expose({
    kindItems: {
      setStatus: (id: string, status: Item["status"]) =>
        (items = items.map((item) => (item.id === id ? { ...item, status } : item))),
      append: (item: Item) => (items = [...items, item]),
      remove: (id: string) => (items = items.filter((item) => item.id !== id)),
    },
  });
</script>

<div class="flex w-[28rem] flex-col gap-4 p-6">
  <Task id="task" label="Migrating the users table" {items} motion={variant === "reduced" ? "reduced" : undefined} />
</div>
