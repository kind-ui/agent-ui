import type { ActivityDay } from "@kind-ui/agent-ui";
import { ActivityGraph } from "@/components/ui/activity-graph";

const now = "2026-11-25";

// A year of an agent's runs: quieter on weekends, busier through the autumn.
const days: ActivityDay[] = Array.from({ length: 371 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 10, 25 - index)).toISOString().slice(0, 10);
  const weekend = [0, 6].includes(new Date(date).getUTCDay());
  const count = weekend ? index % 3 : Math.round(((index * 7) % 11) * (1 + (371 - index) / 371));
  return { date, count };
});

export default function ActivityGraphExample() {
  return <ActivityGraph days={days} now={now} timeZone="UTC" className="w-full max-w-3xl" />;
}
