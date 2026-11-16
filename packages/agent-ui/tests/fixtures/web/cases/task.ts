import type { TaskOptions } from "@kind-ui/agent-ui/core";
import { defineTask } from "../../../../src/web/task.js";

type Item = NonNullable<TaskOptions["items"]>[number];

const initial: Item[] = [
  { id: "schema", status: "complete", title: "Read the schema", files: ["db/schema.sql"] },
  { id: "migrate", status: "running", title: "Write the migration", files: ["db/migrations/0042_users.sql"] },
  { id: "tests", status: "pending", title: "Run the tests" },
];

const tasks = (motion?: TaskOptions["motion"]) => (root: HTMLElement) => {
  defineTask();
  const page = document.createElement("div");
  page.className = "flex w-[28rem] flex-col gap-4 p-6";
  const task = document.createElement("kind-task");
  task.id = "task";
  Object.assign(task, { label: "Migrating the users table", items: initial });
  if (motion) task.motion = motion;
  page.append(task);
  root.append(page);
  const items = () => task.items ?? [];
  Object.assign(window, {
    kindItems: {
      setStatus: (id: string, status: Item["status"]) => {
        task.items = items().map((item) => (item.id === id ? { ...item, status } : item));
      },
      append: (item: Item) => {
        task.items = [...items(), item];
      },
      remove: (id: string) => {
        task.items = items().filter((item) => item.id !== id);
      },
    },
  });
};

export const cases = { all: tasks(), reduced: tasks("reduced") };
