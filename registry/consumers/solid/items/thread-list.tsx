import { ThreadList } from "../components/ui/solid/thread-list.js";

export default function ThreadListItem() {
  return (
    <ThreadList threads={[{ id: "a", title: "First chat", href: "#a" }]} now="2026-11-18" onNew={() => {}} />
  );
}
