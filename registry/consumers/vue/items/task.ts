import { h } from "vue";
import { Task } from "../components/ui/vue/task.js";

export default () =>
  h(Task, {
    label: "Migrating the users table",
    items: [{ id: "schema", status: "complete", title: "Read the schema", files: ["db/schema.sql"] }],
    defaultOpen: true,
  });
