import type { TaskOptions } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { Task } from "../../../../src/solid/task.js";
import { expose } from "../../shared/expose.js";

type Item = NonNullable<TaskOptions["items"]>[number];

const initial: Item[] = [
  { id: "schema", status: "complete", title: "Read the schema", files: ["db/schema.sql"] },
  { id: "migrate", status: "running", title: "Write the migration", files: ["db/migrations/0042_users.sql"] },
  { id: "tests", status: "pending", title: "Run the tests" },
];

function Tasks(props: { motion?: TaskOptions["motion"] }) {
  const [items, setItems] = createSignal(initial);
  onSettled(() =>
    expose({
      kindItems: {
        setStatus: (id: string, status: Item["status"]) =>
          setItems((all) => all.map((item) => (item.id === id ? { ...item, status } : item))),
        append: (item: Item) => setItems((all) => [...all, item]),
        remove: (id: string) => setItems((all) => all.filter((item) => item.id !== id)),
      },
    }),
  );
  return (
    <div class="flex w-[28rem] flex-col gap-4 p-6">
      <Task id="task" label="Migrating the users table" items={items()} motion={props.motion} />
    </div>
  );
}

export const cases = { all: () => <Tasks />, reduced: () => <Tasks motion="reduced" /> };
