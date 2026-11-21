import { ThreadSearch } from "../components/ui/solid/thread-search.js";

export default function ThreadSearchItem() {
  return (
    <ThreadSearch
      threads={[{ id: "t1", title: "Plan the launch", updatedAt: "2026-11-18T09:00:00Z" }]}
      now="2026-11-18"
      onSelect={() => {}}
    />
  );
}
