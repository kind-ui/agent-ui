import { Task } from "../components/ui/solid/task.js";

export default function TaskItem() {
  return (
    <Task
      label="Migrating the users table"
      items={[{ id: "schema", status: "complete", title: "Read the schema", files: ["db/schema.sql"] }]}
      defaultOpen
    />
  );
}
