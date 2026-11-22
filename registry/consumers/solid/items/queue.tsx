import { Queue } from "../components/ui/solid/queue.js";

export default function QueueItem() {
  return <Queue label="Queue" items={[{ id: "tests", status: "pending", title: "Write the tests" }]} />;
}
