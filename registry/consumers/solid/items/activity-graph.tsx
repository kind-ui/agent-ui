import { ActivityGraph } from "../components/ui/solid/activity-graph.js";

export default function ActivityGraphItem() {
  return <ActivityGraph days={[{ date: "2026-11-18", count: 3 }]} now="2026-11-18" />;
}
