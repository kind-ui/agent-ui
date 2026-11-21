import { createSignal } from "solid-js";
import { Queue } from "@/components/ui/solid/queue";

const todo = [
  { id: "limits", status: "pending" as const, title: "Add tests for the limits" },
  {
    id: "docs",
    status: "pending" as const,
    title: "Document the rate limit headers",
    description: "README and the API reference",
  },
  { id: "changelog", status: "pending" as const, title: "Write the changelog entry" },
  { id: "middleware", status: "complete" as const, title: "Write the rate limit middleware" },
  { id: "read", status: "complete" as const, title: "Read the request handlers" },
];

export default function QueueExample() {
  const [items, setItems] = createSignal(todo);

  return (
    <Queue
      label="Agent queue"
      items={items()}
      onReorder={(id, { index }) =>
        setItems((current) => {
          const moved = current.find((item) => item.id === id);
          if (!moved) return current;
          const rest = current.filter((item) => item !== moved);
          return [...rest.slice(0, index), moved, ...rest.slice(index)];
        })
      }
      onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
    />
  );
}
